import { assertEquals } from '@std/assert';
import {
	Injectable,
	Middleware,
	Module,
	NotFoundException,
	SCOPE,
	UseGuard,
} from '@danet/core';
import type {
	AuthGuard,
	DanetMiddleware,
	ExecutionContext,
	NextFunction,
} from '@danet/core';
import {
	grpc,
	GrpcController,
	GrpcMetadata,
	GrpcMethod,
	GrpcPayload,
	GrpcServer,
	loadProto,
} from '@danet/grpc';
import { DanetApplication } from '@danet/core';

const protoPath = new URL('./greeter.proto', import.meta.url).pathname;
const proto = loadProto(protoPath);
const GreeterService = proto.greeter.Greeter;

class DenyGuard implements AuthGuard {
	canActivate(_context: ExecutionContext): boolean {
		return false;
	}
}

@Injectable({ scope: SCOPE.REQUEST })
class RequestCounter {
	count = 0;
	increment() {
		this.count++;
		return this.count;
	}
}

let middlewareRan = false;

@Injectable()
class TrackingMiddleware implements DanetMiddleware {
	async action(_ctx: ExecutionContext, next: NextFunction) {
		middlewareRan = true;
		await next();
	}
}

@Middleware(TrackingMiddleware)
@GrpcController(GreeterService.service)
class GreeterController {
	constructor(private counter: RequestCounter) {}

	@GrpcMethod()
	SayHello(@GrpcPayload() req: { name: string }) {
		return { message: `Hello ${req.name}` };
	}

	@UseGuard(DenyGuard)
	@GrpcMethod()
	Protected() {
		return { message: 'secret' };
	}

	@GrpcMethod()
	Boom() {
		throw new NotFoundException('does not exist');
	}

	@GrpcMethod()
	Meta(@GrpcMetadata('x-token') token: string) {
		return { message: `token=${token}` };
	}

	@GrpcMethod()
	Counter() {
		// REQUEST scope => a fresh RequestCounter per call => always 1.
		return { message: `count=${this.counter.increment()}` };
	}
}

@Module({ controllers: [GreeterController], injectables: [RequestCounter] })
class AppModule {}

// deno-lint-ignore no-explicit-any
function unaryCall(
	// deno-lint-ignore no-explicit-any
	client: any,
	method: string,
	payload: Record<string, unknown>,
	metadata?: Record<string, string>,
	// deno-lint-ignore no-explicit-any
): Promise<any> {
	return new Promise((resolve, reject) => {
		const md = new grpc.Metadata();
		if (metadata) {
			for (const [key, value] of Object.entries(metadata)) {
				md.set(key, value);
			}
		}
		// deno-lint-ignore no-explicit-any
		client[method](payload, md, (err: any, response: any) => {
			if (err) reject(err);
			else resolve(response);
		});
	});
}

Deno.test('gRPC transport', async (t) => {
	const app = new DanetApplication();
	const grpcServer = new GrpcServer(app);
	await app.init(AppModule);
	const port = await grpcServer.listen(0);

	const client = new GreeterService(
		`localhost:${port}`,
		grpc.credentials.createInsecure(),
	);

	await t.step('unary call resolves @GrpcPayload', async () => {
		const res = await unaryCall(client, 'SayHello', { name: 'Deno' });
		assertEquals(res.message, 'Hello Deno');
	});

	await t.step('middleware runs before the handler', () => {
		assertEquals(middlewareRan, true);
	});

	await t.step('resolves @GrpcMetadata', async () => {
		const res = await unaryCall(client, 'Meta', { name: 'x' }, {
			'x-token': 'abc123',
		});
		assertEquals(res.message, 'token=abc123');
	});

	await t.step('denied guard maps to PERMISSION_DENIED', async () => {
		try {
			await unaryCall(client, 'Protected', { name: 'x' });
			throw new Error('should have thrown');
		} catch (err) {
			assertEquals(
				(err as { code: number }).code,
				grpc.status.PERMISSION_DENIED,
			);
		}
	});

	await t.step('thrown HttpException maps to gRPC status', async () => {
		try {
			await unaryCall(client, 'Boom', { name: 'x' });
			throw new Error('should have thrown');
		} catch (err) {
			assertEquals((err as { code: number }).code, grpc.status.NOT_FOUND);
		}
	});

	await t.step('request scope gives a fresh instance per call', async () => {
		const first = await unaryCall(client, 'Counter', { name: 'x' });
		const second = await unaryCall(client, 'Counter', { name: 'x' });
		assertEquals(first.message, 'count=1');
		assertEquals(second.message, 'count=1');
	});

	client.close();
	grpcServer.forceShutdown();
	await app.close();
});
