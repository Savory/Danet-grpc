/**
 * @module
 * Convenience helper for loading a `.proto` file into gRPC service definitions
 * at runtime via `@grpc/proto-loader`. Static codegen (e.g. ts-proto) is an
 * optional alternative left to the user.
 */

import { grpc, protoLoader } from '../deps.ts';

/**
 * Loads a `.proto` file and returns the gRPC package definition. Reach into it
 * to obtain a service definition for `@GrpcController`, e.g.
 * `loadProto('greeter.proto').helloworld.Greeter.service`.
 *
 * @param path - Filesystem path to the `.proto` file.
 * @param options - Optional `@grpc/proto-loader` overrides.
 */
export function loadProto(
	path: string,
	options: protoLoader.Options = {},
	// deno-lint-ignore no-explicit-any
): grpc.GrpcObject | any {
	const packageDefinition = protoLoader.loadSync(path, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
		...options,
	});
	return grpc.loadPackageDefinition(packageDefinition);
}
