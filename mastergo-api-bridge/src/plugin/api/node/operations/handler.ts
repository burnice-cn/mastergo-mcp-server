import { ApiHandler } from "../../api-handler";
import type {
  JsonRecord,
  OperationCallback,
  OperationCommand,
  OperationHandler,
  OperationResult,
} from "./types";

class NodeOperationHandler extends ApiHandler<JsonRecord, OperationResult> {
  constructor(method: string, private readonly callback: OperationCallback) {
    super(method);
  }

  async call(params?: JsonRecord): Promise<OperationResult> {
    return this.callback(params);
  }
}

export function command(method: string, call: OperationCallback): OperationCommand {
  return { method, call };
}

export function handlersFromCommands(
  commands: readonly OperationCommand[],
): readonly OperationHandler[] {
  return commands.map(({ method, call }) => new NodeOperationHandler(method, call));
}
