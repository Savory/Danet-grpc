/**
 * @module
 * gRPC parameter decorators, built with core's `createParamDecorator` factory
 * (the same factory behind `@Body`, `@Query`, etc.). They read the gRPC fields
 * the {@link GrpcRouter} places on the `ExecutionContext`.
 */

import {
	createParamDecorator,
	type DecoratorFunction,
	type ExecutionContext,
} from '@danet/core';

/**
 * Injects the decoded gRPC request message (the `call.request`).
 */
export function GrpcPayload(): DecoratorFunction {
	return createParamDecorator((context: ExecutionContext) => {
		return context.grpcPayload;
	})();
}

/**
 * Injects the gRPC call metadata, or a single metadata value when `key` is given.
 */
export function GrpcMetadata(key?: string): DecoratorFunction {
	return createParamDecorator((context: ExecutionContext) => {
		const metadata = context.grpcMetadata;
		if (!metadata) {
			return key ? undefined : metadata;
		}
		return key ? metadata.get(key) : metadata;
	})();
}
