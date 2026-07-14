import { MasterGoApiRegistry } from "./api-registry.js";
import { iconApiStrategies } from "./strategies/icon/index.js";
import { mgApiStrategies } from "./strategies/mg/index.js";
import { nodeApiStrategies } from "./strategies/node/index.js";

export function createMasterGoApiRegistry(): MasterGoApiRegistry {
  const registry = new MasterGoApiRegistry();

  for (const strategy of [...mgApiStrategies, ...iconApiStrategies, ...nodeApiStrategies]) {
    registry.register(strategy);
  }

  return registry;
}
