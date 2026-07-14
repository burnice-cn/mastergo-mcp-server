export abstract class ApiHandler<TParams = Record<string, any>, TResult = unknown> {
    constructor(readonly method: string) {}

    abstract call(params?: TParams): Promise<TResult>;
}

// 所有的ApiHandler
const handlers = new Map<string, ApiHandler>();

// 注册
export const registerApiHandler = (handler: ApiHandler): void => {
    handlers.set(handler.method, handler);
};

export const getApiHandler = (method: string | null | undefined): ApiHandler | undefined => {
    if (!method) {
        return undefined;
    }
    return handlers.get(method);
};
