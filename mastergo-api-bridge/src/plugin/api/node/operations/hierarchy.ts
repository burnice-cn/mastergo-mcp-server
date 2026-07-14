import {
  command,
  compact,
  getChildrenNode,
  getSceneNode,
  requireCallable,
  requireId,
  requireNumber,
  requireString,
  requireStringArray,
  type ChildrenNode,
  type JsonRecord,
  type OperationCommand,
} from "./toolkit";

const DEFAULT_FIND_LIMIT = 200;

export const hierarchyOperationCommands: readonly OperationCommand[] = [
  command("node.appendChild", (params) => {
    const parent = getChildrenNode(requireId(params, "node.appendChild"), "node.appendChild");
    const child = getSceneNode(requireString(params, "childId", "node.appendChild"), "node.appendChild");
    requireCallable<ChildrenNode & { appendChild(child: SceneNode): void }>(
      parent,
      "appendChild",
      "node.appendChild",
    ).appendChild(child);
    return compact(parent);
  }),
  command("node.insertChild", (params) => {
    const parent = getChildrenNode(requireId(params, "node.insertChild"), "node.insertChild");
    const child = getSceneNode(requireString(params, "childId", "node.insertChild"), "node.insertChild");
    requireCallable<ChildrenNode & { insertChild(index: number, child: SceneNode): void }>(
      parent,
      "insertChild",
      "node.insertChild",
    ).insertChild(requireNumber(params, "index", "node.insertChild"), child);
    return compact(parent);
  }),
  command("node.findChildren", (params) => {
    const nodes = getChildrenNode(
      requireId(params, "node.findChildren"),
      "node.findChildren",
    ).findChildren();
    return paginateNodes(nodes, params);
  }),
  command("node.findAll", (params) => {
    const nodes = getChildrenNode(
      requireId(params, "node.findAll"),
      "node.findAll",
    ).findAll();
    return paginateNodes(nodes, params);
  }),
  command("node.findAllWithCriteria", (params) => {
    const nodes = getChildrenNode(
      requireId(params, "node.findAllWithCriteria"),
      "node.findAllWithCriteria",
    ).findAllWithCriteria({
      types: requireStringArray(params, "types", "node.findAllWithCriteria") as NodeType[],
    });
    return paginateNodes(nodes, params);
  }),
];

function paginateNodes(nodes: ReadonlyArray<SceneNode>, params?: JsonRecord): JsonRecord {
  const limit = readPaginationNumber(params, "limit", DEFAULT_FIND_LIMIT);
  const offset = readPaginationNumber(params, "offset", 0);
  const items = nodes.slice(offset, offset + limit).map((node) => compact(node));

  return {
    items,
    offset,
    limit,
    total: nodes.length,
    truncated: offset + items.length < nodes.length,
  };
}

function readPaginationNumber(
  params: JsonRecord | undefined,
  key: "limit" | "offset",
  defaultValue: number,
): number {
  const value = params?.[key];

  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value !== "number") {
    throw new Error(`Expected params.${key} to be a number or null.`);
  }

  return value;
}
