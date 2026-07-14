# MasterGo API Strategy Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the growing static MasterGo API catalog with independently registered strategies that own metadata, Zod parameter validation, bridge forwarding, and optional result transformation.

**Architecture:** Add an abstract `MasterGoApiStrategy` template method and a `MasterGoApiRegistry` backed by a `Map`. Concrete strategies live in domain folders, their Zod object schemas generate the public JSON schemes, and the existing MCP tools delegate list/scheme/call behavior to one initialized registry while `MasterGoBridgeServer` remains transport-only.

**Tech Stack:** TypeScript 6, Node.js 20+, Yarn 4, Zod 4, Node `node:test`, `tsx`, MCP SDK.

---

## File Map

**Create:**

- `mcp-server/tsconfig.test.json`: type-check production and test TypeScript without emitting files.
- `mcp-server/src/mastergo-api/api-strategy.ts`: strategy metadata, Zod-to-JSON-Schema conversion, validation, forwarding, and result hook.
- `mcp-server/src/mastergo-api/api-registry.ts`: registration, search, scheme lookup, and invocation dispatch.
- `mcp-server/src/mastergo-api/register-apis.ts`: deterministic domain registration.
- `mcp-server/src/mastergo-api/strategies/mg/api-version.ts`: `mg.apiVersion` strategy.
- `mcp-server/src/mastergo-api/strategies/mg/document.ts`: `mg.document` strategy.
- `mcp-server/src/mastergo-api/strategies/mg/index.ts`: ordered `mg.*` exports.
- `mcp-server/src/mastergo-api/strategies/node/page.ts`: `node.page` strategy.
- `mcp-server/src/mastergo-api/strategies/node/index.ts`: ordered `node.*` exports.
- `mcp-server/test/mastergo-api/api-strategy.test.ts`: strategy contract tests.
- `mcp-server/test/mastergo-api/api-registry.test.ts`: registry behavior tests.
- `mcp-server/test/mastergo-api/register-apis.test.ts`: concrete catalog compatibility tests.

**Modify:**

- `mcp-server/package.json`: add test command and include tests in type checking.
- `mcp-server/src/index.ts`: initialize and use the registry.
- `mcp-server/README.md`: document tests and API extension workflow.
- `mcp-server/docs/websocket-bridge.md`: replace static catalog instructions.
- `mcp-server/docs/zod-overview.md`: explain per-strategy validation.
- `mcp-server/docs/zod-usage.md`: document generated schemes and new extension path.

**Delete:**

- `mcp-server/src/mastergo-api-catalog.ts`: responsibilities move into strategies and the registry.

> Safety note: the repository already contains unrelated modified and untracked files. Do not run `git reset`, `git clean`, or broad `git add .`; stage only the paths named by each task.

### Task 1: Add the test harness and strategy base class

**Files:**
- Modify: `mcp-server/package.json`
- Create: `mcp-server/tsconfig.test.json`
- Create: `mcp-server/test/mastergo-api/api-strategy.test.ts`
- Create: `mcp-server/src/mastergo-api/api-strategy.ts`

- [ ] **Step 1: Configure the test runner and test type checking**

Add these scripts to `mcp-server/package.json`, preserving all other fields:

```json
"scripts": {
  "dev": "tsx src/index.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/index.js",
  "test": "tsx --test",
  "typecheck": "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.test.json --noEmit"
}
```

Create `mcp-server/tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "."
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 2: Write the failing strategy contract tests**

Create `mcp-server/test/mastergo-api/api-strategy.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import {
  MasterGoApiStrategy,
  type MasterGoApiTransport,
} from "../../src/mastergo-api/api-strategy.js";
import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../../src/mastergo-protocol.js";

const paramsSchema = z
  .object({
    name: z.string().trim().min(1).describe("Name to echo."),
  })
  .strict();

class EchoStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "test.echo",
      title: "Echo a name",
      description: "Echo one validated name.",
      resultDescription: "The normalized name.",
      readOnly: true,
    });
  }

  protected override transformResult(result: unknown): unknown {
    return z.string().parse(result).toUpperCase();
  }
}

class RecordingTransport implements MasterGoApiTransport {
  readonly requests: InvokeMethodRequest[] = [];

  constructor(private readonly response: BridgeResponseMessage) {}

  async request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage> {
    this.requests.push(payload);
    return this.response;
  }
}

const strategy = new EchoStrategy();

function response(code: number, res: unknown): BridgeResponseMessage {
  return {
    id: "response-1",
    type: "response",
    data: {
      code,
      res,
      errorMsg: code === 0 ? "" : "Bridge error",
    },
  };
}

test("generates a stable object input scheme from Zod", () => {
  assert.deepEqual(strategy.toScheme(), {
    method: "test.echo",
    title: "Echo a name",
    description: "Echo one validated name.",
    resultDescription: "The normalized name.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
          description: "Name to echo.",
        },
      },
      required: ["name"],
      additionalProperties: false,
    },
  });
});

test("validates params, forwards normalized values, and transforms success results", async () => {
  const transport = new RecordingTransport(response(0, "ada"));

  const result = await strategy.invoke(transport, { name: " Ada " });

  assert.deepEqual(transport.requests, [
    {
      method: "test.echo",
      params: { name: "Ada" },
    },
  ]);
  assert.deepEqual(result, response(0, "ADA"));
});

test("rejects invalid params before calling the transport", async () => {
  const transport = new RecordingTransport(response(0, "unused"));

  await assert.rejects(
    strategy.invoke(transport, { name: " " }),
    /Invalid params for test\.echo: name:/,
  );
  assert.equal(transport.requests.length, 0);
});

test("preserves nonzero bridge responses without transforming them", async () => {
  const bridgeError = response(7, "unchanged");
  const transport = new RecordingTransport(bridgeError);

  const result = await strategy.invoke(transport, { name: "Ada" });

  assert.strictEqual(result, bridgeError);
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
cd mcp-server
yarn test test/mastergo-api/api-strategy.test.ts
```

Expected: FAIL because `src/mastergo-api/api-strategy.ts` does not exist.

- [ ] **Step 4: Implement the minimal strategy base class**

Create `mcp-server/src/mastergo-api/api-strategy.ts`:

```ts
import { z } from "zod";

import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../mastergo-protocol.js";

export type JsonSchemaObject = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type MasterGoApiMetadata = {
  method: string;
  title: string;
  description: string;
  resultDescription: string;
  readOnly: boolean;
};

export type MasterGoApiListItem = Pick<MasterGoApiMetadata, "method" | "description">;

export type MasterGoApiScheme = MasterGoApiMetadata & {
  inputScheme: JsonSchemaObject;
};

export interface MasterGoApiTransport {
  request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage>;
}

export abstract class MasterGoApiStrategy {
  protected abstract readonly paramsSchema: z.ZodObject;

  constructor(private readonly metadata: MasterGoApiMetadata) {}

  get method(): string {
    return this.metadata.method;
  }

  get title(): string {
    return this.metadata.title;
  }

  get description(): string {
    return this.metadata.description;
  }

  toListItem(): MasterGoApiListItem {
    return {
      method: this.method,
      description: this.description,
    };
  }

  toScheme(): MasterGoApiScheme {
    return {
      ...this.metadata,
      inputScheme: toJsonSchemaObject(this.paramsSchema),
    };
  }

  async invoke(
    transport: MasterGoApiTransport,
    params?: Record<string, unknown>,
  ): Promise<BridgeResponseMessage> {
    const parsedParams = this.parseParams(params);
    const response = await transport.request({
      method: this.method,
      params: parsedParams,
    });

    if (response.data.code !== 0) {
      return response;
    }

    return {
      ...response,
      data: {
        ...response.data,
        res: this.transformResult(response.data.res),
      },
    };
  }

  protected transformResult(result: unknown): unknown {
    return result;
  }

  private parseParams(params?: Record<string, unknown>): Record<string, unknown> {
    try {
      return this.paramsSchema.parse(params ?? {});
    } catch (error) {
      if (!(error instanceof z.ZodError)) {
        throw error;
      }

      const details = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "params";
          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw new Error(`Invalid params for ${this.method}: ${details}`, {
        cause: error,
      });
    }
  }
}

function toJsonSchemaObject(schema: z.ZodObject): JsonSchemaObject {
  const generated = z.toJSONSchema(schema, { target: "draft-7" });
  const { $schema: _schema, ...inputScheme } = generated;

  if (inputScheme.type !== "object") {
    throw new Error("MasterGo API params schema must generate an object JSON schema.");
  }

  return inputScheme as JsonSchemaObject;
}
```

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
cd mcp-server
yarn test test/mastergo-api/api-strategy.test.ts
yarn typecheck
```

Expected: 4 tests pass; both TypeScript checks exit 0.

- [ ] **Step 6: Commit the strategy contract**

```bash
cd mcp-server
git add package.json tsconfig.test.json src/mastergo-api/api-strategy.ts test/mastergo-api/api-strategy.test.ts
git commit -m "feat: add MasterGo API strategy base"
```

### Task 2: Add the strategy registry

**Files:**
- Create: `mcp-server/test/mastergo-api/api-registry.test.ts`
- Create: `mcp-server/src/mastergo-api/api-registry.ts`

- [ ] **Step 1: Write failing registry tests**

Create `mcp-server/test/mastergo-api/api-registry.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { MasterGoApiRegistry } from "../../src/mastergo-api/api-registry.js";
import {
  MasterGoApiStrategy,
  type MasterGoApiTransport,
} from "../../src/mastergo-api/api-strategy.js";
import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../../src/mastergo-protocol.js";

const emptyParamsSchema = z.object({}).strict();

class StubStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = emptyParamsSchema;

  constructor(method: string, title: string, description: string) {
    super({
      method,
      title,
      description,
      resultDescription: `${title} result.`,
      readOnly: true,
    });
  }
}

const transport: MasterGoApiTransport = {
  async request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage> {
    return {
      id: "response-1",
      type: "response",
      data: { code: 0, res: payload.method, errorMsg: "" },
    };
  },
};

test("lists strategies in registration order and filters case-insensitively", () => {
  const registry = new MasterGoApiRegistry()
    .register(new StubStrategy("mg.document", "Read document", "Current file"))
    .register(new StubStrategy("node.page", "Read page", "Canvas content"));

  assert.deepEqual(registry.list(), [
    { method: "mg.document", description: "Current file" },
    { method: "node.page", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "CANVAS" }), [
    { method: "node.page", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "document" }), [
    { method: "mg.document", description: "Current file" },
  ]);
});

test("rejects empty and duplicate method registrations", () => {
  const registry = new MasterGoApiRegistry();
  registry.register(new StubStrategy("mg.document", "Read document", "Current file"));

  assert.throws(
    () => registry.register(new StubStrategy("mg.document", "Duplicate", "Duplicate")),
    /Duplicate MasterGo API method: mg\.document/,
  );
  assert.throws(
    () => registry.register(new StubStrategy("   ", "Blank", "Blank")),
    /MasterGo API method must not be empty/,
  );
});

test("returns schemes for registered methods and undefined for unknown methods", () => {
  const registry = new MasterGoApiRegistry().register(
    new StubStrategy("mg.document", "Read document", "Current file"),
  );

  assert.equal(registry.getScheme("mg.document")?.title, "Read document");
  assert.equal(registry.getScheme("missing.method"), undefined);
});

test("invokes registered strategies and rejects unknown methods", async () => {
  const registry = new MasterGoApiRegistry().register(
    new StubStrategy("mg.document", "Read document", "Current file"),
  );

  const result = await registry.invoke("mg.document", undefined, transport);
  assert.equal(result.data.res, "mg.document");

  await assert.rejects(
    registry.invoke("missing.method", undefined, transport),
    /Unknown MasterGo API method: missing\.method/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd mcp-server
yarn test test/mastergo-api/api-registry.test.ts
```

Expected: FAIL because `src/mastergo-api/api-registry.ts` does not exist.

- [ ] **Step 3: Implement the registry**

Create `mcp-server/src/mastergo-api/api-registry.ts`:

```ts
import type { BridgeResponseMessage } from "../mastergo-protocol.js";
import type {
  MasterGoApiListItem,
  MasterGoApiScheme,
  MasterGoApiStrategy,
  MasterGoApiTransport,
} from "./api-strategy.js";

export class UnknownMasterGoApiError extends Error {
  constructor(method: string) {
    super(`Unknown MasterGo API method: ${method}`);
    this.name = "UnknownMasterGoApiError";
  }
}

export class MasterGoApiRegistry {
  private readonly strategies = new Map<string, MasterGoApiStrategy>();

  register(strategy: MasterGoApiStrategy): this {
    if (!strategy.method.trim()) {
      throw new Error("MasterGo API method must not be empty.");
    }

    if (this.strategies.has(strategy.method)) {
      throw new Error(`Duplicate MasterGo API method: ${strategy.method}`);
    }

    this.strategies.set(strategy.method, strategy);
    return this;
  }

  list(options: { query?: string } = {}): MasterGoApiListItem[] {
    const query = options.query?.trim().toLowerCase();

    return [...this.strategies.values()]
      .filter((strategy) => {
        if (!query) {
          return true;
        }

        return (
          strategy.method.toLowerCase().includes(query) ||
          strategy.title.toLowerCase().includes(query) ||
          strategy.description.toLowerCase().includes(query)
        );
      })
      .map((strategy) => strategy.toListItem());
  }

  getScheme(method: string): MasterGoApiScheme | undefined {
    return this.strategies.get(method)?.toScheme();
  }

  async invoke(
    method: string,
    params: Record<string, unknown> | undefined,
    transport: MasterGoApiTransport,
  ): Promise<BridgeResponseMessage> {
    const strategy = this.strategies.get(method);

    if (!strategy) {
      throw new UnknownMasterGoApiError(method);
    }

    return strategy.invoke(transport, params);
  }
}
```

- [ ] **Step 4: Run registry and strategy tests**

Run:

```bash
cd mcp-server
yarn test test/mastergo-api/api-strategy.test.ts test/mastergo-api/api-registry.test.ts
yarn typecheck
```

Expected: 8 tests pass; type checking exits 0.

- [ ] **Step 5: Commit the registry**

```bash
cd mcp-server
git add src/mastergo-api/api-registry.ts test/mastergo-api/api-registry.test.ts
git commit -m "feat: add MasterGo API strategy registry"
```

### Task 3: Migrate the three API definitions into domain strategies

**Files:**
- Create: `mcp-server/test/mastergo-api/register-apis.test.ts`
- Create: `mcp-server/src/mastergo-api/register-apis.ts`
- Create: `mcp-server/src/mastergo-api/strategies/mg/api-version.ts`
- Create: `mcp-server/src/mastergo-api/strategies/mg/document.ts`
- Create: `mcp-server/src/mastergo-api/strategies/mg/index.ts`
- Create: `mcp-server/src/mastergo-api/strategies/node/page.ts`
- Create: `mcp-server/src/mastergo-api/strategies/node/index.ts`

- [ ] **Step 1: Write failing compatibility tests for the concrete registry**

Create `mcp-server/test/mastergo-api/register-apis.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";

import type { MasterGoApiTransport } from "../../src/mastergo-api/api-strategy.js";
import { createMasterGoApiRegistry } from "../../src/mastergo-api/register-apis.js";
import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../../src/mastergo-protocol.js";

test("registers the current API catalog in stable order with generated schemes", () => {
  const registry = createMasterGoApiRegistry();

  assert.deepEqual(
    registry.list().map((item) => item.method),
    ["mg.apiVersion", "mg.document", "node.page"],
  );
  assert.deepEqual(registry.getScheme("mg.apiVersion")?.inputScheme, {
    type: "object",
    properties: {},
    additionalProperties: false,
  });
  assert.deepEqual(registry.getScheme("node.page")?.inputScheme, {
    type: "object",
    properties: {
      id: {
        type: "string",
        minLength: 1,
        description: "Page node id. Get page ids from mg.document before calling this method.",
      },
    },
    required: ["id"],
    additionalProperties: false,
  });
});

test("validates concrete strategy params before forwarding", async () => {
  const requests: InvokeMethodRequest[] = [];
  const transport: MasterGoApiTransport = {
    async request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage> {
      requests.push(payload);
      return {
        id: "response-1",
        type: "response",
        data: { code: 0, res: { id: payload.params?.id }, errorMsg: "" },
      };
    },
  };
  const registry = createMasterGoApiRegistry();

  await assert.rejects(
    registry.invoke("node.page", {}, transport),
    /Invalid params for node\.page: id:/,
  );
  assert.equal(requests.length, 0);

  await registry.invoke("node.page", { id: "page-1" }, transport);
  assert.deepEqual(requests, [
    {
      method: "node.page",
      params: { id: "page-1" },
    },
  ]);
});
```

- [ ] **Step 2: Run the compatibility test and verify it fails**

Run:

```bash
cd mcp-server
yarn test test/mastergo-api/register-apis.test.ts
```

Expected: FAIL because `src/mastergo-api/register-apis.ts` does not exist.

- [ ] **Step 3: Implement the `mg.*` strategies**

Create `mcp-server/src/mastergo-api/strategies/mg/api-version.ts`:

```ts
import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z.object({}).strict();

class ApiVersionStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "mg.apiVersion",
      title: "Read MasterGo API version",
      description: "Return the MasterGo plugin API version exposed by the current sandbox.",
      resultDescription: "A string or version-like value returned by mg.apiVersion.",
      readOnly: true,
    });
  }
}

export const apiVersionStrategy = new ApiVersionStrategy();
```

Create `mcp-server/src/mastergo-api/strategies/mg/document.ts`:

```ts
import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z.object({}).strict();

class DocumentStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "mg.document",
      title: "Read document summary",
      description:
        "Return a compact summary of the current MasterGo document, including pages and the current page.",
      resultDescription:
        "Document id, name, type, page summaries, and the current page summary.",
      readOnly: true,
    });
  }
}

export const documentStrategy = new DocumentStrategy();
```

Create `mcp-server/src/mastergo-api/strategies/mg/index.ts`:

```ts
import { apiVersionStrategy } from "./api-version.js";
import { documentStrategy } from "./document.js";

export const mgApiStrategies = [apiVersionStrategy, documentStrategy] as const;
```

- [ ] **Step 4: Implement the `node.*` strategies**

Create `mcp-server/src/mastergo-api/strategies/node/page.ts`:

```ts
import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Page node id. Get page ids from mg.document before calling this method."),
  })
  .strict();

class PageStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "node.page",
      title: "Read page summary",
      description:
        "Return a compact summary of one page by page id, including top-level child nodes and current selection ids.",
      resultDescription:
        "Page id, name, type, current-page flag, label, background color, selection ids, flow count, and compact child nodes.",
      readOnly: true,
    });
  }
}

export const pageStrategy = new PageStrategy();
```

Create `mcp-server/src/mastergo-api/strategies/node/index.ts`:

```ts
import { pageStrategy } from "./page.js";

export const nodeApiStrategies = [pageStrategy] as const;
```

- [ ] **Step 5: Add deterministic domain registration**

Create `mcp-server/src/mastergo-api/register-apis.ts`:

```ts
import { MasterGoApiRegistry } from "./api-registry.js";
import { mgApiStrategies } from "./strategies/mg/index.js";
import { nodeApiStrategies } from "./strategies/node/index.js";

export function createMasterGoApiRegistry(): MasterGoApiRegistry {
  const registry = new MasterGoApiRegistry();

  for (const strategy of [...mgApiStrategies, ...nodeApiStrategies]) {
    registry.register(strategy);
  }

  return registry;
}
```

- [ ] **Step 6: Run all strategy tests and type checking**

Run:

```bash
cd mcp-server
yarn test
yarn typecheck
```

Expected: 10 tests pass; type checking exits 0.

- [ ] **Step 7: Commit the concrete strategies**

```bash
cd mcp-server
git add src/mastergo-api/register-apis.ts src/mastergo-api/strategies test/mastergo-api/register-apis.test.ts
git commit -m "feat: register MasterGo API strategies by domain"
```

### Task 4: Route MCP tools through the registry

This task preserves the public `mastergo_api_list`, `mastergo_api_scheme`, and `mastergo_api_call` tool names while replacing their internal catalog access.

**Files:**
- Modify: `mcp-server/src/index.ts:9-14,59-67,85-103,125-133`
- Delete: `mcp-server/src/mastergo-api-catalog.ts`

- [ ] **Step 1: Remove the old catalog and verify the integration check fails**

Run:

```bash
cd mcp-server
rm src/mastergo-api-catalog.ts
yarn typecheck
```

Expected: FAIL because `src/index.ts` still imports `./mastergo-api-catalog.js`.

- [ ] **Step 2: Replace the catalog import and initialize one registry**

In `mcp-server/src/index.ts`, replace:

```ts
import { getMasterGoApiScheme, listMasterGoApis } from "./mastergo-api-catalog.js";

const config = loadConfig();
const bridgeServer = new MasterGoBridgeServer(config);
```

with:

```ts
import { createMasterGoApiRegistry } from "./mastergo-api/register-apis.js";

const config = loadConfig();
const bridgeServer = new MasterGoBridgeServer(config);
const apiRegistry = createMasterGoApiRegistry();
```

- [ ] **Step 3: Route list and scheme tools through the registry**

Replace the list lookup:

```ts
const apis = apiRegistry.list({ query });
```

Replace the scheme callback body with:

```ts
async ({ method }) => {
  const scheme = apiRegistry.getScheme(method);

  if (!scheme) {
    return jsonResult(
      {
        method,
        errorMsg: `Unknown MasterGo API method: ${method}`,
        availableApis: apiRegistry.list(),
      },
      true,
    );
  }

  return jsonResult({
    ...scheme,
    nextStep:
      "Call mastergo_api_call with this method and params matching inputScheme.",
  });
},
```

- [ ] **Step 4: Route calls through validation and strategy dispatch**

Replace the direct bridge request:

```ts
const result = await bridgeServer.request({
  method,
  params,
});
```

with:

```ts
const result = await apiRegistry.invoke(method, params, bridgeServer);
```

Keep the existing `jsonResult(result, result.data.code !== 0)` and catch block unchanged so transport, validation, and unknown-method errors retain the current MCP error envelope.

- [ ] **Step 5: Verify the old catalog is no longer referenced**

Run:

```bash
cd mcp-server
if rg -n "mastergo-api-catalog|listMasterGoApis|getMasterGoApiScheme" src; then exit 1; fi
yarn test
yarn typecheck
yarn build
```

Expected: no obsolete references; 10 tests pass; type checking and build exit 0.

- [ ] **Step 6: Commit MCP integration**

```bash
cd mcp-server
git add src/index.ts
if git ls-files --error-unmatch src/mastergo-api-catalog.ts >/dev/null 2>&1; then
  git add -u -- src/mastergo-api-catalog.ts
fi
test ! -e src/mastergo-api-catalog.ts
git commit -m "refactor: route MasterGo calls through strategies"
```

### Task 5: Update contributor-facing documentation

**Files:**
- Modify: `mcp-server/README.md`
- Modify: `mcp-server/docs/websocket-bridge.md`
- Modify: `mcp-server/docs/zod-overview.md`
- Modify: `mcp-server/docs/zod-usage.md`

- [ ] **Step 1: Document the test command and API extension workflow**

In the `README.md` scripts block, use:

```bash
yarn dev
yarn test
yarn typecheck
yarn build
yarn start
```

Add this section before `## Health Check`:

```markdown
## Adding a MasterGo API

Each supported method is an independent strategy under
`src/mastergo-api/strategies/<domain>/`. A strategy owns its metadata, Zod
parameter schema, bridge forwarding, and optional result transformation.

To add a method:

1. Add the matching `ApiHandler` in `mastergo-api-bridge`.
2. Add a strategy file in the appropriate MCP server domain directory.
3. Export it from that domain's `index.ts` collection.
4. Run `yarn test`, `yarn typecheck`, and `yarn build`.

`mastergo_api_scheme` is generated from the strategy's Zod schema, so do not
maintain a second handwritten JSON input schema.
```

- [ ] **Step 2: Update bridge protocol guidance**

In `docs/websocket-bridge.md`, replace the sentence that tells contributors to update the API catalog with:

```markdown
当前 `mastergo-api-bridge` 已经实现了 `mg.apiVersion`、`mg.document`、`node.page`。新增 MasterGo 能力时，先在插件侧注册新的 `ApiHandler`，再在 `mcp-server/src/mastergo-api/strategies/` 的对应领域目录中增加策略并从该领域的 `index.ts` 导出。策略中的 Zod schema 会同时用于调用前校验和 `mastergo_api_scheme` 输出。
```

- [ ] **Step 3: Update Zod documentation to describe two-stage validation**

In `docs/zod-overview.md`, replace the current `params` explanation with:

```markdown
- `params` 在 MCP 工具边界是可选通用对象；选择到具体方法后，对应的 `MasterGoApiStrategy` 会使用自己的 Zod object schema 再次校验和规范化参数。
```

Immediately after the paragraph explaining MCP SDK validation, add:

```markdown
因此这里有两层校验：MCP SDK 先验证通用的 `method + params` 外形，API strategy 再验证 `node.page` 等具体方法所需的字段。只有两层都通过，请求才会进入 WebSocket bridge。
```

- [ ] **Step 4: Update the detailed Zod usage and extension example**

In `docs/zod-usage.md`, replace the paragraph after the generic `params` schema with:

```markdown
`params` 在 MCP tool 层保持为可选通用对象。`mastergo_api_call` 根据 `method` 找到对应的 `MasterGoApiStrategy` 后，会使用该策略自己的 Zod object schema 做精确校验和规范化；校验失败的参数不会发送到 WebSocket bridge。具体参数要求可以先通过 `mastergo_api_scheme` 查看。
```

Replace the first paragraph under `## 后续扩展示例` with:

```markdown
如果后续要新增一个固定的 MasterGo API 方法，先在 `mastergo-api-bridge` 中注册对应 `ApiHandler`，然后在 `mcp-server/src/mastergo-api/strategies/<domain>/` 中新增策略文件，并从该领域的 `index.ts` 导出。策略集中声明方法元数据和 Zod 参数 schema，`mastergo_api_scheme` 会自动生成 JSON Schema，不再修改集中式 catalog。
```

- [ ] **Step 5: Verify documentation and run the full automated checks**

Run:

```bash
cd mcp-server
if rg -n "mastergo-api-catalog|API catalog" README.md docs --glob '!docs/superpowers/**' --glob '!superpowers/**'; then exit 1; fi
yarn test
yarn typecheck
yarn build
```

Expected: no obsolete catalog instructions; 10 tests pass; type checking and build exit 0.

- [ ] **Step 6: Commit documentation**

```bash
cd mcp-server
git add README.md docs/websocket-bridge.md docs/zod-overview.md docs/zod-usage.md
git commit -m "docs: explain MasterGo API strategy extension"
```

### Task 6: Final verification and smoke check

**Files:**
- Verify only; do not modify source unless a check exposes a defect.

- [ ] **Step 1: Run all automated verification from a clean command invocation**

Run:

```bash
cd mcp-server
yarn test && yarn typecheck && yarn build
```

Expected: 10 tests pass, zero failures; both TypeScript checks and production build exit 0.

- [ ] **Step 2: Verify structure and obsolete-file removal**

Run:

```bash
cd mcp-server
test ! -e src/mastergo-api-catalog.ts
test -f src/mastergo-api/api-strategy.ts
test -f src/mastergo-api/api-registry.ts
test -f src/mastergo-api/register-apis.ts
if rg -n "mastergo-api-catalog|listMasterGoApis|getMasterGoApiScheme" src README.md docs --glob '!docs/superpowers/**' --glob '!superpowers/**'; then exit 1; fi
```

Expected: all file checks succeed and `rg` prints no matches.

- [ ] **Step 3: Smoke-test the built HTTP server**

Run in one shell:

```bash
cd mcp-server
node dist/index.js > /tmp/mastergo-mcp-server.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
sleep 1
curl -fsS http://127.0.0.1:3000/health
kill "$server_pid"
wait "$server_pid" 2>/dev/null || true
trap - EXIT
```

Expected: HTTP 200 JSON containing `"ok":true`, `"mcpUrl"`, `"bridgeUrl"`, and bridge status.

- [ ] **Step 4: Review the final diff without disturbing unrelated work**

Run:

```bash
cd mcp-server
git status --short
git log --oneline -6
git diff --check
```

Expected: no whitespace errors. Any remaining modified or untracked paths must be identified as pre-existing or intentionally excluded; do not clean or reset them.
