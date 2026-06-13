/**
 * @module
 * Class/method decorators that mark a controller as a gRPC service and map its
 * methods to RPCs. Mirrors the WebSocket decorators (`WebSocketController` /
 * `OnWebSocketMessage`), which also wrap core's `SetMetadata`.
 */

import { type MetadataFunction, SetMetadata } from '@danet/core/metadata';
import { GRPC_METHOD_METADATA, GRPC_SERVICE_METADATA } from './constants.ts';
import type { ServiceDefinition } from '../deps.ts';

/**
 * Marks a class as a gRPC service controller.
 *
 * @param service - The gRPC {@link ServiceDefinition} (e.g.
 * `proto.helloworld.Greeter.service` from `@grpc/proto-loader`) whose RPCs this
 * controller implements.
 */
export function GrpcController(
	// deno-lint-ignore no-explicit-any
	service: ServiceDefinition<any>,
): MetadataFunction {
	return SetMetadata(GRPC_SERVICE_METADATA, service);
}

/**
 * Maps a controller method to a gRPC RPC.
 *
 * @param rpcName - The RPC name as declared in the proto. Defaults to the
 * controller method name when omitted.
 */
export function GrpcMethod(rpcName = ''): MetadataFunction {
	return SetMetadata(GRPC_METHOD_METADATA, rpcName);
}
