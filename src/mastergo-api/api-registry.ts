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
    const method = strategy.method;

    if (!method.trim()) {
      throw new Error("MasterGo API method must not be empty.");
    }

    if (method !== method.trim()) {
      throw new Error(
        `MasterGo API method must not contain leading or trailing whitespace: ${method}`,
      );
    }

    if (this.strategies.has(method)) {
      throw new Error(`Duplicate MasterGo API method: ${method}`);
    }

    strategy.toScheme();
    this.strategies.set(method, strategy);
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
