export abstract class ApiHandler<TParams = Record<string, unknown>, TResult = unknown> {
  constructor(readonly method: string) {}

  abstract call(params?: TParams): Promise<TResult>;
}

// 所有的ApiHandler
const handlers = new Map<string, ApiHandler>();

// 注册
export const registerApiHandler = (handler: ApiHandler): void => {
  const method = handler.method;

  if (!method.trim()) {
    throw new Error("MasterGo API bridge method must not be empty.");
  }
  if (method !== method.trim()) {
    throw new Error(
      `MasterGo API bridge method must not contain leading or trailing whitespace: ${method}`,
    );
  }
  if (handlers.has(method)) {
    throw new Error(`Duplicate MasterGo API bridge method: ${method}`);
  }

  handlers.set(method, handler);
};

export const getApiHandler = (method: string | null | undefined): ApiHandler | undefined => {
  if (!method) {
    return undefined;
  }
  return handlers.get(method);
};
