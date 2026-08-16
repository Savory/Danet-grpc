# Proto Loading Specification

## Purpose

Provide runtime loading of `.proto` files into gRPC package definitions so that service definitions can be handed to gRPC controllers, without requiring static code generation.

## Requirements

### Requirement: Runtime Proto Loading

The package SHALL export a `loadProto(path, options?)` function that reads a `.proto` file from the filesystem and returns the loaded gRPC package definition as a tree of packages, services and messages.

#### Scenario: Loading a proto file

- **WHEN** `loadProto` is called with a filesystem path to a valid `.proto` file
- **THEN** it returns an object whose shape mirrors the proto's package hierarchy, so that a service constructor is reachable as `result.<package>.<Service>` and its definition as `result.<package>.<Service>.service`

#### Scenario: Service definition feeds the controller decorator

- **WHEN** the returned `.service` value is passed to `@GrpcController`
- **THEN** the controller is bound to that service's RPCs

### Requirement: Default Loader Options

`loadProto` SHALL apply the loader defaults `keepCase: true`, `longs: String`, `enums: String`, `defaults: true` and `oneofs: true`, so that decoded message field names match the proto declarations verbatim.

#### Scenario: Field names preserved

- **WHEN** a proto message declares a field in snake_case and no options are supplied
- **THEN** the decoded request object exposes the field under its original proto name rather than a camelCased alias

### Requirement: Caller Option Overrides

`loadProto` SHALL accept an optional options object whose entries override the defaults on a per-key basis while leaving unspecified defaults intact.

#### Scenario: Overriding a single default

- **WHEN** `loadProto` is called with `{ keepCase: false }`
- **THEN** `keepCase` is disabled while `longs`, `enums`, `defaults` and `oneofs` keep their default values

### Requirement: Loading Errors Surface To The Caller

`loadProto` SHALL propagate loader errors to the caller rather than returning a partial or empty definition.

#### Scenario: Missing or invalid proto file

- **WHEN** `loadProto` is called with a path that does not exist or whose contents are not valid proto
- **THEN** the call throws and no package definition is returned

### Requirement: Underlying gRPC Namespaces Are Re-Exported

The package SHALL re-export the `grpc` and `protoLoader` namespaces so that consumers can use gRPC primitives such as statuses, metadata, credentials and server credentials without adding a direct dependency.

#### Scenario: Consumer builds a client with re-exported primitives

- **WHEN** a consumer imports `grpc` from the package
- **THEN** `grpc.status`, `grpc.Metadata`, `grpc.credentials` and `grpc.ServerCredentials` are available and interoperate with the servers and controllers this package creates
