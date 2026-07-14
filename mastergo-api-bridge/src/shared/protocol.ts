// 调用mastergo方法请求
export type InvokeMethodRequest = {
  method: string;
  params?: Record<string, unknown>;
};

export type PluginRequestMessage = {
  type: "bridge.request";
  id: string;
  payload: InvokeMethodRequest;
};

export type ApiBridgeResult<T = unknown> = {
  code: number;
  res: T;
  errorMsg: string;
};

export type PluginResponseMessage = {
  type: "bridge.response";
  id: string;
  data: ApiBridgeResult;
};
