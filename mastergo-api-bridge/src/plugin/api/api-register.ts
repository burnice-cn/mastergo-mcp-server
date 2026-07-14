import { registerApiHandler } from "./api-handler";
import { apiVersionHandler } from "./mg/api-version";
import { documentHandler } from "./mg/document";
import { pageApiHandler } from "./node/page";

export const registerApis = () => {

    registerApiHandler(apiVersionHandler);
    registerApiHandler(documentHandler);
    registerApiHandler(pageApiHandler);
};
