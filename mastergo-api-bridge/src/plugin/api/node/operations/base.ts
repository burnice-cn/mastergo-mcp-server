import {
  command,
  compact,
  getBaseNode,
  getPageOrSceneNode,
  requireBoolean,
  requireCallable,
  requireId,
  requireString,
  optionalRecord,
  setProperty,
  type OperationCommand,
} from "./toolkit";

export const baseOperationCommands: readonly OperationCommand[] = [
  command("node.setName", (params) => {
    const node = getPageOrSceneNode(requireId(params, "node.setName"), "node.setName");
    node.name = requireString(params, "name", "node.setName");
    return compact(node);
  }),
  command("node.remove", (params) => {
    const node = getPageOrSceneNode(requireId(params, "node.remove"), "node.remove");
    node.remove();
    return { id: node.id, removed: true };
  }),
  command("node.clone", (params) => {
    const node = requireCallable<PageNode | (SceneNode & { clone(): PageNode | SceneNode })>(
      getPageOrSceneNode(requireId(params, "node.clone"), "node.clone"),
      "clone",
      "node.clone",
    );
    return compact(node.clone());
  }),
  command("node.getPluginData", (params) => {
    const node = getBaseNode(requireId(params, "node.getPluginData"), "node.getPluginData");
    return node.getPluginData(requireString(params, "key", "node.getPluginData"));
  }),
  command("node.setPluginData", (params) => {
    const node = getBaseNode(requireId(params, "node.setPluginData"), "node.setPluginData");
    node.setPluginData(
      requireString(params, "key", "node.setPluginData"),
      requireString(params, "value", "node.setPluginData"),
    );
    return compact(node);
  }),
  command("node.getPluginDataKeys", (params) => {
    const node = getBaseNode(
      requireId(params, "node.getPluginDataKeys"),
      "node.getPluginDataKeys",
    );
    return [...node.getPluginDataKeys()];
  }),
  command("node.removePluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.removePluginData"),
      "node.removePluginData",
    );
    node.removePluginData(requireString(params, "key", "node.removePluginData"));
    return compact(node);
  }),
  command("node.clearPluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.clearPluginData"),
      "node.clearPluginData",
    );
    node.clearPluginData();
    return compact(node);
  }),
  command("node.getSharedPluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.getSharedPluginData"),
      "node.getSharedPluginData",
    );
    return node.getSharedPluginData(
      requireString(params, "namespace", "node.getSharedPluginData"),
      requireString(params, "key", "node.getSharedPluginData"),
    );
  }),
  command("node.setSharedPluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.setSharedPluginData"),
      "node.setSharedPluginData",
    );
    node.setSharedPluginData(
      requireString(params, "namespace", "node.setSharedPluginData"),
      requireString(params, "key", "node.setSharedPluginData"),
      requireString(params, "value", "node.setSharedPluginData"),
    );
    return compact(node);
  }),
  command("node.getSharedPluginDataKeys", (params) => {
    const node = getBaseNode(
      requireId(params, "node.getSharedPluginDataKeys"),
      "node.getSharedPluginDataKeys",
    );
    return [
      ...node.getSharedPluginDataKeys(
        requireString(params, "namespace", "node.getSharedPluginDataKeys"),
      ),
    ];
  }),
  command("node.removeSharedPluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.removeSharedPluginData"),
      "node.removeSharedPluginData",
    );
    node.removeSharedPluginData(
      requireString(params, "namespace", "node.removeSharedPluginData"),
      requireString(params, "key", "node.removeSharedPluginData"),
    );
    return compact(node);
  }),
  command("node.clearSharedPluginData", (params) => {
    const node = getBaseNode(
      requireId(params, "node.clearSharedPluginData"),
      "node.clearSharedPluginData",
    );
    node.clearSharedPluginData(
      requireString(params, "namespace", "node.clearSharedPluginData"),
    );
    return compact(node);
  }),
  command("node.setVisible", (params) =>
    setProperty(
      params,
      "isVisible",
      requireBoolean(params, "isVisible", "node.setVisible"),
      "node.setVisible",
    ),
  ),
  command("node.setLocked", (params) =>
    setProperty(
      params,
      "isLocked",
      requireBoolean(params, "isLocked", "node.setLocked"),
      "node.setLocked",
    ),
  ),
  command("node.setComponentPropertyReferences", (params) =>
    setProperty(
      params,
      "componentPropertyReferences",
      optionalRecord(params, "references"),
      "node.setComponentPropertyReferences",
    ),
  ),
];
