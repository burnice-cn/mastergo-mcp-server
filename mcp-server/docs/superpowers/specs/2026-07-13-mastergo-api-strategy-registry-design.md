# MasterGo API Strategy Registry Design

## Context

`mcp-server/src/mastergo-api-catalog.ts` currently combines API metadata, JSON input schemas, search, lookup, and scheme projection in one file. As the number of `mg.*`, `node.*`, and future API domains grows, this file will become difficult to navigate and each call will continue bypassing API-specific validation and result handling.

The bridge and MCP server remain separate projects. They will not share runtime source files or become a workspace. This change applies only to `mcp-server`; the WebSocket protocol and the bridge-side `ApiHandler` registry remain compatible.

## Goals

- Represent each supported MasterGo API as an independent strategy.
- Keep metadata, parameter validation, forwarding, and optional result transformation together.
- Derive the public JSON input scheme from the strategy's Zod schema.
- Preserve the existing MCP tools and their external request/response shapes.
- Make adding an API require one strategy file and one domain-level registration entry.

## Non-goals

- Dynamically synchronize API definitions from `mastergo-api-bridge`.
- Change the WebSocket message protocol.
- Register one MCP tool per MasterGo API.
- Redesign bridge-side handlers as part of this refactor.

## Proposed Structure

```text
src/mastergo-api/
├── api-strategy.ts
├── api-registry.ts
├── register-apis.ts
└── strategies/
    ├── mg/
    │   ├── api-version.ts
    │   ├── document.ts
    │   └── index.ts
    └── node/
        ├── page.ts
        └── index.ts
```

The existing `mastergo-api-catalog.ts` will be removed after all consumers migrate.

## Strategy Contract

`MasterGoApiStrategy<TParams, TResult>` is an abstract class with immutable metadata: `method`, `title`, `description`, `resultDescription`, and `readOnly`. Each subclass supplies a `z.ZodType<TParams>` parameter schema. The strategy depends on a small `MasterGoApiTransport` interface rather than the concrete WebSocket server, allowing isolated tests; `MasterGoBridgeServer` satisfies that interface structurally.

The base execution flow is a template method:

1. Normalize missing parameters to an empty object.
2. Parse parameters with the strategy's Zod schema.
3. Send the validated method and parameters through the transport.
4. Return nonzero bridge responses unchanged.
5. Pass successful `data.res` through an overridable result transformation hook and rebuild the same response envelope.

The default transformation is identity and returns `unknown`; a strategy overrides it when typed validation or server-side normalization is required. This avoids duplicating transport and error-envelope handling.

The public `inputScheme` is generated with Zod 4's `z.toJSONSchema()` targeting draft-07. A shared converter removes generator-only top-level metadata such as `$schema`, verifies that the root is an object schema, and returns the stable shape exposed by the current MCP tool. Registration fails early if a strategy supplies an incompatible schema.

## Registry and Registration

`MasterGoApiRegistry` owns a private `Map<string, MasterGoApiStrategy>`. It provides operations to register strategies, list searchable summaries, retrieve schemes, and invoke a method through a supplied transport. Registration rejects empty or duplicate method names so configuration errors surface during startup. Listing preserves registration order and applies the current case-insensitive method, title, and description search behavior.

Each domain `index.ts` exports its strategies as a small readonly collection. `register-apis.ts` combines domain collections and constructs the registry. This explicit registration is preferred over filesystem discovery because it is deterministic, bundler-safe, and easy to review.

## MCP Integration

`createMcpServer` receives or closes over the initialized registry:

- `mastergo_api_list` calls the registry's list operation.
- `mastergo_api_scheme` calls the registry's scheme operation.
- `mastergo_api_call` rejects unknown methods, validates through the selected strategy, and invokes it with the bridge server.

`MasterGoBridgeServer` remains transport-only and does not import concrete strategies.

## Errors and Compatibility

Unknown methods return an error before a WebSocket request is sent. Invalid parameters return a concise validation error and do not reach the bridge. Connection failures and nonzero bridge codes retain the current response envelope. Existing method names, tool names, metadata, registration order, and successful result payloads remain unchanged.

## Verification

The refactor adds focused `*.test.ts` coverage using Node's built-in test runner through `tsx`, plus a `yarn test` script. Tests cover duplicate registration, listing and filtering, scheme generation, unknown methods, parameter rejection without transport calls, successful forwarding, nonzero response preservation, and result transformation. Final verification also runs `yarn typecheck` and `yarn build`. Manual checks cover the MCP list/scheme/call flow with the bridge disconnected and connected for all three migrated APIs.
