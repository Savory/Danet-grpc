# Graph Report - Danet-grpc  (2026-08-16)

## Corpus Check
- Corpus is ~2,836 words - fits in a single context window. You may not need a graph.

## Summary
- 108 nodes · 151 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Deno Project Config
- gRPC Package Overview
- gRPC Controller Decorators
- Decorator Metadata and Proto Loading
- gRPC Integration Tests
- gRPC Router and Server
- CI and JSR Publishing
- Dependency Imports
- Graphify Conventions

## God Nodes (most connected - your core abstractions)
1. `@danet/grpc Package` - 10 edges
2. `GreeterController` - 9 edges
3. `imports` - 7 edges
4. `GrpcRouter` - 7 edges
5. `GrpcMethod()` - 6 edges
6. `GrpcServer` - 6 edges
7. `grpc` - 5 edges
8. `Publish Workflow` - 4 edges
9. `Run Tests Workflow` - 4 edges
10. `GrpcServer` - 4 edges

## Surprising Connections (you probably didn't know these)
- `@danet/grpc Package` --conceptually_related_to--> `deno publish (JSR publishing step)`  [INFERRED]
  README.md → .github/workflows/publish.yml
- `GreeterController` --references--> `GrpcController()`  [EXTRACTED]
  spec/grpc.test.ts → src/decorator.ts
- `--no-check Test Task` --rationale_for--> `deno task test`  [INFERRED]
  README.md → .github/workflows/run-tests.yml
- `Deno 2.8+ / node:http2 Trailer Requirement` --conceptually_related_to--> `denoland/setup-deno Action`  [INFERRED]
  README.md → .github/workflows/run-tests.yml
- `Run Tests Workflow` --conceptually_related_to--> `Publish Workflow`  [INFERRED]
  .github/workflows/run-tests.yml → .github/workflows/publish.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Deno CI/CD pipeline: setup-deno action feeding lint, test, and publish steps** — _github_workflows_run_tests_setup_deno_action, _github_workflows_run_tests_deno_lint, _github_workflows_run_tests_deno_task_test, _github_workflows_publish_deno_publish [INFERRED 0.85]
- **gRPC controller declaration stack (proto load, controller, method, params)** — readme_load_proto, readme_grpc_controller, readme_grpc_method, readme_grpc_payload, readme_grpc_metadata [EXTRACTED 1.00]
- **gRPC transport bootstrap: GrpcServer registers via useTransport before app.init, then listens** — readme_grpc_server, readme_use_transport_hook, readme_danet_core, readme_danet_pipeline_reuse [EXTRACTED 1.00]

## Communities (9 total, 1 thin omitted)

### Community 0 - "Deno Project Config"
Cohesion: 0.09
Nodes (22): compilerOptions, emitDecoratorMetadata, experimentalDecorators, description, exports, fmt, exclude, options (+14 more)

### Community 1 - "gRPC Package Overview"
Cohesion: 0.19
Nodes (16): @danet/core, @danet/grpc Package, Danet Pipeline Reuse (DI, guards, filters), HttpException to gRPC Status Mapping, @GrpcController Decorator, @grpc/grpc-js, @GrpcMetadata Decorator, @GrpcMethod Decorator (+8 more)

### Community 2 - "gRPC Controller Decorators"
Cohesion: 0.18
Nodes (7): Middleware, GreeterController, GrpcController(), GrpcMethod(), GrpcMetadata(), GrpcPayload(), UseGuard

### Community 3 - "Decorator Metadata and Proto Loading"
Cohesion: 0.35
Nodes (6): grpc, protoLoader, GRPC_METHOD_METADATA, GRPC_SERVICE_METADATA, httpStatusToGrpcCode(), toGrpcError()

### Community 4 - "gRPC Integration Tests"
Cohesion: 0.20
Nodes (7): Injectable, Module, AppModule, DenyGuard, proto, RequestCounter, TrackingMiddleware

### Community 6 - "CI and JSR Publishing"
Cohesion: 0.28
Nodes (9): deno publish (JSR publishing step), OIDC id-token Permission, Publish Workflow, deno lint (linter step), deno task test, denoland/setup-deno Action, Run Tests Workflow, Deno 2.8+ / node:http2 Trailer Requirement (+1 more)

### Community 7 - "Dependency Imports"
Cohesion: 0.29
Nodes (7): imports, @danet/core, @danet/core/metadata, @danet/grpc, @grpc/grpc-js, @grpc/proto-loader, @std/assert

### Community 8 - "Graphify Conventions"
Cohesion: 1.00
Nodes (3): GRAPH_REPORT.md, Graphify Knowledge Graph Convention, graphify query / path / explain

## Knowledge Gaps
- **22 isolated node(s):** `name`, `version`, `description`, `license`, `exports` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GreeterController` connect `gRPC Controller Decorators` to `gRPC Integration Tests`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `GrpcController()` connect `gRPC Controller Decorators` to `Decorator Metadata and Proto Loading`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `GrpcMethod()` connect `gRPC Controller Decorators` to `Decorator Metadata and Proto Loading`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Deno Project Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._