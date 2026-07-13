import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Page node id. Get page ids from mg.document before calling this method."),
  })
  .strict();

class PageStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "node.page",
      title: "Read page summary",
      description:
        "Return a compact summary of one page by page id, including top-level child nodes and current selection ids.",
      resultDescription:
        "Page id, name, type, current-page flag, label, background color, selection ids, flow count, and compact child nodes.",
      readOnly: true,
    });
  }
}

export const pageStrategy = new PageStrategy();
