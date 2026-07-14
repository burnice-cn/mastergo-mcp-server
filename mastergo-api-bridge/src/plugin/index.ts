import {
  type ApiBridgeResult,
  type InvokeMethodRequest,
} from "../shared/protocol";
import { getApiHandler, registerApiHandler } from "./api/api-handler";
import { registerApis } from "./api/api-register";
import { apiVersionHandler } from "./api/mg/api-version";
import { parsePluginRequestMessage } from "./message";

const UI_SIZE = {
  width: 360,
  height: 220,
};

mg.showUI(__html__, UI_SIZE);

registerApis();

mg.ui.onmessage = async (message: unknown) => {
  const request = parsePluginRequestMessage(message);
  if (!request) {
    return;
  }

  try {
    const result = await handleBridgeRequest(request.payload);

    mg.ui.postMessage({
      type: "bridge.response",
      id: request.id,
      data: result,
    });
  } catch (error) {
    mg.ui.postMessage({
      type: "bridge.response",
      id: request.id,
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
