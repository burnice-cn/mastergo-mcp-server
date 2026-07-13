import type { MasterGoApiStrategy } from "../../api-strategy.js";
import { pageStrategy } from "./page.js";

export const nodeApiStrategies: readonly [MasterGoApiStrategy] = [pageStrategy];
