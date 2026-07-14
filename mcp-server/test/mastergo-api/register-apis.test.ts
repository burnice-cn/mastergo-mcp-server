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
  assert.deepEqual(registry.getScheme("mg.apiVersion"), {
    method: "mg.apiVersion",
    title: "Read MasterGo API version",
    description: "Return the MasterGo plugin API version exposed by the current sandbox.",
    resultDescription: "A string or version-like value returned by mg.apiVersion.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  });
  assert.deepEqual(registry.getScheme("mg.document"), {
    method: "mg.document",
    title: "Read document summary",
    description:
      "Return a compact summary of the current MasterGo document, including pages and the current page.",
    resultDescription:
      "Document id, name, type, page summaries, and the current page summary.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  });
  assert.deepEqual(registry.getScheme("node.page"), {
    method: "node.page",
    title: "Read page summary",
    description:
      "Return a compact summary of one page by page id, including top-level child nodes and current selection ids.",
    resultDescription:
      "Page id, name, type, current-page flag, label, background color, selection ids, flow count, and compact child nodes.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {
        id: {
          type: "string",
          minLength: 1,
          description:
            "Page node id. Get page ids from mg.document before calling this method.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
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
