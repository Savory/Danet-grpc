/**
 * @module
 * `GrpcRouter` registers gRPC controllers onto a `grpc.Server`, running each
 * unary RPC through the full Danet pipeline (middleware -> guards -> param
 * resolution -> controller method -> exception filters) with per-call
 * request-scoped DI. It mirrors `WebSocketRouter`, reusing the same
 * transport-agnostic executors.
 */

import {
	type Constructor,
	type ExecutionContext,
	FilterExecutor,
	GuardExecutor,
	HttpException,
	type Injector,
	injector as sharedInjector,
	Logger,
	MiddlewareExecutor,
	resolveMethodParam,
} from '@danet/core';
import { MetadataHelper } from '@danet/core/metadata';
import { GRPC_METHOD_METADATA } from './constants.ts';
import {
	grpc,
	type sendUnaryData,
	type Server,
	type ServerUnaryCall,
	type ServiceDefinition,
} from '../deps.ts';

/**
 * Maps a Danet/HTTP status code to the closest gRPC status code.
 */
function httpStatusToGrpcCode(status: number): number {
	switch (status) {
		case 400:
			return grpc.status.INVALID_ARGUMENT;
		case 401:
			return grpc.status.UNAUTHENTICATED;
		case 403:
			return grpc.status.PERMISSION_DENIED;
		case 404:
			return grpc.status.NOT_FOUND;
		case 409:
			return grpc.status.ALREADY_EXISTS;
		case 412:
			return grpc.status.FAILED_PRECONDITION;
		case 429:
			return grpc.status.RESOURCE_EXHAUSTED;
		case 500:
			return grpc.status.INTERNAL;
		case 501:
			return grpc.status.UNIMPLEMENTED;
		case 503:
			return grpc.status.UNAVAILABLE;
		case 504:
			return grpc.status.DEADLINE_EXCEEDED;
		default:
			return grpc.status.UNKNOWN;
	}
}

/**
 * Converts a thrown error into a gRPC error payload `{ code, details }`.
 */
function toGrpcError(error: unknown): { code: number; details: string } {
	if (error instanceof HttpException) {
		return {
			code: httpStatusToGrpcCode(error.status),
			details: error.description,
		};
	}
	return {
		code: grpc.status.UNKNOWN,
		details: error instanceof Error ? error.message : 'Unknown error',
	};
}

/**
 * Registers gRPC controllers onto a `grpc.Server`, running each unary RPC
 * through the full Danet pipeline (middleware → guards → param resolution →
 * controller method → exception filters) with per-call request-scoped DI.
 *
 * Mirrors Danet's `WebSocketRouter`, reusing the same transport-agnostic
 * executors. Usually you do not instantiate this directly — {@link GrpcServer}
 * creates and wires one for you.
 */
export class GrpcRouter {
	private logger: Logger = new Logger('GrpcRouter');
	private guardExecutor: GuardExecutor;
	private filterExecutor: FilterExecutor;
	private middlewareExecutor: MiddlewareExecutor;

	/**
	 * @param server - The `@grpc/grpc-js` server that services are registered on.
	 * @param injector - The Danet injector to resolve controllers from; defaults
	 * to the shared application injector.
	 */
	constructor(
		private server: Server,
		private injector: Injector = sharedInjector,
	) {
		this.guardExecutor = new GuardExecutor(this.injector);
		this.filterExecutor = new FilterExecutor(this.injector);
		this.middlewareExecutor = new MiddlewareExecutor(this.injector);
	}

	/**
	 * Registers a `@GrpcController` against its gRPC service definition, binding
	 * each unary RPC to the matching controller method.
	 */
	public registerController(
		Controller: Constructor,
		// deno-lint-ignore no-explicit-any
		serviceDefinition: ServiceDefinition<any>,
	) {
		const rpcToMethod = this.buildRpcToMethodMap(Controller);
		// deno-lint-ignore no-explicit-any
		const implementation: Record<string, any> = {};

		for (const [serviceKey, methodDef] of Object.entries(serviceDefinition)) {
			const methodName = rpcToMethod.get(serviceKey) ??
				rpcToMethod.get(methodDef.originalName ?? serviceKey);
			if (!methodName) {
				// No controller method bound: grpc-js answers UNIMPLEMENTED automatically.
				continue;
			}
			if (methodDef.requestStream || methodDef.responseStream) {
				this.logger.warn(
					`Skipping streaming RPC "${serviceKey}" on ${Controller.name}: only unary RPCs are supported.`,
				);
				continue;
			}
			implementation[serviceKey] = this.createUnaryHandler(
				Controller,
				methodName,
			);
		}

		this.server.addService(serviceDefinition, implementation);
	}

	/**
	 * Builds a map of RPC name -> controller method name from `@GrpcMethod`.
	 */
	private buildRpcToMethodMap(Controller: Constructor): Map<string, string> {
		const map = new Map<string, string>();
		const methods = Object.getOwnPropertyNames(Controller.prototype);
		for (const methodName of methods) {
			if (methodName === 'constructor') continue;
			const controllerMethod = Controller.prototype[methodName];
			const rpcName = MetadataHelper.getMetadata<string>(
				GRPC_METHOD_METADATA,
				controllerMethod,
			);
			if (rpcName === undefined) continue;
			map.set(rpcName || methodName, methodName);
		}
		return map;
	}

	/**
	 * Creates a unary gRPC handler that runs the full Danet pipeline.
	 */
	private createUnaryHandler(Controller: Constructor, methodName: string) {
		return async (
			// deno-lint-ignore no-explicit-any
			call: ServerUnaryCall<any, any>,
			// deno-lint-ignore no-explicit-any
			callback: sendUnaryData<any>,
		) => {
			const context = {} as ExecutionContext;
			context._id = crypto.randomUUID();
			context.getClass = () => Controller;
			context.grpcPayload = call.request;
			context.grpcMetadata = call.metadata;
			context.grpcCall = call;

			try {
				const controllerInstance = await this.injector.get(
					Controller,
					context,
				) as Record<string, (...args: unknown[]) => unknown>;
				const method = controllerInstance[methodName];
				context.getHandler = () => method;

				let result: unknown;
				await this.middlewareExecutor.executeAllRelevantMiddlewares(
					context,
					Controller,
					method,
					async () => {
						await this.guardExecutor.executeAllRelevantGuards(
							context,
							Controller,
							method,
						);
						const params = await resolveMethodParam(
							Controller,
							method,
							context,
						);
						result = await controllerInstance[methodName](...params);
					},
				);
				callback(null, result);
			} catch (error) {
				const method = Controller.prototype[methodName];
				const filtered = await this.filterExecutor
					.executeControllerAndMethodFilter(
						context,
						error,
						Controller,
						method,
					);
				if (filtered) {
					callback(null, filtered);
				} else {
					callback(toGrpcError(error), null);
				}
			} finally {
				this.injector.cleanRequestInjectables(context._id);
			}
		};
	}
}
