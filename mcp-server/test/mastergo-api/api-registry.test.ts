import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import {
  MasterGoApiRegistry,
  UnknownMasterGoApiError,
} from "../../src/mastergo-api/api-registry.js";
import {
  MasterGoApiStrategy,
  type MasterGoApiMetadata,
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

class MetadataStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = emptyParamsSchema;

  constructor(metadata: MasterGoApiMetadata) {
    super(metadata);
  }
}

class UnexposableStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = z
    .object({
      createdAt: z.date(),
    })
    .strict();

  constructor() {
    super({
      method: "test.unexposable",
      title: "Unexposable API",
      description: "Uses a parameter that cannot be represented in JSON Schema.",
      resultDescription: "Unused result.",
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

test("preserves registration order and filters method, title, and description case-insensitively", () => {
  const registry = new MasterGoApiRegistry()
    .register(new StubStrategy("mg.file", "Read document", "Current file"))
    .register(new StubStrategy("node.page", "Read page", "Canvas content"));

  assert.deepEqual(registry.list(), [
    { method: "mg.file", category: "mg", description: "Current file" },
    { method: "node.page", category: "node", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "NODE.PAGE" }), [
    { method: "node.page", category: "node", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "  DOCUMENT  " }), [
    { method: "mg.file", category: "mg", description: "Current file" },
  ]);
  assert.deepEqual(registry.list({ query: "CANVAS" }), [
    { method: "node.page", category: "node", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ category: "node" }), [
    { method: "node.page", category: "node", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.categories(), [
    { id: "mg", count: 1 },
    { id: "node", count: 1 },
  ]);
});

test("rejects empty, whitespace-only, and duplicate method registrations", () => {
  const registry = new MasterGoApiRegistry();
  registry.register(new StubStrategy("mg.document", "Read document", "Current file"));

  assert.throws(
    () => registry.register(new StubStrategy("", "Blank", "Blank")),
    /MasterGo API method must not be empty/,
  );
  assert.throws(
    () => registry.register(new StubStrategy("   ", "Blank", "Blank")),
    /MasterGo API method must not be empty/,
  );
  assert.throws(
    () => registry.register(new StubStrategy("mg.document", "Duplicate", "Duplicate")),
    /Duplicate MasterGo API method: mg\.document/,
  );
});

test("rejects method registrations with leading whitespace", () => {
  const registry = new MasterGoApiRegistry();

  assert.throws(
    () => registry.register(new StubStrategy(" mg.leading", "Leading", "Leading")),
    {
      message:
        "MasterGo API method must not contain leading or trailing whitespace:  mg.leading",
    },
  );
  assert.deepEqual(registry.list(), []);
});

test("rejects method registrations with trailing whitespace", () => {
  const registry = new MasterGoApiRegistry();

  assert.throws(
    () => registry.register(new StubStrategy("mg.trailing ", "Trailing", "Trailing")),
    {
      message:
        "MasterGo API method must not contain leading or trailing whitespace: mg.trailing ",
    },
  );
  assert.deepEqual(registry.list(), []);
});

test("rejects strategies whose schemes cannot be exposed without modifying the registry", () => {
  const registry = new MasterGoApiRegistry();

  assert.throws(() => registry.register(new UnexposableStrategy()));
  assert.deepEqual(registry.list(), []);
});

test("returns registered schemes and undefined for unknown methods", () => {
  const strategy = new StubStrategy("mg.document", "Read document", "Current file");
  const registry = new MasterGoApiRegistry().register(strategy);

  assert.deepEqual(registry.getScheme("mg.document"), strategy.toScheme());
  assert.equal(registry.getScheme("missing.method"), undefined);
});

test("delegates known invocations and rejects unknown methods", async () => {
  const registry = new MasterGoApiRegistry().register(
    new StubStrategy("mg.document", "Read document", "Current file"),
  );

  const result = await registry.invoke("mg.document", undefined, transport);
  assert.equal(result.data.res, "mg.document");

  await assert.rejects(
    registry.invoke("missing.method", undefined, transport),
    (error: unknown) => {
      assert.ok(error instanceof UnknownMasterGoApiError);
      assert.equal(error.name, "UnknownMasterGoApiError");
      assert.equal(error.message, "Unknown MasterGo API method: missing.method");
      return true;
    },
  );
});

test("keeps registered lookup and forwarding stable when caller metadata mutates", async () => {
  const metadata = {
    method: "mg.document",
    title: "Read document",
    description: "Current file",
    resultDescription: "Read document result.",
    readOnly: true,
  };
  const strategy = new MetadataStrategy(metadata);
  const registry = new MasterGoApiRegistry().register(strategy);
  const requests: InvokeMethodRequest[] = [];
  const recordingTransport: MasterGoApiTransport = {
    async request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage> {
      requests.push(payload);
      return {
        id: "response-immutable",
        type: "response",
        data: { code: 0, res: payload.method, errorMsg: "" },
      };
    },
  };

  metadata.method = "mg.mutated";
  metadata.title = "Mutated title";
  metadata.description = "Mutated description";

  assert.deepEqual(registry.list(), [
    { method: "mg.document", category: "mg", description: "Current file" },
  ]);
  assert.deepEqual(registry.list({ query: "read document" }), [
    { method: "mg.document", category: "mg", description: "Current file" },
  ]);
  assert.deepEqual(registry.list({ query: "mutated" }), []);
  assert.deepEqual(registry.getScheme("mg.document"), {
    method: "mg.document",
    category: "mg",
    title: "Read document",
    description: "Current file",
    resultDescription: "Read document result.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  });
  assert.equal(registry.getScheme("mg.mutated"), undefined);

  const result = await registry.invoke("mg.document", undefined, recordingTransport);
  assert.equal(result.data.res, "mg.document");
  assert.deepEqual(requests, [
    {
      method: "mg.document",
      params: {},
    },
  ]);
  await assert.rejects(
    registry.invoke("mg.mutated", undefined, recordingTransport),
    /Unknown MasterGo API method: mg\.mutated/,
  );
  assert.equal(requests.length, 1);
});
