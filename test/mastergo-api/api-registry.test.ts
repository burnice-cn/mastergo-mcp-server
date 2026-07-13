import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import {
  MasterGoApiRegistry,
  UnknownMasterGoApiError,
} from "../../src/mastergo-api/api-registry.js";
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

test("preserves registration order and filters method, title, and description case-insensitively", () => {
  const registry = new MasterGoApiRegistry()
    .register(new StubStrategy("mg.file", "Read document", "Current file"))
    .register(new StubStrategy("node.page", "Read page", "Canvas content"));

  assert.deepEqual(registry.list(), [
    { method: "mg.file", description: "Current file" },
    { method: "node.page", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "NODE.PAGE" }), [
    { method: "node.page", description: "Canvas content" },
  ]);
  assert.deepEqual(registry.list({ query: "  DOCUMENT  " }), [
    { method: "mg.file", description: "Current file" },
  ]);
  assert.deepEqual(registry.list({ query: "CANVAS" }), [
    { method: "node.page", description: "Canvas content" },
  ]);
});

test("rejects empty, whitespace, and duplicate method registrations", () => {
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
