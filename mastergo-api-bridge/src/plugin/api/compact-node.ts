export type CompactNode = {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  removed?: boolean;
  isVisible?: boolean;
  isLocked?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  childCount?: number;
  children?: CompactNode[];
  selectionIds?: string[];
  flowStartingPointCount?: number;
  label?: PageNode["label"];
  bgColor?: RGBA;
  characters?: string;
  hasMissingFont?: boolean;
};

export type CompactStyle = {
  id: string;
  name: string;
  type: CompactableStyle["type"];
  description: string;
  alias: string;
  isExternal: boolean;
  ukey: string;
  publishStatus: PublishStatus;
};

export type CompactTextSublayer = {
  id: string;
  type: "TEXT_SUBLAYER";
  characters: string;
  hasMissingFont: boolean;
  textAlignHorizontal: TextSublayerNode["textAlignHorizontal"];
  textAlignVertical: TextSublayerNode["textAlignVertical"];
  textAutoResize: TextSublayerNode["textAutoResize"];
  paragraphSpacing: number;
};

type CompactableStyle =
  | PaintStyle
  | EffectStyle
  | TextStyle
  | GridStyle
  | StrokeWidthStyle
  | CornerRadiusStyle
  | PaddingStyle
  | SpacingStyle;

export function toCompactNode(
  node: PageNode | SceneNode | null,
  options: { includeChildren?: boolean } = {},
): CompactNode | null {
  if (!node) {
    return null;
  }

  const summary: CompactNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    parentId: getParentId(node),
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
      summary.children = node.children.map((child) => toCompactNode(child) as CompactNode);
    }
  }

  return summary;
}

export function toCompactStyle(style: CompactableStyle): CompactStyle {
  return {
    id: style.id,
    name: style.name,
    type: style.type,
    description: style.description,
    alias: style.alias,
    isExternal: style.isExternal,
    ukey: style.ukey,
    publishStatus: style.publishStatus,
  };
}

export function toCompactTextSublayer(node: TextSublayerNode): CompactTextSublayer {
  return {
    id: node.id,
    type: "TEXT_SUBLAYER",
    characters: node.characters,
    hasMissingFont: node.hasMissingFont,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    textAutoResize: node.textAutoResize,
    paragraphSpacing: node.paragraphSpacing,
  };
}

function getParentId(node: PageNode | SceneNode): string | null {
  if (node.type === "PAGE") {
    return node.parent.id;
  }

  return node.parent?.id ?? null;
}
