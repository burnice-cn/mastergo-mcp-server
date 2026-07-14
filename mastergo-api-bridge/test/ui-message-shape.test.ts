import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../plugin/index.html", import.meta.url), "utf8");

test("posts bridge requests directly to the MasterGo plugin runtime", () => {
  const postMessageIndex = html.indexOf("parent.postMessage({");

  assert.notEqual(postMessageIndex, -1);

  const postMessageEnd = html.indexOf(");", postMessageIndex);

  assert.notEqual(postMessageEnd, -1);

  const postMessageCall = html.slice(postMessageIndex, postMessageEnd + 2);

  assert.match(postMessageCall, /type:\s*'bridge\.request'/);
  assert.doesNotMatch(postMessageCall, /pluginMessage/);
});

test("reads bridge responses from direct or pluginMessage-wrapped UI events", () => {
  assert.match(html, /event\.data\.pluginMessage\s*\|\|\s*event\.data/);
});
