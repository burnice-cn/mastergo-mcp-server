import { nodeOperationDefinitions } from "./definitions.js";
import { nodeOperationMetadata } from "./metadata.js";
import { createNodeOperationStrategies } from "./strategy.js";

export const nodeOperationStrategies = createNodeOperationStrategies(
  nodeOperationDefinitions.map((definition) => ({
    ...definition,
    ...nodeOperationMetadata[definition.method],
  })),
);

export const nodeOperationMethodNames = nodeOperationDefinitions.map(
  ({ method }) => method,
);
