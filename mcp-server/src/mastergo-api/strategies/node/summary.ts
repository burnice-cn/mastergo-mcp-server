import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Scene node id. Use mg.getNodeById or document queries to discover ids."),
  })
  .strict();

class NodeSummaryStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "node.summary",
      title: "Read node summary",
      description: "Return a compact summary for one scene node by id.",
      resultDescription:
        "Compact node summary including id, name, type, parent id, bounds, visibility, lock state, children, and selected type-specific fields.",
      readOnly: true,
    });
  }
}

export const nodeSummaryStrategy = new NodeSummaryStrategy();
