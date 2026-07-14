import type { z } from "zod";

import {
  MasterGoApiStrategy,
  type MasterGoApiMetadata,
} from "../../../api-strategy.js";

export type NodeOperationDefinition = {
  readonly method: string;
  readonly readOnly?: boolean;
  readonly paramsSchema: z.ZodObject;
  readonly title?: string;
  readonly description?: string;
  readonly resultDescription?: string;
};

class NodeOperationStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema: z.ZodObject;

  constructor(metadata: MasterGoApiMetadata, paramsSchema: z.ZodObject) {
    super(metadata);
    this.paramsSchema = paramsSchema;
  }
}

export function operation(
  method: string,
  paramsSchema: z.ZodObject,
  readOnly = false,
): NodeOperationDefinition {
  return { method, paramsSchema, readOnly };
}

export function createNodeOperationStrategies(
  definitions: readonly NodeOperationDefinition[],
): readonly MasterGoApiStrategy[] {
  return definitions.map(({
    method,
    readOnly = false,
    paramsSchema,
    title,
    description,
    resultDescription,
  }) => {
    const label = method.replace(/^node\./, "node ");

    return new NodeOperationStrategy(
      {
        method,
        title: title ?? label,
        description:
          description ?? `Invoke the ${method} MasterGo node operation through the bridge.`,
        resultDescription:
          resultDescription ??
          "Operation result. Mutating operations usually return a compact node summary.",
        readOnly,
      },
      paramsSchema,
    );
  });
}
