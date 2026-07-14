import { ApiHandler } from "../api-handler";
import { toCompactNode, type CompactNode } from "../compact-node";

type NodeSummaryParams = {
  id: string;
};

class NodeSummaryHandler extends ApiHandler<NodeSummaryParams, CompactNode> {
  constructor() {
    super("node.summary");
  }

  async call(params?: NodeSummaryParams): Promise<CompactNode> {
    if (!params?.id) {
      throw new Error("node.summary requires params.id");
    }

    const node = mg.getNodeById(params.id);
    const summary = toCompactNode(node, { includeChildren: true });

    if (!summary) {
      throw new Error(`Node not found: ${params.id}`);
    }

    return summary;
  }
}

export const nodeSummaryHandler = new NodeSummaryHandler();
