import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { MasterGoApiTransport } from "../../src/mastergo-api/api-strategy.js";
import { createMasterGoApiRegistry } from "../../src/mastergo-api/register-apis.js";
import { nodeOperationMethodNames } from "../../src/mastergo-api/strategies/node/operations.js";
import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../../src/mastergo-protocol.js";

const testDir = dirname(fileURLToPath(import.meta.url));

test("registers the current API catalog in stable order with generated schemes", () => {
  const registry = createMasterGoApiRegistry();

  assert.deepEqual(
    registry.list().map((item) => item.method),
    [
      "mg.apiVersion",
      "mg.document",
      "mg.documentId",
      "mg.command",
      "mg.themeColor",
      "mg.currentUser",
      "mg.viewport",
      "mg.mode",
      "mg.codegen.available",
      "mg.codegen.setComponentTemplate",
      "mg.codegen.getCode",
      "mg.codegen.getDSL",
      "mg.codegen.getCodeByDSL",
      "mg.codegen.onCodeChange",
      "mg.codegen.getLatestCodeChange",
      "mg.codegen.clearLatestCodeChange",
      "mg.getNodeById",
      "mg.getNodeByPosition",
      "mg.getHoverLayer",
      "mg.hexToRGBA",
      "mg.RGBAToHex",
      "mg.notify",
      "mg.createRectangle",
      "mg.createLine",
      "mg.createEllipse",
      "mg.createPolygon",
      "mg.createStar",
      "mg.createPen",
      "mg.createText",
      "mg.createFrame",
      "mg.createSection",
      "mg.createComponent",
      "mg.createPage",
      "mg.createSlice",
      "mg.createConnector",
      "mg.createIntelligentContainer",
      "mg.createNodeFromSvgAsync",
      "mg.listAvailableFontsAsync",
      "mg.loadFontAsync",
      "mg.getLocalPaintStyles",
      "mg.getLocalEffectStyles",
      "mg.getLocalTextStyles",
      "mg.getLocalGridStyles",
      "mg.getLocalStrokeWidthStyles",
      "mg.getLocalCornerRadiusStyles",
      "mg.getLocalPaddingStyles",
      "mg.getLocalSpacingStyles",
      "icon.sources",
      "icon.search",
      "icon.getSvg",
      "icon.insert",
      "icon.cache.clear",
      "node.page",
      "node.summary",
      "node.setName",
      "node.remove",
      "node.clone",
      "node.getPluginData",
      "node.setPluginData",
      "node.getPluginDataKeys",
      "node.removePluginData",
      "node.clearPluginData",
      "node.getSharedPluginData",
      "node.setSharedPluginData",
      "node.getSharedPluginDataKeys",
      "node.removeSharedPluginData",
      "node.clearSharedPluginData",
      "node.setVisible",
      "node.setLocked",
      "node.setComponentPropertyReferences",
      "node.appendChild",
      "node.insertChild",
      "node.findChildren",
      "node.findAll",
      "node.findAllWithCriteria",
      "node.setPosition",
      "node.setSize",
      "node.setBound",
      "node.setMinMaxSize",
      "node.setRotation",
      "node.setConstrainProportions",
      "node.setLayoutPositioning",
      "node.setAlignSelf",
      "node.setFlexGrow",
      "node.rescale",
      "node.resize",
      "node.flip",
      "node.setScaleFactor",
      "node.setAbsoluteTransform",
      "node.setRelativeTransform",
      "node.setConstraints",
      "node.setOpacity",
      "node.setBlendMode",
      "node.setMask",
      "node.setMaskOutline",
      "node.setMaskVisible",
      "node.setEffects",
      "node.setEffectStyleId",
      "node.setFills",
      "node.setStrokes",
      "node.setStrokeWeight",
      "node.setStrokeAlign",
      "node.setStrokeCap",
      "node.setStrokeJoin",
      "node.setStrokeStyle",
      "node.setDashCap",
      "node.setStrokeDashes",
      "node.setFillStyleId",
      "node.setStrokeStyleId",
      "node.setStrokeFillStyleId",
      "node.setStrokeWidthStyleId",
      "node.setPaddingStyleId",
      "node.setSpacingStyleId",
      "node.setCornerRadiusStyleId",
      "node.outlineStroke",
      "node.setCornerSmooth",
      "node.setCornerRadius",
      "node.setIndependentCornerRadii",
      "node.setRectangleStrokeWeights",
      "node.setExpanded",
      "node.setAutoLayout",
      "node.setClipsContent",
      "node.setLayoutGrids",
      "node.setGridStyleId",
      "node.setOverflowDirection",
      "node.resizeToFit",
      "node.setExportSettings",
      "node.export",
      "node.exportAsync",
      "node.exportPng",
      "node.page.setSelection",
      "node.page.selectAll",
      "node.page.setBgColor",
      "node.page.setLabel",
      "node.page.clone",
      "node.ellipse.setArcData",
      "node.polygon.setPointCount",
      "node.star.setPointCount",
      "node.star.setInnerRadius",
      "node.pen.setPenPaths",
      "node.boolean.setOperation",
      "node.line.setCaps",
      "node.intelligentContainer.setShaderCode",
      "node.intelligentContainer.setPlaying",
      "node.slice.setPreserveRatio",
      "node.connector.createText",
      "node.connector.getText",
      "node.connector.setCornerRadius",
      "node.connector.setEndpoints",
      "node.connector.setStrokeCaps",
      "node.text.setCharacters",
      "node.text.insertCharacters",
      "node.text.deleteCharacters",
      "node.text.setAlignHorizontal",
      "node.text.setAlignVertical",
      "node.text.setAutoResize",
      "node.text.setParagraphSpacing",
      "node.text.setRangeFontSize",
      "node.text.setRangeTextDecoration",
      "node.text.setRangeFontName",
      "node.text.setRangeLetterSpacing",
      "node.text.setRangeLineHeight",
      "node.text.setRangeFills",
      "node.text.setRangeHyperlink",
      "node.text.setRangeTextCase",
      "node.text.setRangeListStyle",
      "node.text.setRangeFillStyleId",
      "node.text.setRangeTextStyleId",
      "node.component.addProperty",
      "node.component.editProperty",
      "node.component.deleteProperty",
      "node.component.setVariantPropertyValues",
      "node.component.createInstance",
      "node.componentSet.createVariantComponent",
      "node.componentSet.createVariantProperties",
      "node.componentSet.editVariantProperties",
      "node.componentSet.editVariantPropertyValues",
      "node.componentSet.editVariantPropertiesAlias",
      "node.componentSet.editVariantPropertyValuesAlias",
      "node.componentSet.deleteVariantProperty",
      "node.instance.setVariantPropertyValues",
      "node.instance.setProperties",
      "node.instance.setExposedInstance",
      "node.instance.resetOverrides",
      "node.instance.swapComponent",
      "node.instance.detach",
      "node.instance.setMainComponent",
    ],
  );
  assert.deepEqual(registry.getScheme("mg.apiVersion"), {
    method: "mg.apiVersion",
    category: "mg",
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
    category: "mg",
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
    category: "node",
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
  assert.deepEqual(registry.getScheme("mg.getNodeById"), {
    method: "mg.getNodeById",
    category: "mg",
    title: "Get node by id",
    description: "Return a compact summary for one scene node by id, or null if it is not found.",
    resultDescription:
      "Compact node summary including id, name, type, parent id, bounds, visibility, lock state, and child count when available.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {
        id: {
          type: "string",
          minLength: 1,
          description: "Scene node id.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  });
  assert.deepEqual(registry.getScheme("mg.notify"), {
    method: "mg.notify",
    category: "mg",
    title: "Show notification",
    description: "Display a MasterGo notification message in the current plugin sandbox.",
    resultDescription: "Notification status returned after the message is scheduled.",
    readOnly: false,
    inputScheme: {
      type: "object",
      properties: {
        message: {
          type: "string",
          minLength: 1,
          description: "Notification message.",
        },
        options: {
          anyOf: [
            {
              type: "object",
              properties: {
                position: {
                  anyOf: [
                    {
                      type: "string",
                      enum: ["top", "bottom"],
                    },
                    {
                      type: "null",
                    },
                  ],
                  description: "Notification vertical position.",
                },
                type: {
                  anyOf: [
                    {
                      type: "string",
                      enum: [
                        "normal",
                        "highlight",
                        "error",
                        "warning",
                        "success",
                      ],
                    },
                    {
                      type: "null",
                    },
                  ],
                  description: "Notification visual type.",
                },
                timeout: {
                  anyOf: [
                    {
                      type: "number",
                      minimum: 0,
                    },
                    {
                      type: "null",
                    },
                  ],
                  description: "Notification timeout in milliseconds.",
                },
                isLoading: {
                  anyOf: [
                    {
                      type: "boolean",
                    },
                    {
                      type: "null",
                    },
                  ],
                  description: "Whether the notification shows a loading state.",
                },
              },
              additionalProperties: false,
            },
            {
              type: "null",
            },
          ],
          description: "Optional notification settings.",
        },
      },
      required: ["message"],
      additionalProperties: false,
    },
  });
  assert.deepEqual(registry.getScheme("mg.createRectangle"), {
    method: "mg.createRectangle",
    category: "mg",
    title: "Create rectangle node",
    description: "Create a rectangle node and return its compact summary.",
    resultDescription: "Compact summary for the created rectangle node.",
    readOnly: false,
    inputScheme: {
      type: "object",
      properties: {
        name: {
          anyOf: [
            {
              type: "string",
              minLength: 1,
            },
            {
              type: "null",
            },
          ],
          description: "Optional name to assign to the created node.",
        },
      },
      additionalProperties: false,
    },
  });
  assert.deepEqual(registry.getScheme("mg.RGBAToHex"), {
    method: "mg.RGBAToHex",
    category: "mg",
    title: "Convert RGBA to hex",
    description: "Convert an RGBA color object to a hex color string.",
    resultDescription: "Hex color string returned by mg.RGBAToHex.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {
        rgba: {
          type: "object",
          properties: {
            r: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            g: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            b: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            a: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },
          required: ["r", "g", "b", "a"],
          additionalProperties: false,
          description: "RGBA color with channels in the 0..1 range.",
        },
      },
      required: ["rgba"],
      additionalProperties: false,
    },
  });
  assert.equal(registry.getScheme("node.text.setRangeFontSize")?.readOnly, false);
  assert.deepEqual(registry.getScheme("node.text.setRangeFontSize")?.inputScheme, {
    type: "object",
    properties: {
      id: {
        type: "string",
        minLength: 1,
        description: "Scene node id.",
      },
      start: {
        type: "integer",
        minimum: 0,
        maximum: 9007199254740991,
        description: "Inclusive range start.",
      },
      end: {
        type: "integer",
        minimum: 0,
        maximum: 9007199254740991,
        description: "Exclusive range end.",
      },
      fontSize: {
        type: "number",
        minimum: 0,
        description: "Font size in pixels.",
      },
    },
    required: ["id", "start", "end", "fontSize"],
    additionalProperties: false,
  });
  assert.equal(registry.getScheme("node.setFills")?.readOnly, false);
  assert.equal(registry.getScheme("node.findAllWithCriteria")?.readOnly, true);
  assert.equal(
    registry.getScheme("node.text.setRangeFontSize")?.description,
    "Set font size for a text range on a TextNode or connector text sublayer.",
  );
  assert.equal(
    registry.getScheme("node.setFills")?.description,
    "Replace the node fills array, commonly used to set solid, gradient, or image fills.",
  );
  assert.equal(
    registry.getScheme("node.findAll")?.description,
    "Find descendant scene nodes with pagination and return compact node summaries.",
  );
  assert.equal(
    registry.getScheme("node.exportAsync")?.description,
    "Export a node asynchronously and return a string or base64 encoded binary payload.",
  );
  assert.equal(
    registry.getScheme("node.component.createInstance")?.description,
    "Create an instance from a component node and return the new instance summary.",
  );
  const fillsScheme = registry.getScheme("node.setFills")?.inputScheme.properties?.fills;
  assert.equal((fillsScheme as { type?: string } | undefined)?.type, "array");
  const solidPaintScheme = (fillsScheme as {
    items?: { anyOf?: Array<{ properties?: Record<string, unknown> }> };
  }).items?.anyOf?.[0];
  assert.deepEqual(solidPaintScheme?.properties?.type, {
    type: "string",
    const: "SOLID",
  });
  assert.deepEqual(
    (solidPaintScheme?.properties?.color as { properties?: Record<string, unknown> })
      .properties?.r,
    {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
  );
  assert.deepEqual(registry.getScheme("mg.codegen.getCode")?.inputScheme, {
    type: "object",
    properties: {
      layerId: {
        type: "string",
        minLength: 1,
        description: "Layer id to generate code for.",
      },
      framework: {
        type: "string",
        enum: ["REACT", "VUE2", "VUE3", "ANDROID", "IOS"],
        description: "Target code generation framework.",
      },
      maxJsonBytes: {
        anyOf: [
          {
            type: "integer",
            minimum: 1,
            maximum: 9007199254740991,
          },
          {
            type: "null",
          },
        ],
        description: "Maximum JSON string length allowed for the returned payload.",
      },
    },
    required: ["layerId", "framework"],
    additionalProperties: false,
  });
  assert.deepEqual(registry.getScheme("icon.search"), {
    method: "icon.search",
    category: "icon",
    title: "Search SVG icons and illustrations",
    description:
      "Search configured SVG icon and illustration sources for editable SVG assets without inserting them.",
    resultDescription:
      "Paged SVG icon or illustration candidates with ids, source metadata, collections, and optional preview SVG.",
    readOnly: true,
    inputScheme: {
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1,
          description:
            "SVG icon or illustration search keyword, for example search, home, trash, arrow-left, empty-state, or chart.",
        },
        source: {
          anyOf: [
            {
              type: "string",
              enum: ["iconify"],
            },
            {
              type: "null",
            },
          ],
          description: "Icon source id. Defaults to iconify.",
        },
        collections: {
          anyOf: [
            {
              type: "array",
              items: {
                type: "string",
                minLength: 1,
              },
            },
            {
              type: "null",
            },
          ],
          description:
            "Optional Iconify collection prefixes to search, such as lucide, mdi, tabler, or material-symbols.",
        },
        limit: {
          anyOf: [
            {
              type: "integer",
              minimum: 1,
              maximum: 50,
            },
            {
              type: "null",
            },
          ],
          description: "Maximum number of results. Defaults to 20.",
        },
        offset: {
          anyOf: [
            {
              type: "integer",
              minimum: 0,
              maximum: 9007199254740991,
            },
            {
              type: "null",
            },
          ],
          description: "Result offset for pagination. Defaults to 0.",
        },
        includePreviewSvg: {
          anyOf: [
            {
              type: "boolean",
            },
            {
              type: "null",
            },
          ],
          description: "Whether to include sanitized preview SVG for each returned icon.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  });
  assert.equal(registry.getScheme("icon.insert")?.readOnly, false);
  assert.equal(
    registry.getScheme("icon.insert")?.description,
    "Fetch or sanitize an SVG icon/illustration and insert it as an editable vector node in the current MasterGo document.",
  );
  assert.deepEqual(registry.getScheme("node.findAll")?.inputScheme, {
    type: "object",
    properties: {
      id: {
        type: "string",
        minLength: 1,
        description: "Page or scene node id.",
      },
      limit: {
        anyOf: [
          {
            type: "integer",
            minimum: 1,
            maximum: 1000,
          },
          {
            type: "null",
          },
        ],
        description: "Maximum number of nodes to return. Defaults to 200.",
      },
      offset: {
        anyOf: [
          {
            type: "integer",
            minimum: 0,
            maximum: 9007199254740991,
          },
          {
            type: "null",
          },
        ],
        description: "Number of matching nodes to skip. Defaults to 0.",
      },
    },
    required: ["id"],
    additionalProperties: false,
  });
  assert.deepEqual(registry.getScheme("node.exportAsync")?.inputScheme, {
    type: "object",
    properties: {
      id: {
        type: "string",
        minLength: 1,
        description: "Scene node id.",
      },
      settings: {
        anyOf: [
          {
            type: "object",
            propertyNames: {
              type: "string",
            },
            additionalProperties: {},
            description: "JSON object matching the MasterGo plugin typing for this value.",
          },
          {
            type: "null",
          },
        ],
      },
      maxBytes: {
        anyOf: [
          {
            type: "integer",
            minimum: 1,
            maximum: 9007199254740991,
          },
          {
            type: "null",
          },
        ],
        description: "Maximum byte length allowed for binary export results.",
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

  await assert.rejects(registry.invoke("node.page", {}, transport), /id:/);
  assert.equal(requests.length, 0);

  const iconSources = await registry.invoke("icon.sources", undefined, transport);
  assert.equal(requests.length, 0);
  assert.equal(iconSources.data.code, 0);

  await registry.invoke("node.page", { id: "page-1" }, transport);
  await registry.invoke("mg.getNodeById", { id: "node-1" }, transport);
  await registry.invoke("mg.RGBAToHex", {
    rgba: { r: 1, g: 0.5, b: 0, a: 1 },
  }, transport);
  await registry.invoke("node.setFills", {
    id: "node-1",
    fills: [
      {
        type: "SOLID",
        color: { r: 1, g: 0, b: 0, a: 1 },
      },
    ],
  }, transport);
  await assert.rejects(
    registry.invoke("mg.RGBAToHex", {
      rgba: { r: 2, g: 0.5, b: 0, a: 1 },
    }, transport),
    /Invalid params for mg\.RGBAToHex: rgba\.r:/,
  );
  await assert.rejects(
    registry.invoke("node.setFills", {
      id: "node-1",
      fills: [
        {
          type: "SOLID",
          color: { r: 2, g: 0, b: 0, a: 1 },
        },
      ],
    }, transport),
    /Invalid params for node\.setFills:/,
  );
  assert.deepEqual(requests, [
    {
      method: "node.page",
      params: { id: "page-1" },
    },
    {
      method: "mg.getNodeById",
      params: { id: "node-1" },
    },
    {
      method: "mg.RGBAToHex",
      params: { rgba: { r: 1, g: 0.5, b: 0, a: 1 } },
    },
    {
      method: "node.setFills",
      params: {
        id: "node-1",
        fills: [
          {
            type: "SOLID",
            color: { r: 1, g: 0, b: 0, a: 1 },
          },
        ],
      },
    },
  ]);
});

test("keeps server and bridge node operation method registries synchronized", () => {
  assert.deepEqual(readBridgeNodeOperationMethodNames(), nodeOperationMethodNames);
});

function readBridgeNodeOperationMethodNames(): string[] {
  const operationsDir = resolve(
    testDir,
    "../../../mastergo-api-bridge/src/plugin/api/node/operations",
  );
  const files = [
    "base.ts",
    "hierarchy.ts",
    "layout.ts",
    "paint.ts",
    "container.ts",
    "page.ts",
    "shape.ts",
    "text.ts",
    "component.ts",
  ];

  return files.flatMap((file) => {
    const source = readFileSync(resolve(operationsDir, file), "utf8");

    return [...source.matchAll(/command\("([^"]+)"/g)].map((match) => match[1]);
  });
}
