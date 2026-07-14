import { z } from "zod";

import { MasterGoApiStrategy } from "../../api-strategy.js";

const paramsSchema = z.object({}).strict();

class ApiVersionStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = paramsSchema;

  constructor() {
    super({
      method: "mg.apiVersion",
      title: "Read MasterGo API version",
      description: "Return the MasterGo plugin API version exposed by the current sandbox.",
      resultDescription: "A string or version-like value returned by mg.apiVersion.",
      readOnly: true,
    });
  }
}

export const apiVersionStrategy = new ApiVersionStrategy();
