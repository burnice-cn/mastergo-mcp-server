import type {
  InvokeMethodRequest,
  PluginRequestMessage,
} from "../shared/protocol";

export function parsePluginRequestMessage(value: unknown): PluginRequestMessage | null {
  const message = unwrapPluginMessage(value);
  return isPluginRequestMessage(message) ? message : null;
}

function unwrapPluginMessage(value: unknown): unknown {
  if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, "pluginMessage")) {
    return value;
  }

  return value.pluginMessage;
}

function isPluginRequestMessage(value: unknown): value is PluginRequestMessage {
  return (
    isRecord(value) &&
    value.type === "bridge.request" &&
    typeof value.id === "string" &&
    isInvokeMethodRequest(value.payload)
  );
}

function isInvokeMethodRequest(value: unknown): value is InvokeMethodRequest {
  return isRecord(value) && typeof value.method === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
