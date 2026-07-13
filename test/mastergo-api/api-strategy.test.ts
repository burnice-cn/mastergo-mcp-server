import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import {
  MasterGoApiStrategy,
  type JsonSchemaObject,
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

const schemaWithTypedAdditionalProperties = {
  type: "object",
  additionalProperties: {
    type: "string",
  },
} satisfies JsonSchemaObject;

void schemaWithTypedAdditionalProperties;

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
