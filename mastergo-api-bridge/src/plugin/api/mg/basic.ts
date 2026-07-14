import { toCompactNode, toCompactStyle } from "../compact-node";
import { ApiHandler } from "../api-handler";

type EmptyParams = Record<string, never>;

type NodeIdParams = {
  id: string;
};

type PositionParams = {
  x: number;
  y: number;
};

type CreateNodeParams = {
  name?: string | null;
};

type CreateNodeFromSvgParams = CreateNodeParams & {
  svg: string;
};

type LoadFontParams = {
  family: string;
  style: string;
};

type NotifyParams = {
  message: string;
  options?: NotifyOptions | null;
};

type RGBAToHexParams = {
  rgba: RGBA;
};

type HexToRGBAParams = {
  hex: string;
};

type HandlerCall<TParams, TResult> = (params?: TParams) => TResult | Promise<TResult>;

class CallbackHandler<TParams = EmptyParams, TResult = unknown> extends ApiHandler<
  TParams,
  TResult
> {
  constructor(method: string, private readonly callback: HandlerCall<TParams, TResult>) {
    super(method);
  }

  async call(params?: TParams): Promise<TResult> {
    return this.callback(params);
  }
}

export const basicMgApiHandlers: readonly ApiHandler[] = [
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
    layoutGridVisible: mg.viewport.layoutGridVisible,
  })),
  new CallbackHandler<NodeIdParams>("mg.getNodeById", (params) =>
    toCompactNode(mg.getNodeById(requireParams(params, "mg.getNodeById").id)),
  ),
  new CallbackHandler<PositionParams>("mg.getNodeByPosition", (params) => {
    const { x, y } = requireParams(params, "mg.getNodeByPosition");

    return toCompactNode(mg.getNodeByPosition({ x, y }));
  }),
  new CallbackHandler("mg.getHoverLayer", () => toCompactNode(mg.getHoverLayer())),
  new CallbackHandler<HexToRGBAParams>("mg.hexToRGBA", (params) =>
    mg.hexToRGBA(requireParams(params, "mg.hexToRGBA").hex),
  ),
  new CallbackHandler<RGBAToHexParams>("mg.RGBAToHex", (params) =>
    mg.RGBAToHex(requireParams(params, "mg.RGBAToHex").rgba),
  ),
  new CallbackHandler<NotifyParams>("mg.notify", (params) => {
    const { message, options } = requireParams(params, "mg.notify");
    const notification = mg.notify(message, options ?? undefined);

    return {
      shown: true,
      cancelable: typeof notification.cancel === "function",
    };
  }),
  ...createNodeHandlers(),
  new CallbackHandler<CreateNodeFromSvgParams>(
    "mg.createNodeFromSvgAsync",
    async (params) => {
      const { svg, name } = requireParams(params, "mg.createNodeFromSvgAsync");
      const node = await mg.createNodeFromSvgAsync(svg);

      assignName(node, name);
      return toCompactNode(node);
    },
  ),
  new CallbackHandler("mg.listAvailableFontsAsync", () => mg.listAvailableFontsAsync()),
  new CallbackHandler<LoadFontParams>("mg.loadFontAsync", (params) => {
    const { family, style } = requireParams(params, "mg.loadFontAsync");

    return mg.loadFontAsync({ family, style });
  }),
  ...createLocalStyleHandlers(),
];

function createNodeHandlers(): ApiHandler[] {
  const handlers: Array<[string, () => PageNode | SceneNode]> = [
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
    ["mg.createIntelligentContainer", () => mg.createIntelligentContainer()],
  ];

  return handlers.map(
    ([method, createNode]) =>
      new CallbackHandler<CreateNodeParams>(method, (params) => {
        const node = createNode();

        assignName(node, params?.name);
        return toCompactNode(node);
      }),
  );
}

function createLocalStyleHandlers(): ApiHandler[] {
  return [
    new CallbackHandler("mg.getLocalPaintStyles", () =>
      mg.getLocalPaintStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalEffectStyles", () =>
      mg.getLocalEffectStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalTextStyles", () =>
      mg.getLocalTextStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalGridStyles", () =>
      mg.getLocalGridStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalStrokeWidthStyles", () =>
      mg.getLocalStrokeWidthStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalCornerRadiusStyles", () =>
      mg.getLocalCornerRadiusStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalPaddingStyles", () =>
      mg.getLocalPaddingStyles().map(toCompactStyle),
    ),
    new CallbackHandler("mg.getLocalSpacingStyles", () =>
      mg.getLocalSpacingStyles().map(toCompactStyle),
    ),
  ];
}

function assignName(node: PageNode | SceneNode, name?: string | null): void {
  if (name) {
    node.name = name;
  }
}

function requireParams<TParams>(params: TParams | undefined, method: string): TParams {
  if (!params) {
    throw new Error(`${method} requires params`);
  }

  return params;
}
