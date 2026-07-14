import { registerApiHandler } from "./api-handler";
import { iconInsertHandler } from "./icon/insert";
import { apiVersionHandler } from "./mg/api-version";
import { basicMgApiHandlers } from "./mg/basic";
import { codegenApiHandlers } from "./mg/codegen";
import { documentHandler } from "./mg/document";
import { nodeOperationHandlers } from "./node/operations/index";
import { pageApiHandler } from "./node/page";
import { nodeSummaryHandler } from "./node/summary";

export const registerApis = () => {
  registerApiHandler(apiVersionHandler);
  registerApiHandler(documentHandler);
  registerApiHandler(iconInsertHandler);
  for (const handler of basicMgApiHandlers) {
    registerApiHandler(handler);
  }
  for (const handler of codegenApiHandlers) {
    registerApiHandler(handler);
  }
  registerApiHandler(pageApiHandler);
  registerApiHandler(nodeSummaryHandler);
  for (const handler of nodeOperationHandlers) {
    registerApiHandler(handler);
  }
};
