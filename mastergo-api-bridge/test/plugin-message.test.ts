import assert from "node:assert/strict";
import test from "node:test";

import { parsePluginRequestMessage } from "../src/plugin/message.ts";

const request = {
  type: "bridge.request",
  id: "request-1",
  payload: {
    method: "mg.apiVersion",
    params: {},
  },
};

test("parses direct bridge requests from the UI", () => {
  assert.deepEqual(parsePluginRequestMessage(request), request);
});

test("parses MasterGo pluginMessage-wrapped bridge requests from the UI", () => {
  assert.deepEqual(
    parsePluginRequestMessage({
      pluginMessage: request,
    }),
    request,
  );
});

test("ignores unrelated UI messages", () => {
  assert.equal(parsePluginRequestMessage({ pluginMessage: { type: "other" } }), null);
});
