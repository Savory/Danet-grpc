/**
 * @module
 * Centralized re-exports of the gRPC runtime dependencies (npm), mirroring the
 * single-barrel dependency convention used by `@danet/core`'s `src/deps.ts`.
 */

import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

export { grpc, protoLoader };

export type {
	sendUnaryData,
	ServerCredentials,
	ServerUnaryCall,
	ServiceDefinition,
} from '@grpc/grpc-js';
