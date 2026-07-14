"use strict";
(() => {
  // src/plugin/api/api-handler.ts
  var ApiHandler = class {
    constructor(method) {
      this.method = method;
    }
  };
  var handlers = /* @__PURE__ */ new Map();
  var registerApiHandler = (handler) => {
    handlers.set(handler.method, handler);
  };
  var getApiHandler = (method) => {
    if (!method) {
      return void 0;
    }
    return handlers.get(method);
  };

  // src/plugin/api/mg/api-version.ts
  var ApiVersionHandler = class extends ApiHandler {
    constructor() {
      super("mg.apiVersion");
    }
    async call() {
      return mg.apiVersion;
    }
  };
  var apiVersionHandler = new ApiVersionHandler();

  // src/plugin/api/mg/document.ts
  var DocumentHandler = class extends ApiHandler {
    constructor() {
      super("mg.document");
    }
    async call() {
      const document = mg.document;
      const pages = document.children.map(
        (page) => toPageSummary(page, page.id === document.currentPage.id)
      );
      const currentPage = toPageSummary(document.currentPage, true);
      return {
        id: document.id,
        name: document.name,
        type: document.type,
        pages,
        currentPage
      };
    }
  };
  var documentHandler = new DocumentHandler();
  function toPageSummary(page, isCurrent) {
    return {
      id: page.id,
      name: page.name,
      type: page.type,
      isCurrent
    };
  }

  // src/plugin/api/node/page.ts
  var PageApiHandler = class extends ApiHandler {
    constructor() {
      super("node.page");
    }
    async call(params) {
      if (!(params == null ? void 0 : params.id)) {
        throw new Error("node.page requires params.id");
      }
      const pages = mg.document.children;
      const page = pages.find((e) => e.id === (params == null ? void 0 : params.id));
      if (!page) {
        throw new Error(`Page not found: ${params.id}`);
      }
      return {
        id: page.id,
        name: page.name,
        type: page.type,
        isCurrent: page.id === mg.document.currentPage.id,
        label: page.label,
        bgColor: page.bgColor,
        topLevelNodeCount: page.children.length,
        selectionIds: page.selection.map((node) => node.id),
        flowStartingPointCount: page.flowStartingPoints.length,
        children: page.children.map(toCompactSceneNode)
      };
    }
  };
  var pageApiHandler = new PageApiHandler();
  function toCompactSceneNode(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type
    };
  }

  // src/plugin/api/api-register.ts
  var registerApis = () => {
    registerApiHandler(apiVersionHandler);
    registerApiHandler(documentHandler);
    registerApiHandler(pageApiHandler);
  };

  // src/plugin/index.ts
  var UI_SIZE = {
    width: 360,
    height: 220
  };
  mg.showUI(__html__, UI_SIZE);
  registerApis();
  mg.ui.onmessage = async (message) => {
    if (!isPluginRequestMessage(message)) {
      return;
    }
    try {
      const result = await handleBridgeRequest(message.payload);
      mg.ui.postMessage({
        type: "bridge.response",
        id: message.id,
        data: result
      });
    } catch (error) {
      mg.ui.postMessage({
        type: "bridge.response",
        id: message.id,
        data: {
          code: -1,
          res: null,
          errorMsg: error instanceof Error ? error.message : String(error)
        }
      });
    }
  };
  async function handleBridgeRequest(payload) {
    const handler = getApiHandler(payload.method);
    if (handler) {
      const res = await handler.call(payload.params);
      return {
        code: 0,
        res,
        errorMsg: ""
      };
    }
    throw new Error(`No api-bridge handler registered for ${payload.method}`);
  }
  function isPluginRequestMessage(value) {
    return isRecord(value) && value.type === "bridge.request" && typeof value.id === "string" && isInvokeMethodRequest(value.payload);
  }
  function isInvokeMethodRequest(value) {
    return isRecord(value) && typeof value.method === "string";
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
})();
