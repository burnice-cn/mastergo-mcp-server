import {
  command,
  compact,
  getExportNode,
  getSceneNode,
  optionalNumber,
  optionalRecord,
  optionalTypedRecord,
  requireArray,
  requireBoolean,
  requireCallable,
  requireId,
  requireRecord,
  requireString,
  serializeExportResult,
  setExistingProperty,
  setProperty,
  type OperationCommand,
} from "./toolkit";

export const containerOperationCommands: readonly OperationCommand[] = [
  command("node.setExpanded", (params) =>
    setProperty(
      params,
      "expanded",
      requireBoolean(params, "expanded", "node.setExpanded"),
      "node.setExpanded",
    ),
  ),
  command("node.setAutoLayout", (params) => {
    const node = getSceneNode(requireId(params, "node.setAutoLayout"), "node.setAutoLayout");
    const autoLayout = requireRecord(params, "autoLayout", "node.setAutoLayout");
    for (const [key, value] of Object.entries(autoLayout)) {
      setExistingProperty(node, key, value, "node.setAutoLayout");
    }
    return compact(node);
  }),
  command("node.setClipsContent", (params) =>
    setProperty(
      params,
      "clipsContent",
      requireBoolean(params, "clipsContent", "node.setClipsContent"),
      "node.setClipsContent",
    ),
  ),
  command("node.setLayoutGrids", (params) =>
    setProperty(
      params,
      "layoutGrids",
      requireArray(params, "layoutGrids", "node.setLayoutGrids") as LayoutGrid[],
      "node.setLayoutGrids",
    ),
  ),
  command("node.setGridStyleId", (params) =>
    setProperty(
      params,
      "gridStyleId",
      requireString(params, "gridStyleId", "node.setGridStyleId"),
      "node.setGridStyleId",
    ),
  ),
  command("node.setOverflowDirection", (params) =>
    setProperty(
      params,
      "overflowDirection",
      requireString(params, "overflowDirection", "node.setOverflowDirection") as OverflowDirection,
      "node.setOverflowDirection",
    ),
  ),
  command("node.resizeToFit", (params) => {
    const node = requireCallable<SceneNode & { resizeToFit(): void }>(
      getSceneNode(requireId(params, "node.resizeToFit"), "node.resizeToFit"),
      "resizeToFit",
      "node.resizeToFit",
    );
    node.resizeToFit();
    return compact(node);
  }),
  command("node.setExportSettings", (params) =>
    setProperty(
      params,
      "exportSettings",
      requireArray(params, "exportSettings", "node.setExportSettings") as ExportSettings[],
      "node.setExportSettings",
    ),
  ),
  command("node.export", (params) =>
    serializeExportResult(
      getExportNode(params, "node.export").export(
        optionalTypedRecord<ExportSettings>(params, "settings"),
      ),
      { maxBytes: optionalNumber(params, "maxBytes") ?? undefined },
    ),
  ),
  command("node.exportAsync", async (params) =>
    serializeExportResult(
      await getExportNode(params, "node.exportAsync").exportAsync(
        optionalTypedRecord<ExportSettings>(params, "settings"),
      ),
      { maxBytes: optionalNumber(params, "maxBytes") ?? undefined },
    ),
  ),
  command("node.exportPng", (params) =>
    getExportNode(params, "node.exportPng").exportPng(
      optionalRecord(params, "settings") as Omit<GlobalExportPngSetting, "ids"> | undefined,
    ),
  ),
];
