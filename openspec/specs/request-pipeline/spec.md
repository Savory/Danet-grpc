# Request Pipeline Specification

## Purpose

Define what happens for each incoming unary gRPC call: how the Danet execution pipeline of middleware, guards, parameter resolution and exception filters runs, how request-scoped dependencies are managed, and how errors map to gRPC statuses.

## Requirements

### Requirement: Full Danet Pipeline Per Call

Every unary gRPC call SHALL run through the Danet pipeline in the order middleware, then guards, then parameter resolution, then the controller method, with exception filters applied to anything thrown along the way.

#### Scenario: Middleware runs before the handler

- **WHEN** a controller or method declares middleware and an RPC bound to it is called
- **THEN** the middleware action runs before the controller method body and calling `next()` proceeds to the guards and the handler

#### Scenario: Guard denies the call

- **WHEN** a guard declared on the controller or method returns false for the call
- **THEN** the controller method is not invoked and the client receives an error with status `PERMISSION_DENIED`

### Requirement: Request-Scoped Dependency Injection

Each gRPC call SHALL be resolved against its own execution context, so that request-scoped injectables are instantiated fresh per call and are released once the call completes, including when it fails.

#### Scenario: Fresh request-scoped instance per call

- **WHEN** two successive calls hit an RPC whose controller depends on a `SCOPE.REQUEST` injectable that mutates its own state
- **THEN** each call observes a freshly constructed instance rather than state carried over from the previous call

#### Scenario: Cleanup after failure

- **WHEN** a call throws before completing
- **THEN** its request-scoped injectables are still released

### Requirement: Payload Parameter Decorator

The package SHALL expose a `@GrpcPayload()` parameter decorator that injects the decoded request message of the current call.

#### Scenario: Injecting the request message

- **WHEN** a client calls an RPC with a request message and the handler declares a `@GrpcPayload()` parameter
- **THEN** that parameter receives the decoded message object with its proto fields populated

### Requirement: Metadata Parameter Decorator

The package SHALL expose a `@GrpcMetadata(key?)` parameter decorator that injects the call's metadata object when no key is given, and the value stored under `key` when one is given.

#### Scenario: Injecting a single metadata value

- **WHEN** a client sends metadata entry `x-token` and the handler declares `@GrpcMetadata('x-token')`
- **THEN** the parameter receives the value sent for that key

#### Scenario: Metadata absent

- **WHEN** the call carries no metadata and the handler declares `@GrpcMetadata(key)`
- **THEN** the parameter receives `undefined` rather than throwing

### Requirement: Exception Filters Take Precedence

When a controller-level or method-level exception filter handles a thrown error and returns a value, that value SHALL be sent to the client as a successful reply instead of an error status.

#### Scenario: Filter returns a reply

- **WHEN** a handler throws and a matching exception filter returns a reply object
- **THEN** the client receives that object as a normal response with no gRPC error

### Requirement: Error To gRPC Status Mapping

Unhandled errors SHALL be returned to the client as gRPC errors. A thrown Danet `HttpException` SHALL map its HTTP status to the closest gRPC status and carry its description as the error details; any other error SHALL map to `UNKNOWN` with the error message as details.

#### Scenario: HttpException maps to its gRPC counterpart

- **WHEN** a handler throws a `NotFoundException`
- **THEN** the client receives status `NOT_FOUND`, and equivalently 400 maps to `INVALID_ARGUMENT`, 401 to `UNAUTHENTICATED`, 403 to `PERMISSION_DENIED`, 409 to `ALREADY_EXISTS`, 412 to `FAILED_PRECONDITION`, 429 to `RESOURCE_EXHAUSTED`, 500 to `INTERNAL`, 501 to `UNIMPLEMENTED`, 503 to `UNAVAILABLE` and 504 to `DEADLINE_EXCEEDED`

#### Scenario: Unmapped or non-HTTP error

- **WHEN** a handler throws a plain `Error`, or an `HttpException` whose status has no mapping
- **THEN** the client receives status `UNKNOWN` with the error message as details

### Requirement: Transport-Agnostic Context Only

The execution context given to middleware, guards and filters SHALL expose the gRPC call, its payload and its metadata, and SHALL NOT expose HTTP request or response objects.

#### Scenario: HTTP-specific middleware on a gRPC controller

- **WHEN** middleware written against HTTP request or response objects is applied to a gRPC controller
- **THEN** those objects are absent from the context and only transport-agnostic middleware behaves correctly
