/**
 * @module
 * `@danet/grpc` — native gRPC transport for Danet, built on `@grpc/grpc-js`.
 *
 * @example
 * ```typescript
 * import { DanetApplication, Module } from '@danet/core';
 * import {
 * 	GrpcController,
 * 	GrpcMethod,
 * 	GrpcPayload,
 * 	GrpcServer,
 * 	loadProto,
 * } from '@danet/grpc';
 *
 * const proto = loadProto('./greeter.proto');
 *
 * @GrpcController(proto.helloworld.Greeter.service)
 * class GreeterController {
 * 	@GrpcMethod()
 * 	SayHello(@GrpcPayload() req: { name: string }) {
 * 		return { message: `Hello ${req.name}` };
 * 	}
 * }
 *
 * @Module({ controllers: [GreeterController] })
 * class AppModule {}
 *
 * const app = new DanetApplication();
 * const grpc = new GrpcServer(app);
 * await app.init(AppModule);
 * await grpc.listen(50051);
 * ```
 */

export * from './src/constants.ts';
export * from './src/decorator.ts';
export * from './src/params.ts';
export * from './src/router.ts';
export * from './src/server.ts';
export * from './src/proto.ts';
export { grpc, protoLoader } from './deps.ts';
