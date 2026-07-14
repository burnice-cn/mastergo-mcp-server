import type { MasterGoApiStrategy } from "../../api-strategy.js";
import { apiVersionStrategy } from "./api-version.js";
import { documentStrategy } from "./document.js";

export const mgApiStrategies: readonly [MasterGoApiStrategy, MasterGoApiStrategy] = [
  apiVersionStrategy,
  documentStrategy,
];
