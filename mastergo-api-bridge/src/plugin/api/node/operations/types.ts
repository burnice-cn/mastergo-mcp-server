import type { ApiHandler } from "../../api-handler";
import type {
  CompactNode,
  CompactTextSublayer,
} from "../../compact-node";

export type JsonRecord = Record<string, unknown>;

export type OperationResult =
  | CompactNode
  | CompactNode[]
  | CompactTextSublayer
  | CompactTextSublayer[]
  | JsonRecord
  | JsonRecord[]
  | string
  | string[]
  | number
  | boolean
  | null;

export type OperationCallback = (
  params?: JsonRecord,
) => OperationResult | Promise<OperationResult>;

export type OperationCommand = {
  readonly method: string;
  readonly call: OperationCallback;
};

export type OperationHandler = ApiHandler<JsonRecord, OperationResult>;

export type TextTarget = TextNode | TextSublayerNode;
export type PageOrSceneNode = PageNode | SceneNode;
export type ChildrenNode = PageNode | (SceneNode & ChildrenMixin<SceneNode>);
export type ExportResult = Uint8Array | string;
