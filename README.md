# @danet/grpc

Native gRPC transport for [Danet](https://danet.land), built on
[`@grpc/grpc-js`](https://www.npmjs.com/package/@grpc/grpc-js).

gRPC controllers reuse the entire Danet pipeline — dependency injection, guards,
middleware, exception filters, and parameter resolution — exactly like HTTP and
WebSocket controllers. The gRPC server binds its own port and runs alongside the
HTTP server.

> **Status:** unary RPCs (MVP). Server/client/bidi streaming, TLS credentials,
> and static proto codegen are planned. See _Limitations_ below.

## Requirements

- Deno **2.8+** (server-side gRPC needs `node:http2` trailer support).
- `@danet/core` **>= 2.11.0** (adds the `useTransport` hook this plugs into).

## Usage

`greeter.proto`:

```proto
syntax = "proto3";
package greeter;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
message HelloRequest { string name = 1; }
message HelloReply { string message = 1; }
```

```typescript
import { DanetApplication, Module } from '@danet/core';
import {
	GrpcController,
	GrpcMetadata,
	GrpcMethod,
	GrpcPayload,
	GrpcServer,
	loadProto,
} from '@danet/grpc';

const proto = loadProto('./greeter.proto');

@GrpcController(proto.greeter.Greeter.service)
class GreeterController {
	// Defaults to the method name; pass @GrpcMethod('SayHello') to override.
	@GrpcMethod()
	SayHello(
		@GrpcPayload() req: { name: string },
		@GrpcMetadata('x-token') token: string,
	) {
		return { message: `Hello ${req.name}` };
	}
}

@Module({ controllers: [GreeterController] })
class AppModule {}

const app = new DanetApplication();
const grpc = new GrpcServer(app); // registers the transport — call BEFORE init
await app.init(AppModule);
await grpc.listen(50051);
// app.listen(3000) still works for HTTP on the same app.
```

## Proto / codegen

The MVP loads `.proto` files dynamically via `@grpc/proto-loader` (`loadProto`).
Static codegen (e.g. ts-proto) for typed messages is an optional alternative and
is not required.

## Error mapping

Thrown Danet `HttpException`s map to the closest gRPC status (e.g.
`ForbiddenException` → `PERMISSION_DENIED`, `NotFoundException` → `NOT_FOUND`);
anything else maps to `UNKNOWN`. Exception filters run first — if a filter
returns a value it is sent as the reply.

## Limitations

- **Unary only** for now; streaming RPCs are skipped (the client receives
  `UNIMPLEMENTED`).
- **Transport-agnostic middleware only.** Middleware that reads HTTP `ctx.req` /
  `ctx.res` will not work on gRPC controllers (the same caveat as WebSocket).
- Proto messages are the contract, so class-validator DTO validation (as used by
  `@Body`) does **not** apply to `@GrpcPayload`.

## Notes

The test task runs with `--no-check` because the `.proto` service definition is
loaded dynamically via `@grpc/proto-loader` (untyped at compile time). The
exported package API is fully typed.
