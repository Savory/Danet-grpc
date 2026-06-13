/**
 * @module
 * Centralized re-exports of the gRPC runtime dependencies (npm), mirroring the
 * single-barrel dependency convention used by `@danet/core`'s `src/deps.ts`.
 */

import grpcModule from '@grpc/grpc-js';
import protoLoaderModule from '@grpc/proto-loader';

/**
 * The [`@grpc/grpc-js`](https://www.npmjs.com/package/@grpc/grpc-js) namespace,
 * re-exported for convenience — e.g. `grpc.status`, `grpc.credentials`,
 * `grpc.Metadata`, `grpc.ServerCredentials`.
 */
export const grpc: typeof grpcModule = grpcModule;

/**
 * The [`@grpc/proto-loader`](https://www.npmjs.com/package/@grpc/proto-loader)
 * namespace, re-exported for loading `.proto` files at runtime.
 */
export const protoLoader: typeof protoLoaderModule = protoLoaderModule;

export type {
	sendUnaryData,
	Server,
	ServerCredentials,
	ServerUnaryCall,
	ServiceDefinition,
} from '@grpc/grpc-js';
