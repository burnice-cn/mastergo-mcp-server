import type { MasterGoApiStrategy } from "../../api-strategy.js";
import { apiVersionStrategy } from "./api-version.js";
import { basicMgApiStrategies } from "./basic.js";
import { codegenStrategies } from "./codegen.js";
import { documentStrategy } from "./document.js";

export const mgApiStrategies: readonly MasterGoApiStrategy[] = [
  apiVersionStrategy,
  documentStrategy,
  ...basicMgApiStrategies.slice(0, 5),
  ...codegenStrategies,
  ...basicMgApiStrategies.slice(5),
];
