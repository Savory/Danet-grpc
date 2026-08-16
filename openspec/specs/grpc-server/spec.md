# gRPC Server Specification

## Purpose

Own the gRPC server instance attached to a Danet application, register it as a transport for gRPC controllers, and expose its bind and shutdown lifecycle on a port independent of the application's HTTP port.

## Requirements

### Requirement: Transport Registration At Construction

`GrpcServer` SHALL be constructed with a `DanetApplication` and SHALL register itself as that application's transport for gRPC controllers at construction time, before the application is initialized.

#### Scenario: Constructed before init

- **WHEN** a `GrpcServer` is constructed with an application and `app.init(AppModule)` is then called
- **THEN** every gRPC controller declared in the module tree is routed to that gRPC server instead of the HTTP router

#### Scenario: Constructed after init

- **WHEN** a `GrpcServer` is constructed after the application has already been initialized
- **THEN** controllers claimed during that initialization are not registered on the gRPC server and their RPCs are not served

### Requirement: Underlying Server Is Exposed

`GrpcServer` SHALL expose the underlying gRPC server instance as a readonly property so that consumers can reach gRPC-native APIs not wrapped by this package.

#### Scenario: Accessing the raw server

- **WHEN** a consumer reads the `server` property of a `GrpcServer`
- **THEN** it is the live gRPC server that the registered services were added to

### Requirement: Binding And Listening

`GrpcServer` SHALL expose `listen(port, credentials?)` which binds the server on all interfaces at the given port and returns a promise resolving to the port that was actually bound.

#### Scenario: Binding an explicit port

- **WHEN** `listen(50051)` is awaited and the port is free
- **THEN** the promise resolves with `50051` and the server accepts gRPC calls on that port

#### Scenario: Binding an ephemeral port

- **WHEN** `listen(0)` is awaited
- **THEN** the promise resolves with the non-zero port chosen by the operating system, and clients connecting to that port reach the registered services

#### Scenario: Bind failure

- **WHEN** the port cannot be bound
- **THEN** the returned promise rejects with the bind error

### Requirement: Default Insecure Credentials

`listen` SHALL default to insecure server credentials when no credentials argument is supplied, and SHALL use the supplied credentials otherwise.

#### Scenario: No credentials supplied

- **WHEN** `listen(port)` is called without a credentials argument
- **THEN** the server binds with insecure credentials and accepts clients using insecure channel credentials

### Requirement: Independent Port From HTTP

The gRPC server SHALL bind its own port and SHALL run alongside, not on top of, the HTTP server started by the Danet application.

#### Scenario: HTTP and gRPC on one application

- **WHEN** an application both starts its HTTP listener and binds a `GrpcServer` on a different port
- **THEN** HTTP controllers keep serving on the HTTP port while gRPC controllers serve on the gRPC port

### Requirement: Shutdown Lifecycle

`GrpcServer` SHALL expose `shutdown()` which drains in-flight calls before stopping, and `forceShutdown()` which stops the server immediately and cancels in-flight calls.

#### Scenario: Graceful shutdown

- **WHEN** `shutdown()` is awaited
- **THEN** the promise resolves once in-flight calls have completed and the server has stopped, or rejects if shutdown fails

#### Scenario: Immediate shutdown

- **WHEN** `forceShutdown()` is called
- **THEN** the server stops without waiting and in-flight calls are cancelled
