import { baseOperationCommands } from "./base";
import { componentOperationCommands } from "./component";
import { containerOperationCommands } from "./container";
import { handlersFromCommands } from "./handler";
import { hierarchyOperationCommands } from "./hierarchy";
import { layoutOperationCommands } from "./layout";
import { pageOperationCommands } from "./page";
import { paintOperationCommands } from "./paint";
import { shapeOperationCommands } from "./shape";
import { textOperationCommands } from "./text";

export const nodeOperationCommands = [
  ...baseOperationCommands,
  ...hierarchyOperationCommands,
  ...layoutOperationCommands,
  ...paintOperationCommands,
  ...containerOperationCommands,
  ...pageOperationCommands,
  ...shapeOperationCommands,
  ...textOperationCommands,
  ...componentOperationCommands,
] as const;

export const nodeOperationHandlers = handlersFromCommands(nodeOperationCommands);
