/**
 * @module
 * `GrpcServer` owns the underlying `grpc.Server`, registers itself as a Danet
 * transport for `@GrpcController`s, and exposes the gRPC listener lifecycle.
 * The gRPC server binds its own port and runs alongside (not on top of) the
 * HTTP server started by `DanetApplication.listen`.
 */

import type { DanetApplication } from '@danet/core';
import { GRPC_SERVICE_METADATA } from './constants.ts';
import { GrpcRouter } from './router.ts';
import { grpc, type ServerCredentials } from '../deps.ts';

export class GrpcServer {
	/** The underlying `@grpc/grpc-js` server instance. */
	public readonly server: grpc.Server;
	private router: GrpcRouter;

	constructor(app: DanetApplication) {
		this.server = new grpc.Server();
		this.router = new GrpcRouter(this.server);
		app.useTransport(GRPC_SERVICE_METADATA, this.router);
	}

	/**
	 * Binds and starts the gRPC server.
	 *
	 * @param port - Port to bind (0 picks a free port).
	 * @param credentials - Server credentials; defaults to insecure.
	 * @returns The actually-bound port.
	 */
	listen(
		port: number,
		credentials: ServerCredentials = grpc.ServerCredentials.createInsecure(),
	): Promise<number> {
		return new Promise((resolve, reject) => {
			this.server.bindAsync(
				`0.0.0.0:${port}`,
				credentials,
				(err, boundPort) => {
					if (err) return reject(err);
					resolve(boundPort);
				},
			);
		});
	}

	/**
	 * Gracefully drains in-flight calls then stops the server.
	 */
	shutdown(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server.tryShutdown((err) => err ? reject(err) : resolve());
		});
	}

	/**
	 * Immediately stops the server, cancelling in-flight calls.
	 */
	forceShutdown() {
		this.server.forceShutdown();
	}
}
