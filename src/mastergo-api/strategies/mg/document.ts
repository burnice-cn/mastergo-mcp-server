import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z.object({}).strict();

class DocumentStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "mg.document",
      title: "Read document summary",
      description:
        "Return a compact summary of the current MasterGo document, including pages and the current page.",
      resultDescription:
        "Document id, name, type, page summaries, and the current page summary.",
      readOnly: true,
    });
  }
}

export const documentStrategy = new DocumentStrategy();
