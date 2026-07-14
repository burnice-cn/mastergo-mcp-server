import {
  asTyped,
  command,
  compact,
  getPageNode,
  getSceneNode,
  requireId,
  requireRecord,
  requireString,
  requireStringArray,
  setPageProperty,
  type OperationCommand,
} from "./toolkit";

export const pageOperationCommands: readonly OperationCommand[] = [
  command("node.page.setSelection", (params) => {
    const page = getPageNode(requireId(params, "node.page.setSelection"), "node.page.setSelection");
    page.selection = requireStringArray(params, "selectionIds", "node.page.setSelection").map((id) =>
      getSceneNode(id, "node.page.setSelection"),
    );
    return compact(page);
  }),
  command("node.page.selectAll", (params) => {
    const page = getPageNode(requireId(params, "node.page.selectAll"), "node.page.selectAll");
    page.selectAll();
    return compact(page);
  }),
  command("node.page.setBgColor", (params) =>
    setPageProperty(
      params,
      "bgColor",
      asTyped<RGBA>(requireRecord(params, "bgColor", "node.page.setBgColor")),
      "node.page.setBgColor",
    ),
  ),
  command("node.page.setLabel", (params) =>
    setPageProperty(
      params,
      "label",
      requireString(params, "label", "node.page.setLabel") as PageNode["label"],
      "node.page.setLabel",
    ),
  ),
  command("node.page.clone", (params) =>
    compact(getPageNode(requireId(params, "node.page.clone"), "node.page.clone").clone()),
  ),
];
