# Service Registration Specification

## Purpose

Define how a Danet class becomes a gRPC service implementation: which decorators mark it, how controller methods are matched to RPCs declared in a proto service definition, and which RPCs are served versus left unimplemented.

## Requirements

### Requirement: Controller Declaration

The package SHALL expose a `@GrpcController(service)` class decorator that marks a class as the implementation of the given gRPC service definition, and such a class SHALL be declared in a Danet module's `controllers` list like any other controller.

#### Scenario: Declaring a gRPC controller

- **WHEN** a class is decorated with `@GrpcController(proto.<package>.<Service>.service)` and listed in a module's `controllers`
- **THEN** the class is instantiated through the application's dependency injection container and its service is added to the gRPC server during application initialization

#### Scenario: Constructor dependencies

- **WHEN** the controller declares injectable constructor parameters
- **THEN** they are resolved by the Danet injector exactly as for HTTP controllers

### Requirement: RPC Method Mapping

The package SHALL expose a `@GrpcMethod(rpcName?)` method decorator; when `rpcName` is omitted the method SHALL be bound to the RPC whose name equals the method name, and when supplied the method SHALL be bound to that RPC name instead.

#### Scenario: Implicit RPC name

- **WHEN** a method named `SayHello` is decorated with `@GrpcMethod()` and the service declares an RPC `SayHello`
- **THEN** calls to `SayHello` invoke that method

#### Scenario: Explicit RPC name

- **WHEN** a method is decorated with `@GrpcMethod('SayHello')`
- **THEN** calls to the `SayHello` RPC invoke that method regardless of the method's own name

### Requirement: Undecorated Methods Are Not Exposed

Only methods carrying `@GrpcMethod` SHALL be bound to RPCs; any other method on the controller SHALL remain unreachable over gRPC.

#### Scenario: Helper method on the controller

- **WHEN** a controller declares a method without `@GrpcMethod`
- **THEN** no RPC is bound to it, even if the proto service declares an RPC of the same name

### Requirement: Unimplemented RPCs

RPCs declared in the service definition that have no bound controller method SHALL be left unimplemented, and calls to them SHALL fail with the gRPC `UNIMPLEMENTED` status.

#### Scenario: Calling an unbound RPC

- **WHEN** a client calls an RPC declared in the proto for which the controller provides no decorated method
- **THEN** the client receives an error with status `UNIMPLEMENTED`

### Requirement: Unary RPCs Only

Only unary RPCs SHALL be served. RPCs declared with a request stream or a response stream SHALL be skipped with a logged warning at registration time and SHALL therefore respond `UNIMPLEMENTED`.

#### Scenario: Streaming RPC declared in the proto

- **WHEN** a service definition contains an RPC with `requestStream` or `responseStream` set
- **THEN** registration logs a warning naming the RPC and the controller, does not bind a handler, and clients calling it receive `UNIMPLEMENTED`

### Requirement: Response Is The Method Return Value

The value returned by a bound controller method, awaited if it is a promise, SHALL be sent to the client as the RPC reply message.

#### Scenario: Returning a reply object

- **WHEN** a bound method returns an object matching the RPC's reply message
- **THEN** the client receives that object as the response with no error
