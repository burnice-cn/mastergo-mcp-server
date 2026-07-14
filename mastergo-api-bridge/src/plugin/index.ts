import {
  type ApiBridgeResult,
  type InvokeMethodRequest,
  type PluginRequestMessage,
} from "../shared/protocol";
import { getApiHandler, registerApiHandler } from "./api/api-handler";
import { registerApis } from "./api/api-register";
import { apiVersionHandler } from "./api/mg/api-version";

const UI_SIZE = {
  width: 360,
  height: 220,
};

mg.showUI(__html__, UI_SIZE);

registerApis();

mg.ui.onmessage = async (message: unknown) => {
  if (!isPluginRequestMessage(message)) {
    return;
  }

  try {
    const result = await handleBridgeRequest(message.payload);

    mg.ui.postMessage({
      type: "bridge.response",
      id: message.id,
      data: result,
    });
  } catch (error) {
    mg.ui.postMessage({
      type: "bridge.response",
      id: message.id,
      data: {
        code: -1,
        res: null,
        errorMsg: error instanceof Error ? error.message : String(error),
      },
    });
  }
};

async function handleBridgeRequest(payload: InvokeMethodRequest): Promise<ApiBridgeResult> {
  const handler = getApiHandler(payload.method);
  if (handler) {
    const res = await handler.call(payload.params);
    return {
      code: 0,
      res: res,
      errorMsg: "",
    };
  }
  throw new Error(`No api-bridge handler registered for ${payload.method}`);
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
