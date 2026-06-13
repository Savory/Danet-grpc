/**
 * @module
 * Metadata keys used by the gRPC transport, mirroring the string-key convention
 * used by the WebSocket transport (`'websocket-endpoint'`, `'websocket-topic'`).
 */

/** Metadata key stashed by `@GrpcController`; value is a gRPC service definition. */
export const GRPC_SERVICE_METADATA = 'grpc-service';

/** Metadata key stashed by `@GrpcMethod`; value is the RPC name (or '' for the method name). */
export const GRPC_METHOD_METADATA = 'grpc-method';
