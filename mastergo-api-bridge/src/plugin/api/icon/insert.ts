import { ApiHandler } from "../api-handler";
import { toCompactNode, type CompactNode } from "../compact-node";

type IconInsertParams = {
  svg: string;
  name?: string | null;
  size?: number | null;
  x?: number | null;
  y?: number | null;
};

class IconInsertHandler extends ApiHandler<IconInsertParams, CompactNode> {
  constructor() {
    super("icon.insert");
  }

  async call(params?: IconInsertParams): Promise<CompactNode> {
    if (!params?.svg) {
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
}

export const iconInsertHandler = new IconInsertHandler();
