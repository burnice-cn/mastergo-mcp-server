import { nodeOperationDefinitions } from "./definitions.js";
import { createNodeOperationStrategies } from "./strategy.js";

export const nodeOperationStrategies = createNodeOperationStrategies(
  nodeOperationDefinitions,
);

export const nodeOperationMethodNames = nodeOperationDefinitions.map(
  ({ method }) => method,
);
