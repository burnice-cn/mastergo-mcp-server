import { ApiHandler } from "../api-handler";

class ApiVersionHandler extends ApiHandler<undefined, string> {
    constructor() {
        super("mg.apiVersion");
    }

    async call(): Promise<string> {
        return mg.apiVersion;
    }
}

export const apiVersionHandler = new ApiVersionHandler();
