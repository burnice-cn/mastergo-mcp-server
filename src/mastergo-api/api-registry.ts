import type { BridgeResponseMessage } from "../mastergo-protocol.js";
import type {
  MasterGoApiListItem,
  MasterGoApiScheme,
  MasterGoApiStrategy,
  MasterGoApiTransport,
} from "./api-strategy.js";

export class UnknownMasterGoApiError extends Error {
  constructor(method: string) {
    super(`Unknown MasterGo API method: ${method}`);
    this.name = "UnknownMasterGoApiError";
  }
}

export class MasterGoApiRegistry {
  private readonly strategies = new Map<string, MasterGoApiStrategy>();

  register(strategy: MasterGoApiStrategy): this {
    if (!strategy.method.trim()) {
      throw new Error("MasterGo API method must not be empty.");
    }

    if (this.strategies.has(strategy.method)) {
      throw new Error(`Duplicate MasterGo API method: ${strategy.method}`);
    }

    this.strategies.set(strategy.method, strategy);
    return this;
  }

  list(options: { query?: string } = {}): MasterGoApiListItem[] {
    const query = options.query?.trim().toLowerCase();

    return [...this.strategies.values()]
      .filter((strategy) => {
        if (!query) {
          return true;
        }

        return (
          strategy.method.toLowerCase().includes(query) ||
          strategy.title.toLowerCase().includes(query) ||
          strategy.description.toLowerCase().includes(query)
        );
      })
      .map((strategy) => strategy.toListItem());
  }

  getScheme(method: string): MasterGoApiScheme | undefined {
    return this.strategies.get(method)?.toScheme();
  }

  async invoke(
    method: string,
    params: Record<string, unknown> | undefined,
    transport: MasterGoApiTransport,
  ): Promise<BridgeResponseMessage> {
    const strategy = this.strategies.get(method);

    if (!strategy) {
      throw new UnknownMasterGoApiError(method);
    }

    return strategy.invoke(transport, params);
  }
}
