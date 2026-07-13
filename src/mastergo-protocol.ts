export type InvokeMethodRequest = {
  method: string;
  params?: Record<string, unknown>;
};

export type BridgeRequestMessage = {
  type: "request";
  id: string;
  method: "mastergo.invoke";
  payload: InvokeMethodRequest;
};

export type ApiBridgeResult<T = unknown> = {
  code: number;
  res: T;
  errorMsg: string;
};

export type BridgeResponseMessage = {
  id: string;
  type: "response";
  data: ApiBridgeResult;
};

export type BridgeHelloMessage = {
  type: "hello";
  name?: string;
  version?: string;
  capabilities?: string[];
};

export type BridgeMessage = BridgeResponseMessage | BridgeHelloMessage;
