import type { MasterGoApiStrategy } from "../../api-strategy.js";
import { nodeOperationStrategies } from "./operations.js";
import { pageStrategy } from "./page.js";
import { nodeSummaryStrategy } from "./summary.js";

export const nodeApiStrategies: readonly MasterGoApiStrategy[] = [
  pageStrategy,
  nodeSummaryStrategy,
  ...nodeOperationStrategies,
];
