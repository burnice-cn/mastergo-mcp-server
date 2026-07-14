import { MasterGoApiRegistry } from "./api-registry.js";
import { mgApiStrategies } from "./strategies/mg/index.js";
import { nodeApiStrategies } from "./strategies/node/index.js";

export function createMasterGoApiRegistry(): MasterGoApiRegistry {
  const registry = new MasterGoApiRegistry();

  for (const strategy of [...mgApiStrategies, ...nodeApiStrategies]) {
    registry.register(strategy);
  }

  return registry;
}
