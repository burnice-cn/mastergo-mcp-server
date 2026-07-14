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
    const method = handler.method;
    if (!method.trim()) {
      throw new Error("MasterGo API bridge method must not be empty.");
    }
    if (method !== method.trim()) {
      throw new Error(
        `MasterGo API bridge method must not contain leading or trailing whitespace: ${method}`
      );
    }
    if (handlers.has(method)) {
      throw new Error(`Duplicate MasterGo API bridge method: ${method}`);
    }
    handlers.set(method, handler);
  };
  var getApiHandler = (method) => {
    if (!method) {
      return void 0;
    }
    return handlers.get(method);
  };

  // src/plugin/api/compact-node.ts
  function toCompactNode(node, options = {}) {
    if (!node) {
      return null;
    }
    const summary = {
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: getParentId(node)
    };
    if ("removed" in node) {
      summary.removed = node.removed;
    }
    if ("isVisible" in node) {
      summary.isVisible = node.isVisible;
    }
    if ("isLocked" in node) {
      summary.isLocked = node.isLocked;
    }
    if ("x" in node) {
      summary.x = node.x;
    }
    if ("y" in node) {
      summary.y = node.y;
    }
    if ("width" in node) {
      summary.width = node.width;
    }
    if ("height" in node) {
      summary.height = node.height;
    }
    if ("rotation" in node) {
      summary.rotation = node.rotation;
    }
    if ("opacity" in node) {
      summary.opacity = node.opacity;
    }
    if ("selection" in node) {
      summary.selectionIds = node.selection.map((selectedNode) => selectedNode.id);
    }
    if ("flowStartingPoints" in node) {
      summary.flowStartingPointCount = node.flowStartingPoints.length;
    }
    if ("label" in node) {
      summary.label = node.label;
    }
    if ("bgColor" in node) {
      summary.bgColor = node.bgColor;
    }
    if (node.type === "TEXT") {
      summary.characters = node.characters;
      summary.hasMissingFont = node.hasMissingFont;
    }
    if ("children" in node) {
      summary.childCount = node.children.length;
      if (options.includeChildren) {
        summary.children = node.children.map((child) => toCompactNode(child));
      }
    }
    return summary;
  }
  function toCompactStyle(style) {
    return {
      id: style.id,
      name: style.name,
      type: style.type,
      description: style.description,
      alias: style.alias,
      isExternal: style.isExternal,
      ukey: style.ukey,
      publishStatus: style.publishStatus
    };
  }
  function toCompactTextSublayer(node) {
    return {
      id: node.id,
      type: "TEXT_SUBLAYER",
      characters: node.characters,
      hasMissingFont: node.hasMissingFont,
      textAlignHorizontal: node.textAlignHorizontal,
      textAlignVertical: node.textAlignVertical,
      textAutoResize: node.textAutoResize,
      paragraphSpacing: node.paragraphSpacing
    };
  }
  function getParentId(node) {
    var _a, _b;
    if (node.type === "PAGE") {
      return node.parent.id;
    }
    return (_b = (_a = node.parent) == null ? void 0 : _a.id) != null ? _b : null;
  }

  // src/plugin/api/icon/insert.ts
  var IconInsertHandler = class extends ApiHandler {
    constructor() {
      super("icon.insert");
    }
    async call(params) {
      if (!(params == null ? void 0 : params.svg)) {
        throw new Error("icon.insert requires params.svg");
      }
      const node = await mg.createNodeFromSvgAsync(params.svg);
      if (params.name) {
        node.name = params.name;
      }
      if (typeof params.x === "number") {
        node.x = params.x;
      }
      if (typeof params.y === "number") {
        node.y = params.y;
      }
      if (typeof params.size === "number") {
        node.resize(params.size, params.size);
      }
      const summary = toCompactNode(node);
      if (!summary) {
        throw new Error("Failed to summarize inserted icon node.");
      }
      return summary;
    }
  };
  var iconInsertHandler = new IconInsertHandler();

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

  // src/plugin/api/mg/basic.ts
  var CallbackHandler = class extends ApiHandler {
    constructor(method, callback) {
      super(method);
      this.callback = callback;
    }
    async call(params) {
      return this.callback(params);
    }
  };
  var basicMgApiHandlers = [
    new CallbackHandler("mg.documentId", () => mg.documentId),
    new CallbackHandler("mg.command", () => mg.command),
    new CallbackHandler("mg.themeColor", () => mg.themeColor),
    new CallbackHandler("mg.currentUser", () => mg.currentUser),
    new CallbackHandler("mg.viewport", () => ({
      center: mg.viewport.center,
      zoom: mg.viewport.zoom,
      bound: mg.viewport.bound,
      layout: mg.viewport.layout,
      positionOnDom: mg.viewport.positionOnDom,
      rulerVisible: mg.viewport.rulerVisible,
      layoutGridVisible: mg.viewport.layoutGridVisible
    })),
    new CallbackHandler(
      "mg.getNodeById",
      (params) => toCompactNode(mg.getNodeById(requireParams(params, "mg.getNodeById").id))
    ),
    new CallbackHandler("mg.getNodeByPosition", (params) => {
      const { x, y } = requireParams(params, "mg.getNodeByPosition");
      return toCompactNode(mg.getNodeByPosition({ x, y }));
    }),
    new CallbackHandler("mg.getHoverLayer", () => toCompactNode(mg.getHoverLayer())),
    new CallbackHandler(
      "mg.hexToRGBA",
      (params) => mg.hexToRGBA(requireParams(params, "mg.hexToRGBA").hex)
    ),
    new CallbackHandler(
      "mg.RGBAToHex",
      (params) => mg.RGBAToHex(requireParams(params, "mg.RGBAToHex").rgba)
    ),
    new CallbackHandler("mg.notify", (params) => {
      const { message, options } = requireParams(params, "mg.notify");
      const notification = mg.notify(message, options != null ? options : void 0);
      return {
        shown: true,
        cancelable: typeof notification.cancel === "function"
      };
    }),
    ...createNodeHandlers(),
    new CallbackHandler(
      "mg.createNodeFromSvgAsync",
      async (params) => {
        const { svg, name } = requireParams(params, "mg.createNodeFromSvgAsync");
        const node = await mg.createNodeFromSvgAsync(svg);
        assignName(node, name);
        return toCompactNode(node);
      }
    ),
    new CallbackHandler("mg.listAvailableFontsAsync", () => mg.listAvailableFontsAsync()),
    new CallbackHandler("mg.loadFontAsync", (params) => {
      const { family, style } = requireParams(params, "mg.loadFontAsync");
      return mg.loadFontAsync({ family, style });
    }),
    ...createLocalStyleHandlers()
  ];
  function createNodeHandlers() {
    const handlers2 = [
      ["mg.createRectangle", () => mg.createRectangle()],
      ["mg.createLine", () => mg.createLine()],
      ["mg.createEllipse", () => mg.createEllipse()],
      ["mg.createPolygon", () => mg.createPolygon()],
      ["mg.createStar", () => mg.createStar()],
      ["mg.createPen", () => mg.createPen()],
      ["mg.createText", () => mg.createText()],
      ["mg.createFrame", () => mg.createFrame()],
      ["mg.createSection", () => mg.createSection()],
      ["mg.createComponent", () => mg.createComponent()],
      ["mg.createPage", () => mg.createPage()],
      ["mg.createSlice", () => mg.createSlice()],
      ["mg.createConnector", () => mg.createConnector()],
      ["mg.createIntelligentContainer", () => mg.createIntelligentContainer()]
    ];
    return handlers2.map(
      ([method, createNode]) => new CallbackHandler(method, (params) => {
        const node = createNode();
        assignName(node, params == null ? void 0 : params.name);
        return toCompactNode(node);
      })
    );
  }
  function createLocalStyleHandlers() {
    return [
      new CallbackHandler(
        "mg.getLocalPaintStyles",
        () => mg.getLocalPaintStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalEffectStyles",
        () => mg.getLocalEffectStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalTextStyles",
        () => mg.getLocalTextStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalGridStyles",
        () => mg.getLocalGridStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalStrokeWidthStyles",
        () => mg.getLocalStrokeWidthStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalCornerRadiusStyles",
        () => mg.getLocalCornerRadiusStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalPaddingStyles",
        () => mg.getLocalPaddingStyles().map(toCompactStyle)
      ),
      new CallbackHandler(
        "mg.getLocalSpacingStyles",
        () => mg.getLocalSpacingStyles().map(toCompactStyle)
      )
    ];
  }
  function assignName(node, name) {
    if (name) {
      node.name = name;
    }
  }
  function requireParams(params, method) {
    if (!params) {
      throw new Error(`${method} requires params`);
    }
    return params;
  }

  // src/plugin/api/mg/codegen.ts
  var CallbackHandler2 = class extends ApiHandler {
    constructor(method, callback) {
      super(method);
      this.callback = callback;
    }
    async call(params) {
      return this.callback(params);
    }
  };
  var codeChangeRegistered = false;
  var latestCodeChange = null;
  var codeChangeCount = 0;
  var codegenApiHandlers = [
    new CallbackHandler2("mg.mode", () => {
      var _a;
      return (_a = mg.mode) != null ? _a : null;
    }),
    new CallbackHandler2("mg.codegen.available", () => {
      var _a;
      return {
        available: Boolean(mg.codegen),
        mode: (_a = mg.mode) != null ? _a : null,
        directMethods: [
          "setComponentTemplate",
          "getCode",
          "getDSL",
          "getCodeByDSL"
        ],
        pollableEvents: ["codeChange"],
        unsupportedCallbackEvents: ["generateDSL", "generate"]
      };
    }),
    new CallbackHandler2(
      "mg.codegen.setComponentTemplate",
      (params) => {
        const codegen = requireCodegen("mg.codegen.setComponentTemplate");
        const { template } = requireParams2(params, "mg.codegen.setComponentTemplate");
        codegen.setComponentTemplate(template);
        return { set: true };
      }
    ),
    new CallbackHandler2("mg.codegen.getCode", async (params) => {
      const codegen = requireCodegen("mg.codegen.getCode");
      const { layerId, framework, maxJsonBytes } = requireParams2(
        params,
        "mg.codegen.getCode"
      );
      const result = await codegen.getCode(layerId, framework);
      return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getCode");
    }),
    new CallbackHandler2("mg.codegen.getDSL", async (params) => {
      const codegen = requireCodegen("mg.codegen.getDSL");
      const { layerId, framework, maxJsonBytes } = requireParams2(
        params,
        "mg.codegen.getDSL"
      );
      const result = await codegen.getDSL(layerId, framework);
      return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getDSL");
    }),
    new CallbackHandler2("mg.codegen.getCodeByDSL", async (params) => {
      const codegen = requireCodegen("mg.codegen.getCodeByDSL");
      const { data, framework, maxJsonBytes } = requireParams2(
        params,
        "mg.codegen.getCodeByDSL"
      );
      const result = await codegen.getCodeByDSL(data, framework);
      return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getCodeByDSL");
    }),
    new CallbackHandler2("mg.codegen.onCodeChange", () => {
      const codegen = requireCodegen("mg.codegen.onCodeChange");
      const alreadyRegistered = codeChangeRegistered;
      if (!codeChangeRegistered) {
        codegen.on("codeChange", (data) => {
          latestCodeChange = data;
          codeChangeCount += 1;
        });
        codeChangeRegistered = true;
      }
      return {
        registered: true,
        alreadyRegistered,
        count: codeChangeCount
      };
    }),
    new CallbackHandler2("mg.codegen.getLatestCodeChange", (params) => {
      var _a;
      requireCodegen("mg.codegen.getLatestCodeChange");
      const result = {
        count: codeChangeCount,
        data: latestCodeChange
      };
      return enforceJsonSize(
        result,
        (_a = params == null ? void 0 : params.maxJsonBytes) != null ? _a : null,
        "mg.codegen.getLatestCodeChange"
      );
    }),
    new CallbackHandler2("mg.codegen.clearLatestCodeChange", () => {
      requireCodegen("mg.codegen.clearLatestCodeChange");
      latestCodeChange = null;
      return {
        cleared: true,
        count: codeChangeCount
      };
    })
  ];
  function requireCodegen(method) {
    if (!mg.codegen) {
      throw new Error(
        `${method} requires mg.codegen, which is only available in MasterGo DevMode/codegen contexts.`
      );
    }
    return mg.codegen;
  }
  function requireParams2(params, method) {
    if (!params) {
      throw new Error(`${method} requires params`);
    }
    return params;
  }
  function enforceJsonSize(value, maxJsonBytes, method) {
    if (!maxJsonBytes) {
      return value;
    }
    const json = JSON.stringify(value);
    const byteLength = utf8ByteLength(json);
    if (byteLength > maxJsonBytes) {
      throw new Error(
        `${method} result JSON is ${byteLength} bytes, exceeding maxJsonBytes ${maxJsonBytes}.`
      );
    }
    return value;
  }
  function utf8ByteLength(value) {
    let bytes = 0;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if (code < 128) {
        bytes += 1;
      } else if (code < 2048) {
        bytes += 2;
      } else if (code >= 55296 && code <= 56319) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    }
    return bytes;
  }

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

  // src/plugin/api/node/operations/handler.ts
  var NodeOperationHandler = class extends ApiHandler {
    constructor(method, callback) {
      super(method);
      this.callback = callback;
    }
    async call(params) {
      return this.callback(params);
    }
  };
  function command(method, call) {
    return { method, call };
  }
  function handlersFromCommands(commands) {
    return commands.map(({ method, call }) => new NodeOperationHandler(method, call));
  }

  // src/plugin/api/node/operations/params.ts
  function requireId(params, method) {
    return requireString(params, "id", method);
  }
  function requireString(params, key, method) {
    const value = requireParam(params, key, method);
    if (typeof value !== "string") {
      throw new Error(`${method} requires string params.${key}`);
    }
    return value;
  }
  function optionalString(params, key) {
    const value = params == null ? void 0 : params[key];
    if (value === void 0 || value === null) {
      return null;
    }
    if (typeof value !== "string") {
      throw new Error(`Expected params.${key} to be a string or null.`);
    }
    return value;
  }
  function requireNumber(params, key, method) {
    const value = requireParam(params, key, method);
    if (typeof value !== "number") {
      throw new Error(`${method} requires number params.${key}`);
    }
    return value;
  }
  function optionalNumber(params, key) {
    const value = params == null ? void 0 : params[key];
    if (value === void 0 || value === null) {
      return null;
    }
    if (typeof value !== "number") {
      throw new Error(`Expected params.${key} to be a number or null.`);
    }
    return value;
  }
  function requireBoolean(params, key, method) {
    const value = requireParam(params, key, method);
    if (typeof value !== "boolean") {
      throw new Error(`${method} requires boolean params.${key}`);
    }
    return value;
  }
  function requireStringOrBoolean(params, key, method) {
    const value = requireParam(params, key, method);
    if (typeof value !== "string" && typeof value !== "boolean") {
      throw new Error(`${method} requires string or boolean params.${key}`);
    }
    return value;
  }
  function requireArray(params, key, method) {
    const value = requireParam(params, key, method);
    if (!Array.isArray(value)) {
      throw new Error(`${method} requires array params.${key}`);
    }
    return value;
  }
  function requireStringArray(params, key, method) {
    const value = requireArray(params, key, method);
    if (!value.every((item) => typeof item === "string")) {
      throw new Error(`${method} requires string[] params.${key}`);
    }
    return value;
  }
  function requireRecord(params, key, method) {
    const value = requireParam(params, key, method);
    if (!isRecord(value)) {
      throw new Error(`${method} requires object params.${key}`);
    }
    return value;
  }
  function optionalRecord(params, key) {
    const value = params == null ? void 0 : params[key];
    if (value === void 0 || value === null) {
      return null;
    }
    if (!isRecord(value)) {
      throw new Error(`Expected params.${key} to be an object or null.`);
    }
    return value;
  }
  function optionalTypedRecord(params, key) {
    const value = optionalRecord(params, key);
    return value === null ? void 0 : asTyped(value);
  }
  function asTyped(value) {
    return value;
  }
  function requireParam(params, key, method) {
    if (!params || !(key in params)) {
      throw new Error(`${method} requires params.${key}`);
    }
    return params[key];
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  // src/plugin/api/node/operations/nodes.ts
  function getPageOrSceneNode(id, method) {
    const page = mg.document.children.find((candidate) => candidate.id === id);
    if (page) {
      return page;
    }
    return getSceneNode(id, method);
  }
  function getSceneNode(id, method) {
    const node = mg.getNodeById(id);
    if (!node) {
      throw new Error(`${method} could not find scene node: ${id}`);
    }
    return node;
  }
  function getPageNode(id, method) {
    const page = mg.document.children.find((candidate) => candidate.id === id);
    if (!page) {
      throw new Error(`${method} could not find page node: ${id}`);
    }
    return page;
  }
  function getBaseNode(id, method) {
    return requireCallable(
      getSceneNode(id, method),
      "getPluginData",
      method
    );
  }
  function getChildrenNode(id, method) {
    const node = getPageOrSceneNode(id, method);
    if (!("findAll" in node) || typeof node.findAll !== "function") {
      throw new Error(`${method} requires a page or children-capable node.`);
    }
    return node;
  }
  function getConnectorNode(id, method) {
    const node = getSceneNode(id, method);
    if (node.type !== "CONNECTOR") {
      throw new Error(`${method} requires a CONNECTOR node.`);
    }
    return node;
  }
  function getComponentNode(id, method) {
    const node = getSceneNode(id, method);
    if (node.type !== "COMPONENT") {
      throw new Error(`${method} requires a COMPONENT node.`);
    }
    return node;
  }
  function getComponentSetNode(id, method) {
    const node = getSceneNode(id, method);
    if (node.type !== "COMPONENT_SET") {
      throw new Error(`${method} requires a COMPONENT_SET node.`);
    }
    return node;
  }
  function getComponentPropertiesNode(id, method) {
    const node = getSceneNode(id, method);
    if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
      throw new Error(`${method} requires a COMPONENT or COMPONENT_SET node.`);
    }
    return node;
  }
  function getInstanceNode(id, method) {
    const node = getSceneNode(id, method);
    if (node.type !== "INSTANCE") {
      throw new Error(`${method} requires an INSTANCE node.`);
    }
    return node;
  }
  function getExportNode(params, method) {
    const node = getSceneNode(requireId(params, method), method);
    if (!("export" in node) || typeof node.export !== "function") {
      throw new Error(`${method} requires an export-capable scene node.`);
    }
    return node;
  }
  function getTextTarget(params, method) {
    const node = getSceneNode(requireId(params, method), method);
    if (node.type === "TEXT") {
      return node;
    }
    if (node.type === "CONNECTOR" && node.text) {
      return node.text;
    }
    throw new Error(`${method} requires a TEXT node or CONNECTOR node with text.`);
  }
  function requireCallable(target, functionName, method) {
    if (!(functionName in target) || typeof target[functionName] !== "function") {
      throw new Error(`${method} requires callable ${functionName}.`);
    }
    return target;
  }

  // src/plugin/api/node/operations/result.ts
  function setProperty(params, property, value, method) {
    const node = getSceneNode(requireId(params, method), method);
    setExistingProperty(node, property, value, method);
    return compact(node);
  }
  function setPageProperty(params, property, value, method) {
    const node = getPageNode(requireId(params, method), method);
    setExistingProperty(node, property, value, method);
    return compact(node);
  }
  function setTextProperty(params, property, value, method) {
    const text = getTextTarget(params, method);
    setExistingProperty(text, property, value, method);
    return compactTextTarget(text);
  }
  function setExistingProperty(target, property, value, method) {
    if (!(property in target)) {
      throw new Error(`${method} cannot set unsupported property: ${property}`);
    }
    target[property] = value;
  }
  function compact(node) {
    const summary = toCompactNode(node, { includeChildren: false });
    if (!summary) {
      throw new Error(`Failed to summarize node: ${node.id}`);
    }
    return summary;
  }
  function compactTextTarget(target) {
    if ("type" in target) {
      return compact(target);
    }
    return toCompactTextSublayer(target);
  }
  function serializeExportResult(result, options = {}) {
    if (typeof result === "string") {
      return result;
    }
    if (options.maxBytes !== void 0 && result.byteLength > options.maxBytes) {
      throw new Error(
        `Export result is ${result.byteLength} bytes, exceeding maxBytes ${options.maxBytes}.`
      );
    }
    return {
      byteLength: result.byteLength,
      encoding: "base64",
      data: uint8ArrayToBase64(result)
    };
  }
  function rangeStart(params, method) {
    return requireNumber(params, "start", method);
  }
  function rangeEnd(params, method) {
    return requireNumber(params, "end", method);
  }
  function uint8ArrayToBase64(value) {
    let binary = "";
    const chunkSize = 32768;
    for (let index = 0; index < value.length; index += chunkSize) {
      const chunk = value.subarray(index, index + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  // src/plugin/api/node/operations/base.ts
  var baseOperationCommands = [
    command("node.setName", (params) => {
      const node = getPageOrSceneNode(requireId(params, "node.setName"), "node.setName");
      node.name = requireString(params, "name", "node.setName");
      return compact(node);
    }),
    command("node.remove", (params) => {
      const node = getPageOrSceneNode(requireId(params, "node.remove"), "node.remove");
      node.remove();
      return { id: node.id, removed: true };
    }),
    command("node.clone", (params) => {
      const node = requireCallable(
        getPageOrSceneNode(requireId(params, "node.clone"), "node.clone"),
        "clone",
        "node.clone"
      );
      return compact(node.clone());
    }),
    command("node.getPluginData", (params) => {
      const node = getBaseNode(requireId(params, "node.getPluginData"), "node.getPluginData");
      return node.getPluginData(requireString(params, "key", "node.getPluginData"));
    }),
    command("node.setPluginData", (params) => {
      const node = getBaseNode(requireId(params, "node.setPluginData"), "node.setPluginData");
      node.setPluginData(
        requireString(params, "key", "node.setPluginData"),
        requireString(params, "value", "node.setPluginData")
      );
      return compact(node);
    }),
    command("node.getPluginDataKeys", (params) => {
      const node = getBaseNode(
        requireId(params, "node.getPluginDataKeys"),
        "node.getPluginDataKeys"
      );
      return [...node.getPluginDataKeys()];
    }),
    command("node.removePluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.removePluginData"),
        "node.removePluginData"
      );
      node.removePluginData(requireString(params, "key", "node.removePluginData"));
      return compact(node);
    }),
    command("node.clearPluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.clearPluginData"),
        "node.clearPluginData"
      );
      node.clearPluginData();
      return compact(node);
    }),
    command("node.getSharedPluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.getSharedPluginData"),
        "node.getSharedPluginData"
      );
      return node.getSharedPluginData(
        requireString(params, "namespace", "node.getSharedPluginData"),
        requireString(params, "key", "node.getSharedPluginData")
      );
    }),
    command("node.setSharedPluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.setSharedPluginData"),
        "node.setSharedPluginData"
      );
      node.setSharedPluginData(
        requireString(params, "namespace", "node.setSharedPluginData"),
        requireString(params, "key", "node.setSharedPluginData"),
        requireString(params, "value", "node.setSharedPluginData")
      );
      return compact(node);
    }),
    command("node.getSharedPluginDataKeys", (params) => {
      const node = getBaseNode(
        requireId(params, "node.getSharedPluginDataKeys"),
        "node.getSharedPluginDataKeys"
      );
      return [
        ...node.getSharedPluginDataKeys(
          requireString(params, "namespace", "node.getSharedPluginDataKeys")
        )
      ];
    }),
    command("node.removeSharedPluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.removeSharedPluginData"),
        "node.removeSharedPluginData"
      );
      node.removeSharedPluginData(
        requireString(params, "namespace", "node.removeSharedPluginData"),
        requireString(params, "key", "node.removeSharedPluginData")
      );
      return compact(node);
    }),
    command("node.clearSharedPluginData", (params) => {
      const node = getBaseNode(
        requireId(params, "node.clearSharedPluginData"),
        "node.clearSharedPluginData"
      );
      node.clearSharedPluginData(
        requireString(params, "namespace", "node.clearSharedPluginData")
      );
      return compact(node);
    }),
    command(
      "node.setVisible",
      (params) => setProperty(
        params,
        "isVisible",
        requireBoolean(params, "isVisible", "node.setVisible"),
        "node.setVisible"
      )
    ),
    command(
      "node.setLocked",
      (params) => setProperty(
        params,
        "isLocked",
        requireBoolean(params, "isLocked", "node.setLocked"),
        "node.setLocked"
      )
    ),
    command(
      "node.setComponentPropertyReferences",
      (params) => setProperty(
        params,
        "componentPropertyReferences",
        optionalRecord(params, "references"),
        "node.setComponentPropertyReferences"
      )
    )
  ];

  // src/plugin/api/node/operations/component.ts
  var componentOperationCommands = [
    command("node.component.addProperty", (params) => {
      const node = getComponentPropertiesNode(
        requireId(params, "node.component.addProperty"),
        "node.component.addProperty"
      );
      const propertyId = node.addComponentProperty(
        requireString(params, "propertyName", "node.component.addProperty"),
        requireString(params, "type", "node.component.addProperty"),
        requireStringOrBoolean(params, "defaultValue", "node.component.addProperty"),
        optionalRecord(params, "options")
      );
      return { propertyId };
    }),
    command("node.component.editProperty", (params) => {
      const node = getComponentPropertiesNode(
        requireId(params, "node.component.editProperty"),
        "node.component.editProperty"
      );
      const propertyId = node.editComponentProperty(
        requireString(params, "propertyId", "node.component.editProperty"),
        requireRecord(params, "newValue", "node.component.editProperty")
      );
      return { propertyId };
    }),
    command("node.component.deleteProperty", (params) => {
      const node = getComponentPropertiesNode(
        requireId(params, "node.component.deleteProperty"),
        "node.component.deleteProperty"
      );
      node.deleteComponentProperty(
        requireString(params, "propertyId", "node.component.deleteProperty")
      );
      return compact(node);
    }),
    command("node.component.setVariantPropertyValues", (params) => {
      const node = getComponentNode(
        requireId(params, "node.component.setVariantPropertyValues"),
        "node.component.setVariantPropertyValues"
      );
      node.setVariantPropertyValues(
        requireRecord(params, "properties", "node.component.setVariantPropertyValues")
      );
      return compact(node);
    }),
    command(
      "node.component.createInstance",
      (params) => compact(
        getComponentNode(
          requireId(params, "node.component.createInstance"),
          "node.component.createInstance"
        ).createInstance()
      )
    ),
    command("node.componentSet.createVariantComponent", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.createVariantComponent"),
        "node.componentSet.createVariantComponent"
      );
      node.createVariantComponent();
      return compact(node);
    }),
    command("node.componentSet.createVariantProperties", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.createVariantProperties"),
        "node.componentSet.createVariantProperties"
      );
      node.createVariantProperties(
        requireStringArray(params, "properties", "node.componentSet.createVariantProperties")
      );
      return compact(node);
    }),
    command("node.componentSet.editVariantProperties", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.editVariantProperties"),
        "node.componentSet.editVariantProperties"
      );
      node.editVariantProperties(
        requireRecord(params, "properties", "node.componentSet.editVariantProperties")
      );
      return compact(node);
    }),
    command("node.componentSet.editVariantPropertyValues", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.editVariantPropertyValues"),
        "node.componentSet.editVariantPropertyValues"
      );
      node.editVariantPropertyValues(
        requireRecord(
          params,
          "properties",
          "node.componentSet.editVariantPropertyValues"
        )
      );
      return compact(node);
    }),
    command("node.componentSet.editVariantPropertiesAlias", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.editVariantPropertiesAlias"),
        "node.componentSet.editVariantPropertiesAlias"
      );
      node.editVariantPropertiesAlias(
        requireRecord(
          params,
          "properties",
          "node.componentSet.editVariantPropertiesAlias"
        )
      );
      return compact(node);
    }),
    command("node.componentSet.editVariantPropertyValuesAlias", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.editVariantPropertyValuesAlias"),
        "node.componentSet.editVariantPropertyValuesAlias"
      );
      node.editVariantPropertyValuesAlias(
        requireRecord(
          params,
          "properties",
          "node.componentSet.editVariantPropertyValuesAlias"
        )
      );
      return compact(node);
    }),
    command("node.componentSet.deleteVariantProperty", (params) => {
      const node = getComponentSetNode(
        requireId(params, "node.componentSet.deleteVariantProperty"),
        "node.componentSet.deleteVariantProperty"
      );
      node.deleteVariantProperty(
        requireString(params, "property", "node.componentSet.deleteVariantProperty")
      );
      return compact(node);
    }),
    command("node.instance.setVariantPropertyValues", (params) => {
      const node = getInstanceNode(
        requireId(params, "node.instance.setVariantPropertyValues"),
        "node.instance.setVariantPropertyValues"
      );
      node.setVariantPropertyValues(
        requireRecord(params, "properties", "node.instance.setVariantPropertyValues")
      );
      return compact(node);
    }),
    command("node.instance.setProperties", (params) => {
      const node = getInstanceNode(
        requireId(params, "node.instance.setProperties"),
        "node.instance.setProperties"
      );
      node.setProperties(
        requireRecord(params, "properties", "node.instance.setProperties")
      );
      return compact(node);
    }),
    command(
      "node.instance.setExposedInstance",
      (params) => setProperty(
        params,
        "isExposedInstance",
        requireBoolean(params, "isExposedInstance", "node.instance.setExposedInstance"),
        "node.instance.setExposedInstance"
      )
    ),
    command("node.instance.resetOverrides", (params) => {
      const node = getInstanceNode(
        requireId(params, "node.instance.resetOverrides"),
        "node.instance.resetOverrides"
      );
      node.resetOverrides();
      return compact(node);
    }),
    command("node.instance.swapComponent", (params) => {
      const node = getInstanceNode(
        requireId(params, "node.instance.swapComponent"),
        "node.instance.swapComponent"
      );
      const component = getComponentNode(
        requireString(params, "componentId", "node.instance.swapComponent"),
        "node.instance.swapComponent"
      );
      node.swapComponent(component);
      return compact(node);
    }),
    command(
      "node.instance.detach",
      (params) => compact(
        getInstanceNode(
          requireId(params, "node.instance.detach"),
          "node.instance.detach"
        ).detachInstance()
      )
    ),
    command("node.instance.setMainComponent", (params) => {
      const node = getInstanceNode(
        requireId(params, "node.instance.setMainComponent"),
        "node.instance.setMainComponent"
      );
      const componentId = optionalString(params, "componentId");
      node.mainComponent = componentId ? getComponentNode(componentId, "node.instance.setMainComponent") : null;
      return compact(node);
    })
  ];

  // src/plugin/api/node/operations/container.ts
  var containerOperationCommands = [
    command(
      "node.setExpanded",
      (params) => setProperty(
        params,
        "expanded",
        requireBoolean(params, "expanded", "node.setExpanded"),
        "node.setExpanded"
      )
    ),
    command("node.setAutoLayout", (params) => {
      const node = getSceneNode(requireId(params, "node.setAutoLayout"), "node.setAutoLayout");
      const autoLayout = requireRecord(params, "autoLayout", "node.setAutoLayout");
      for (const [key, value] of Object.entries(autoLayout)) {
        setExistingProperty(node, key, value, "node.setAutoLayout");
      }
      return compact(node);
    }),
    command(
      "node.setClipsContent",
      (params) => setProperty(
        params,
        "clipsContent",
        requireBoolean(params, "clipsContent", "node.setClipsContent"),
        "node.setClipsContent"
      )
    ),
    command(
      "node.setLayoutGrids",
      (params) => setProperty(
        params,
        "layoutGrids",
        requireArray(params, "layoutGrids", "node.setLayoutGrids"),
        "node.setLayoutGrids"
      )
    ),
    command(
      "node.setGridStyleId",
      (params) => setProperty(
        params,
        "gridStyleId",
        requireString(params, "gridStyleId", "node.setGridStyleId"),
        "node.setGridStyleId"
      )
    ),
    command(
      "node.setOverflowDirection",
      (params) => setProperty(
        params,
        "overflowDirection",
        requireString(params, "overflowDirection", "node.setOverflowDirection"),
        "node.setOverflowDirection"
      )
    ),
    command("node.resizeToFit", (params) => {
      const node = requireCallable(
        getSceneNode(requireId(params, "node.resizeToFit"), "node.resizeToFit"),
        "resizeToFit",
        "node.resizeToFit"
      );
      node.resizeToFit();
      return compact(node);
    }),
    command(
      "node.setExportSettings",
      (params) => setProperty(
        params,
        "exportSettings",
        requireArray(params, "exportSettings", "node.setExportSettings"),
        "node.setExportSettings"
      )
    ),
    command(
      "node.export",
      (params) => {
        var _a;
        return serializeExportResult(
          getExportNode(params, "node.export").export(
            optionalTypedRecord(params, "settings")
          ),
          { maxBytes: (_a = optionalNumber(params, "maxBytes")) != null ? _a : void 0 }
        );
      }
    ),
    command(
      "node.exportAsync",
      async (params) => {
        var _a;
        return serializeExportResult(
          await getExportNode(params, "node.exportAsync").exportAsync(
            optionalTypedRecord(params, "settings")
          ),
          { maxBytes: (_a = optionalNumber(params, "maxBytes")) != null ? _a : void 0 }
        );
      }
    ),
    command(
      "node.exportPng",
      (params) => getExportNode(params, "node.exportPng").exportPng(
        optionalRecord(params, "settings")
      )
    )
  ];

  // src/plugin/api/node/operations/hierarchy.ts
  var DEFAULT_FIND_LIMIT = 200;
  var hierarchyOperationCommands = [
    command("node.appendChild", (params) => {
      const parent = getChildrenNode(requireId(params, "node.appendChild"), "node.appendChild");
      const child = getSceneNode(requireString(params, "childId", "node.appendChild"), "node.appendChild");
      requireCallable(
        parent,
        "appendChild",
        "node.appendChild"
      ).appendChild(child);
      return compact(parent);
    }),
    command("node.insertChild", (params) => {
      const parent = getChildrenNode(requireId(params, "node.insertChild"), "node.insertChild");
      const child = getSceneNode(requireString(params, "childId", "node.insertChild"), "node.insertChild");
      requireCallable(
        parent,
        "insertChild",
        "node.insertChild"
      ).insertChild(requireNumber(params, "index", "node.insertChild"), child);
      return compact(parent);
    }),
    command("node.findChildren", (params) => {
      const nodes = getChildrenNode(
        requireId(params, "node.findChildren"),
        "node.findChildren"
      ).findChildren();
      return paginateNodes(nodes, params);
    }),
    command("node.findAll", (params) => {
      const nodes = getChildrenNode(
        requireId(params, "node.findAll"),
        "node.findAll"
      ).findAll();
      return paginateNodes(nodes, params);
    }),
    command("node.findAllWithCriteria", (params) => {
      const nodes = getChildrenNode(
        requireId(params, "node.findAllWithCriteria"),
        "node.findAllWithCriteria"
      ).findAllWithCriteria({
        types: requireStringArray(params, "types", "node.findAllWithCriteria")
      });
      return paginateNodes(nodes, params);
    })
  ];
  function paginateNodes(nodes, params) {
    const limit = readPaginationNumber(params, "limit", DEFAULT_FIND_LIMIT);
    const offset = readPaginationNumber(params, "offset", 0);
    const items = nodes.slice(offset, offset + limit).map((node) => compact(node));
    return {
      items,
      offset,
      limit,
      total: nodes.length,
      truncated: offset + items.length < nodes.length
    };
  }
  function readPaginationNumber(params, key, defaultValue) {
    const value = params == null ? void 0 : params[key];
    if (value === void 0 || value === null) {
      return defaultValue;
    }
    if (typeof value !== "number") {
      throw new Error(`Expected params.${key} to be a number or null.`);
    }
    return value;
  }

  // src/plugin/api/node/operations/layout.ts
  var layoutOperationCommands = [
    command("node.setPosition", (params) => {
      const node = getSceneNode(requireId(params, "node.setPosition"), "node.setPosition");
      setExistingProperty(node, "x", requireNumber(params, "x", "node.setPosition"), "node.setPosition");
      setExistingProperty(node, "y", requireNumber(params, "y", "node.setPosition"), "node.setPosition");
      return compact(node);
    }),
    command("node.setSize", (params) => {
      const node = getSceneNode(requireId(params, "node.setSize"), "node.setSize");
      setExistingProperty(
        node,
        "width",
        requireNumber(params, "width", "node.setSize"),
        "node.setSize"
      );
      setExistingProperty(
        node,
        "height",
        requireNumber(params, "height", "node.setSize"),
        "node.setSize"
      );
      return compact(node);
    }),
    command(
      "node.setBound",
      (params) => setProperty(
        params,
        "bound",
        asTyped(requireRecord(params, "bound", "node.setBound")),
        "node.setBound"
      )
    ),
    command("node.setMinMaxSize", (params) => {
      const node = getSceneNode(
        requireId(params, "node.setMinMaxSize"),
        "node.setMinMaxSize"
      );
      setExistingProperty(node, "minWidth", optionalNumber(params, "minWidth"), "node.setMinMaxSize");
      setExistingProperty(node, "maxWidth", optionalNumber(params, "maxWidth"), "node.setMinMaxSize");
      setExistingProperty(node, "minHeight", optionalNumber(params, "minHeight"), "node.setMinMaxSize");
      setExistingProperty(node, "maxHeight", optionalNumber(params, "maxHeight"), "node.setMinMaxSize");
      return compact(node);
    }),
    command(
      "node.setRotation",
      (params) => setProperty(
        params,
        "rotation",
        requireNumber(params, "rotation", "node.setRotation"),
        "node.setRotation"
      )
    ),
    command(
      "node.setConstrainProportions",
      (params) => setProperty(
        params,
        "constrainProportions",
        requireBoolean(params, "constrainProportions", "node.setConstrainProportions"),
        "node.setConstrainProportions"
      )
    ),
    command(
      "node.setLayoutPositioning",
      (params) => setProperty(
        params,
        "layoutPositioning",
        requireString(params, "layoutPositioning", "node.setLayoutPositioning"),
        "node.setLayoutPositioning"
      )
    ),
    command(
      "node.setAlignSelf",
      (params) => setProperty(
        params,
        "alignSelf",
        requireString(params, "alignSelf", "node.setAlignSelf"),
        "node.setAlignSelf"
      )
    ),
    command(
      "node.setFlexGrow",
      (params) => setProperty(
        params,
        "flexGrow",
        requireNumber(params, "flexGrow", "node.setFlexGrow"),
        "node.setFlexGrow"
      )
    ),
    command("node.rescale", (params) => {
      const node = requireCallable(getSceneNode(requireId(params, "node.rescale"), "node.rescale"), "rescale", "node.rescale");
      node.rescale(
        requireNumber(params, "scale", "node.rescale"),
        optionalRecord(params, "scaleOption")
      );
      return compact(node);
    }),
    command("node.resize", (params) => {
      const node = requireCallable(
        getSceneNode(requireId(params, "node.resize"), "node.resize"),
        "resize",
        "node.resize"
      );
      node.resize(
        requireNumber(params, "width", "node.resize"),
        requireNumber(params, "height", "node.resize")
      );
      return compact(node);
    }),
    command("node.flip", (params) => {
      const node = requireCallable(
        getSceneNode(requireId(params, "node.flip"), "node.flip"),
        "flip",
        "node.flip"
      );
      node.flip(requireString(params, "direction", "node.flip"));
      return compact(node);
    }),
    command(
      "node.setScaleFactor",
      (params) => setProperty(
        params,
        "scaleFactor",
        requireNumber(params, "scaleFactor", "node.setScaleFactor"),
        "node.setScaleFactor"
      )
    ),
    command(
      "node.setAbsoluteTransform",
      (params) => setProperty(
        params,
        "absoluteTransform",
        requireArray(params, "absoluteTransform", "node.setAbsoluteTransform"),
        "node.setAbsoluteTransform"
      )
    ),
    command(
      "node.setRelativeTransform",
      (params) => setProperty(
        params,
        "relativeTransform",
        requireArray(params, "relativeTransform", "node.setRelativeTransform"),
        "node.setRelativeTransform"
      )
    ),
    command(
      "node.setConstraints",
      (params) => setProperty(
        params,
        "constraints",
        asTyped(requireRecord(params, "constraints", "node.setConstraints")),
        "node.setConstraints"
      )
    )
  ];

  // src/plugin/api/node/operations/page.ts
  var pageOperationCommands = [
    command("node.page.setSelection", (params) => {
      const page = getPageNode(requireId(params, "node.page.setSelection"), "node.page.setSelection");
      page.selection = requireStringArray(params, "selectionIds", "node.page.setSelection").map(
        (id) => getSceneNode(id, "node.page.setSelection")
      );
      return compact(page);
    }),
    command("node.page.selectAll", (params) => {
      const page = getPageNode(requireId(params, "node.page.selectAll"), "node.page.selectAll");
      page.selectAll();
      return compact(page);
    }),
    command(
      "node.page.setBgColor",
      (params) => setPageProperty(
        params,
        "bgColor",
        asTyped(requireRecord(params, "bgColor", "node.page.setBgColor")),
        "node.page.setBgColor"
      )
    ),
    command(
      "node.page.setLabel",
      (params) => setPageProperty(
        params,
        "label",
        requireString(params, "label", "node.page.setLabel"),
        "node.page.setLabel"
      )
    ),
    command(
      "node.page.clone",
      (params) => compact(getPageNode(requireId(params, "node.page.clone"), "node.page.clone").clone())
    )
  ];

  // src/plugin/api/node/operations/paint.ts
  var paintOperationCommands = [
    command(
      "node.setOpacity",
      (params) => setProperty(params, "opacity", requireNumber(params, "opacity", "node.setOpacity"), "node.setOpacity")
    ),
    command(
      "node.setBlendMode",
      (params) => setProperty(params, "blendMode", requireString(params, "blendMode", "node.setBlendMode"), "node.setBlendMode")
    ),
    command(
      "node.setMask",
      (params) => setProperty(params, "isMask", requireBoolean(params, "isMask", "node.setMask"), "node.setMask")
    ),
    command(
      "node.setMaskOutline",
      (params) => setProperty(params, "isMaskOutline", requireBoolean(params, "isMaskOutline", "node.setMaskOutline"), "node.setMaskOutline")
    ),
    command(
      "node.setMaskVisible",
      (params) => setProperty(params, "isMaskVisible", requireBoolean(params, "isMaskVisible", "node.setMaskVisible"), "node.setMaskVisible")
    ),
    command(
      "node.setEffects",
      (params) => setProperty(params, "effects", requireArray(params, "effects", "node.setEffects"), "node.setEffects")
    ),
    command(
      "node.setEffectStyleId",
      (params) => setProperty(params, "effectStyleId", requireString(params, "effectStyleId", "node.setEffectStyleId"), "node.setEffectStyleId")
    ),
    command(
      "node.setFills",
      (params) => setProperty(params, "fills", requireArray(params, "fills", "node.setFills"), "node.setFills")
    ),
    command(
      "node.setStrokes",
      (params) => setProperty(params, "strokes", requireArray(params, "strokes", "node.setStrokes"), "node.setStrokes")
    ),
    command(
      "node.setStrokeWeight",
      (params) => setProperty(params, "strokeWeight", requireNumber(params, "strokeWeight", "node.setStrokeWeight"), "node.setStrokeWeight")
    ),
    command(
      "node.setStrokeAlign",
      (params) => setProperty(params, "strokeAlign", requireString(params, "strokeAlign", "node.setStrokeAlign"), "node.setStrokeAlign")
    ),
    command(
      "node.setStrokeCap",
      (params) => setProperty(params, "strokeCap", requireString(params, "strokeCap", "node.setStrokeCap"), "node.setStrokeCap")
    ),
    command(
      "node.setStrokeJoin",
      (params) => setProperty(params, "strokeJoin", requireString(params, "strokeJoin", "node.setStrokeJoin"), "node.setStrokeJoin")
    ),
    command(
      "node.setStrokeStyle",
      (params) => setProperty(params, "strokeStyle", requireString(params, "strokeStyle", "node.setStrokeStyle"), "node.setStrokeStyle")
    ),
    command(
      "node.setDashCap",
      (params) => setProperty(params, "dashCap", requireString(params, "dashCap", "node.setDashCap"), "node.setDashCap")
    ),
    command(
      "node.setStrokeDashes",
      (params) => setProperty(params, "strokeDashes", requireArray(params, "strokeDashes", "node.setStrokeDashes"), "node.setStrokeDashes")
    ),
    command(
      "node.setFillStyleId",
      (params) => setProperty(params, "fillStyleId", requireString(params, "fillStyleId", "node.setFillStyleId"), "node.setFillStyleId")
    ),
    command(
      "node.setStrokeStyleId",
      (params) => setProperty(params, "strokeStyleId", requireString(params, "strokeStyleId", "node.setStrokeStyleId"), "node.setStrokeStyleId")
    ),
    command(
      "node.setStrokeFillStyleId",
      (params) => setProperty(params, "strokeFillStyleId", requireString(params, "strokeFillStyleId", "node.setStrokeFillStyleId"), "node.setStrokeFillStyleId")
    ),
    command(
      "node.setStrokeWidthStyleId",
      (params) => setProperty(params, "strokeWidthStyleId", requireString(params, "strokeWidthStyleId", "node.setStrokeWidthStyleId"), "node.setStrokeWidthStyleId")
    ),
    command(
      "node.setPaddingStyleId",
      (params) => setProperty(params, "paddingStyleId", requireString(params, "paddingStyleId", "node.setPaddingStyleId"), "node.setPaddingStyleId")
    ),
    command(
      "node.setSpacingStyleId",
      (params) => setProperty(params, "spacingStyleId", requireString(params, "spacingStyleId", "node.setSpacingStyleId"), "node.setSpacingStyleId")
    ),
    command(
      "node.setCornerRadiusStyleId",
      (params) => setProperty(params, "cornerRadiusStyleId", requireString(params, "cornerRadiusStyleId", "node.setCornerRadiusStyleId"), "node.setCornerRadiusStyleId")
    ),
    command("node.outlineStroke", (params) => {
      const node = requireCallable(
        getSceneNode(requireId(params, "node.outlineStroke"), "node.outlineStroke"),
        "outlineStroke",
        "node.outlineStroke"
      );
      const outlined = node.outlineStroke();
      return outlined ? compact(outlined) : null;
    }),
    command(
      "node.setCornerSmooth",
      (params) => setProperty(params, "cornerSmooth", requireNumber(params, "cornerSmooth", "node.setCornerSmooth"), "node.setCornerSmooth")
    ),
    command(
      "node.setCornerRadius",
      (params) => setProperty(params, "cornerRadius", requireNumber(params, "cornerRadius", "node.setCornerRadius"), "node.setCornerRadius")
    ),
    command("node.setIndependentCornerRadii", (params) => {
      const node = getSceneNode(requireId(params, "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
      setExistingProperty(node, "topLeftRadius", requireNumber(params, "topLeftRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
      setExistingProperty(node, "topRightRadius", requireNumber(params, "topRightRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
      setExistingProperty(node, "bottomLeftRadius", requireNumber(params, "bottomLeftRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
      setExistingProperty(node, "bottomRightRadius", requireNumber(params, "bottomRightRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
      return compact(node);
    }),
    command("node.setRectangleStrokeWeights", (params) => {
      const node = getSceneNode(requireId(params, "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
      setExistingProperty(node, "strokeTopWeight", requireNumber(params, "strokeTopWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
      setExistingProperty(node, "strokeLeftWeight", requireNumber(params, "strokeLeftWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
      setExistingProperty(node, "strokeBottomWeight", requireNumber(params, "strokeBottomWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
      setExistingProperty(node, "strokeRightWeight", requireNumber(params, "strokeRightWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
      return compact(node);
    })
  ];

  // src/plugin/api/node/operations/shape.ts
  var shapeOperationCommands = [
    command(
      "node.ellipse.setArcData",
      (params) => setProperty(
        params,
        "arcData",
        asTyped(requireRecord(params, "arcData", "node.ellipse.setArcData")),
        "node.ellipse.setArcData"
      )
    ),
    command(
      "node.polygon.setPointCount",
      (params) => setProperty(
        params,
        "pointCount",
        requireNumber(params, "pointCount", "node.polygon.setPointCount"),
        "node.polygon.setPointCount"
      )
    ),
    command(
      "node.star.setPointCount",
      (params) => setProperty(
        params,
        "pointCount",
        requireNumber(params, "pointCount", "node.star.setPointCount"),
        "node.star.setPointCount"
      )
    ),
    command(
      "node.star.setInnerRadius",
      (params) => setProperty(
        params,
        "innerRadius",
        requireNumber(params, "innerRadius", "node.star.setInnerRadius"),
        "node.star.setInnerRadius"
      )
    ),
    command(
      "node.pen.setPenPaths",
      (params) => setProperty(
        params,
        "penPaths",
        requireArray(params, "penPaths", "node.pen.setPenPaths"),
        "node.pen.setPenPaths"
      )
    ),
    command(
      "node.boolean.setOperation",
      (params) => setProperty(
        params,
        "booleanOperation",
        requireString(params, "booleanOperation", "node.boolean.setOperation"),
        "node.boolean.setOperation"
      )
    ),
    command("node.line.setCaps", (params) => {
      const node = getSceneNode(requireId(params, "node.line.setCaps"), "node.line.setCaps");
      setExistingProperty(
        node,
        "leftStrokeCap",
        requireString(params, "leftStrokeCap", "node.line.setCaps"),
        "node.line.setCaps"
      );
      setExistingProperty(
        node,
        "rightStrokeCap",
        requireString(params, "rightStrokeCap", "node.line.setCaps"),
        "node.line.setCaps"
      );
      return compact(node);
    }),
    command(
      "node.intelligentContainer.setShaderCode",
      (params) => setProperty(
        params,
        "shaderCode",
        requireString(params, "shaderCode", "node.intelligentContainer.setShaderCode"),
        "node.intelligentContainer.setShaderCode"
      )
    ),
    command(
      "node.intelligentContainer.setPlaying",
      (params) => setProperty(
        params,
        "isPlaying",
        requireBoolean(params, "isPlaying", "node.intelligentContainer.setPlaying"),
        "node.intelligentContainer.setPlaying"
      )
    ),
    command(
      "node.slice.setPreserveRatio",
      (params) => setProperty(
        params,
        "isPreserveRatio",
        requireBoolean(params, "isPreserveRatio", "node.slice.setPreserveRatio"),
        "node.slice.setPreserveRatio"
      )
    ),
    command(
      "node.connector.createText",
      (params) => toCompactTextSublayer(
        getConnectorNode(
          requireId(params, "node.connector.createText"),
          "node.connector.createText"
        ).createText()
      )
    ),
    command("node.connector.getText", (params) => {
      const text = getConnectorNode(
        requireId(params, "node.connector.getText"),
        "node.connector.getText"
      ).text;
      return text ? toCompactTextSublayer(text) : null;
    }),
    command(
      "node.connector.setCornerRadius",
      (params) => setProperty(
        params,
        "cornerRadius",
        optionalNumber(params, "cornerRadius"),
        "node.connector.setCornerRadius"
      )
    ),
    command("node.connector.setEndpoints", (params) => {
      const node = getConnectorNode(
        requireId(params, "node.connector.setEndpoints"),
        "node.connector.setEndpoints"
      );
      node.connectorStart = asTyped(
        requireRecord(params, "connectorStart", "node.connector.setEndpoints")
      );
      node.connectorEnd = asTyped(
        requireRecord(params, "connectorEnd", "node.connector.setEndpoints")
      );
      return compact(node);
    }),
    command("node.connector.setStrokeCaps", (params) => {
      const node = getConnectorNode(
        requireId(params, "node.connector.setStrokeCaps"),
        "node.connector.setStrokeCaps"
      );
      node.connectorStartStrokeCap = requireString(
        params,
        "connectorStartStrokeCap",
        "node.connector.setStrokeCaps"
      );
      node.connectorEndStrokeCap = requireString(
        params,
        "connectorEndStrokeCap",
        "node.connector.setStrokeCaps"
      );
      return compact(node);
    })
  ];

  // src/plugin/api/node/operations/text.ts
  var textOperationCommands = [
    command("node.text.setCharacters", (params) => {
      const text = getTextTarget(params, "node.text.setCharacters");
      text.characters = requireString(params, "characters", "node.text.setCharacters");
      return compactTextTarget(text);
    }),
    command("node.text.insertCharacters", (params) => {
      const text = getTextTarget(params, "node.text.insertCharacters");
      text.insertCharacters(
        requireNumber(params, "start", "node.text.insertCharacters"),
        requireString(params, "characters", "node.text.insertCharacters")
      );
      return compactTextTarget(text);
    }),
    command("node.text.deleteCharacters", (params) => {
      const text = getTextTarget(params, "node.text.deleteCharacters");
      text.deleteCharacters(
        requireNumber(params, "start", "node.text.deleteCharacters"),
        requireNumber(params, "end", "node.text.deleteCharacters")
      );
      return compactTextTarget(text);
    }),
    command(
      "node.text.setAlignHorizontal",
      (params) => setTextProperty(
        params,
        "textAlignHorizontal",
        requireString(params, "textAlignHorizontal", "node.text.setAlignHorizontal"),
        "node.text.setAlignHorizontal"
      )
    ),
    command(
      "node.text.setAlignVertical",
      (params) => setTextProperty(
        params,
        "textAlignVertical",
        requireString(params, "textAlignVertical", "node.text.setAlignVertical"),
        "node.text.setAlignVertical"
      )
    ),
    command(
      "node.text.setAutoResize",
      (params) => setTextProperty(
        params,
        "textAutoResize",
        requireString(params, "textAutoResize", "node.text.setAutoResize"),
        "node.text.setAutoResize"
      )
    ),
    command(
      "node.text.setParagraphSpacing",
      (params) => setTextProperty(
        params,
        "paragraphSpacing",
        requireNumber(params, "paragraphSpacing", "node.text.setParagraphSpacing"),
        "node.text.setParagraphSpacing"
      )
    ),
    command("node.text.setRangeFontSize", (params) => {
      const text = getTextTarget(params, "node.text.setRangeFontSize");
      text.setRangeFontSize(
        rangeStart(params, "node.text.setRangeFontSize"),
        rangeEnd(params, "node.text.setRangeFontSize"),
        requireNumber(params, "fontSize", "node.text.setRangeFontSize")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeTextDecoration", (params) => {
      const text = getTextTarget(params, "node.text.setRangeTextDecoration");
      text.setRangeTextDecoration(
        rangeStart(params, "node.text.setRangeTextDecoration"),
        rangeEnd(params, "node.text.setRangeTextDecoration"),
        requireString(
          params,
          "decoration",
          "node.text.setRangeTextDecoration"
        )
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeFontName", (params) => {
      const text = getTextTarget(params, "node.text.setRangeFontName");
      text.setRangeFontName(
        rangeStart(params, "node.text.setRangeFontName"),
        rangeEnd(params, "node.text.setRangeFontName"),
        asTyped(requireRecord(params, "fontName", "node.text.setRangeFontName"))
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeLetterSpacing", (params) => {
      const text = getTextTarget(params, "node.text.setRangeLetterSpacing");
      text.setRangeLetterSpacing(
        rangeStart(params, "node.text.setRangeLetterSpacing"),
        rangeEnd(params, "node.text.setRangeLetterSpacing"),
        asTyped(
          requireRecord(params, "letterSpacing", "node.text.setRangeLetterSpacing")
        )
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeLineHeight", (params) => {
      const text = getTextTarget(params, "node.text.setRangeLineHeight");
      text.setRangeLineHeight(
        rangeStart(params, "node.text.setRangeLineHeight"),
        rangeEnd(params, "node.text.setRangeLineHeight"),
        asTyped(requireRecord(params, "lineHeight", "node.text.setRangeLineHeight"))
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeFills", (params) => {
      const text = getTextTarget(params, "node.text.setRangeFills");
      text.setRangeFills(
        rangeStart(params, "node.text.setRangeFills"),
        rangeEnd(params, "node.text.setRangeFills"),
        requireArray(params, "fills", "node.text.setRangeFills")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeHyperlink", (params) => {
      const text = getTextTarget(params, "node.text.setRangeHyperlink");
      text.setRangeHyperlink(
        rangeStart(params, "node.text.setRangeHyperlink"),
        rangeEnd(params, "node.text.setRangeHyperlink"),
        optionalRecord(params, "hyperlink")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeTextCase", (params) => {
      const text = getTextTarget(params, "node.text.setRangeTextCase");
      text.setRangeTextCase(
        rangeStart(params, "node.text.setRangeTextCase"),
        rangeEnd(params, "node.text.setRangeTextCase"),
        requireString(params, "textCase", "node.text.setRangeTextCase")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeListStyle", (params) => {
      const text = getTextTarget(params, "node.text.setRangeListStyle");
      text.setRangeListStyle(
        rangeStart(params, "node.text.setRangeListStyle"),
        rangeEnd(params, "node.text.setRangeListStyle"),
        requireString(params, "listStyle", "node.text.setRangeListStyle")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeFillStyleId", (params) => {
      const text = getTextTarget(params, "node.text.setRangeFillStyleId");
      text.setRangeFillStyleId(
        rangeStart(params, "node.text.setRangeFillStyleId"),
        rangeEnd(params, "node.text.setRangeFillStyleId"),
        requireString(params, "fillStyleId", "node.text.setRangeFillStyleId")
      );
      return compactTextTarget(text);
    }),
    command("node.text.setRangeTextStyleId", (params) => {
      const text = getTextTarget(params, "node.text.setRangeTextStyleId");
      text.setRangeTextStyleId(
        rangeStart(params, "node.text.setRangeTextStyleId"),
        rangeEnd(params, "node.text.setRangeTextStyleId"),
        requireString(params, "textStyleId", "node.text.setRangeTextStyleId")
      );
      return compactTextTarget(text);
    })
  ];

  // src/plugin/api/node/operations/index.ts
  var nodeOperationCommands = [
    ...baseOperationCommands,
    ...hierarchyOperationCommands,
    ...layoutOperationCommands,
    ...paintOperationCommands,
    ...containerOperationCommands,
    ...pageOperationCommands,
    ...shapeOperationCommands,
    ...textOperationCommands,
    ...componentOperationCommands
  ];
  var nodeOperationHandlers = handlersFromCommands(nodeOperationCommands);

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

  // src/plugin/api/node/summary.ts
  var NodeSummaryHandler = class extends ApiHandler {
    constructor() {
      super("node.summary");
    }
    async call(params) {
      if (!(params == null ? void 0 : params.id)) {
        throw new Error("node.summary requires params.id");
      }
      const node = mg.getNodeById(params.id);
      const summary = toCompactNode(node, { includeChildren: true });
      if (!summary) {
        throw new Error(`Node not found: ${params.id}`);
      }
      return summary;
    }
  };
  var nodeSummaryHandler = new NodeSummaryHandler();

  // src/plugin/api/api-register.ts
  var registerApis = () => {
    registerApiHandler(apiVersionHandler);
    registerApiHandler(documentHandler);
    registerApiHandler(iconInsertHandler);
    for (const handler of basicMgApiHandlers) {
      registerApiHandler(handler);
    }
    for (const handler of codegenApiHandlers) {
      registerApiHandler(handler);
    }
    registerApiHandler(pageApiHandler);
    registerApiHandler(nodeSummaryHandler);
    for (const handler of nodeOperationHandlers) {
      registerApiHandler(handler);
    }
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
    return isRecord2(value) && value.type === "bridge.request" && typeof value.id === "string" && isInvokeMethodRequest(value.payload);
  }
  function isInvokeMethodRequest(value) {
    return isRecord2(value) && typeof value.method === "string";
  }
  function isRecord2(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
})();
