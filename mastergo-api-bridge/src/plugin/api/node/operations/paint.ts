import {
  command,
  compact,
  getSceneNode,
  requireArray,
  requireBoolean,
  requireCallable,
  requireId,
  requireNumber,
  requireString,
  setExistingProperty,
  setProperty,
  type OperationCommand,
} from "./toolkit";

export const paintOperationCommands: readonly OperationCommand[] = [
  command("node.setOpacity", (params) =>
    setProperty(params, "opacity", requireNumber(params, "opacity", "node.setOpacity"), "node.setOpacity"),
  ),
  command("node.setBlendMode", (params) =>
    setProperty(params, "blendMode", requireString(params, "blendMode", "node.setBlendMode") as BlendMode, "node.setBlendMode"),
  ),
  command("node.setMask", (params) =>
    setProperty(params, "isMask", requireBoolean(params, "isMask", "node.setMask"), "node.setMask"),
  ),
  command("node.setMaskOutline", (params) =>
    setProperty(params, "isMaskOutline", requireBoolean(params, "isMaskOutline", "node.setMaskOutline"), "node.setMaskOutline"),
  ),
  command("node.setMaskVisible", (params) =>
    setProperty(params, "isMaskVisible", requireBoolean(params, "isMaskVisible", "node.setMaskVisible"), "node.setMaskVisible"),
  ),
  command("node.setEffects", (params) =>
    setProperty(params, "effects", requireArray(params, "effects", "node.setEffects") as Effect[], "node.setEffects"),
  ),
  command("node.setEffectStyleId", (params) =>
    setProperty(params, "effectStyleId", requireString(params, "effectStyleId", "node.setEffectStyleId"), "node.setEffectStyleId"),
  ),
  command("node.setFills", (params) =>
    setProperty(params, "fills", requireArray(params, "fills", "node.setFills") as Paint[], "node.setFills"),
  ),
  command("node.setStrokes", (params) =>
    setProperty(params, "strokes", requireArray(params, "strokes", "node.setStrokes") as Paint[], "node.setStrokes"),
  ),
  command("node.setStrokeWeight", (params) =>
    setProperty(params, "strokeWeight", requireNumber(params, "strokeWeight", "node.setStrokeWeight"), "node.setStrokeWeight"),
  ),
  command("node.setStrokeAlign", (params) =>
    setProperty(params, "strokeAlign", requireString(params, "strokeAlign", "node.setStrokeAlign") as StrokeAlign, "node.setStrokeAlign"),
  ),
  command("node.setStrokeCap", (params) =>
    setProperty(params, "strokeCap", requireString(params, "strokeCap", "node.setStrokeCap") as StrokeCap, "node.setStrokeCap"),
  ),
  command("node.setStrokeJoin", (params) =>
    setProperty(params, "strokeJoin", requireString(params, "strokeJoin", "node.setStrokeJoin") as StrokeJoin, "node.setStrokeJoin"),
  ),
  command("node.setStrokeStyle", (params) =>
    setProperty(params, "strokeStyle", requireString(params, "strokeStyle", "node.setStrokeStyle") as StrokeStyle, "node.setStrokeStyle"),
  ),
  command("node.setDashCap", (params) =>
    setProperty(params, "dashCap", requireString(params, "dashCap", "node.setDashCap") as DashCap, "node.setDashCap"),
  ),
  command("node.setStrokeDashes", (params) =>
    setProperty(params, "strokeDashes", requireArray(params, "strokeDashes", "node.setStrokeDashes") as number[], "node.setStrokeDashes"),
  ),
  command("node.setFillStyleId", (params) =>
    setProperty(params, "fillStyleId", requireString(params, "fillStyleId", "node.setFillStyleId"), "node.setFillStyleId"),
  ),
  command("node.setStrokeStyleId", (params) =>
    setProperty(params, "strokeStyleId", requireString(params, "strokeStyleId", "node.setStrokeStyleId"), "node.setStrokeStyleId"),
  ),
  command("node.setStrokeFillStyleId", (params) =>
    setProperty(params, "strokeFillStyleId", requireString(params, "strokeFillStyleId", "node.setStrokeFillStyleId"), "node.setStrokeFillStyleId"),
  ),
  command("node.setStrokeWidthStyleId", (params) =>
    setProperty(params, "strokeWidthStyleId", requireString(params, "strokeWidthStyleId", "node.setStrokeWidthStyleId"), "node.setStrokeWidthStyleId"),
  ),
  command("node.setPaddingStyleId", (params) =>
    setProperty(params, "paddingStyleId", requireString(params, "paddingStyleId", "node.setPaddingStyleId"), "node.setPaddingStyleId"),
  ),
  command("node.setSpacingStyleId", (params) =>
    setProperty(params, "spacingStyleId", requireString(params, "spacingStyleId", "node.setSpacingStyleId"), "node.setSpacingStyleId"),
  ),
  command("node.setCornerRadiusStyleId", (params) =>
    setProperty(params, "cornerRadiusStyleId", requireString(params, "cornerRadiusStyleId", "node.setCornerRadiusStyleId"), "node.setCornerRadiusStyleId"),
  ),
  command("node.outlineStroke", (params) => {
    const node = requireCallable<SceneNode & { outlineStroke(): SceneNode | null }>(
      getSceneNode(requireId(params, "node.outlineStroke"), "node.outlineStroke"),
      "outlineStroke",
      "node.outlineStroke",
    );
    const outlined = node.outlineStroke();
    return outlined ? compact(outlined) : null;
  }),
  command("node.setCornerSmooth", (params) =>
    setProperty(params, "cornerSmooth", requireNumber(params, "cornerSmooth", "node.setCornerSmooth"), "node.setCornerSmooth"),
  ),
  command("node.setCornerRadius", (params) =>
    setProperty(params, "cornerRadius", requireNumber(params, "cornerRadius", "node.setCornerRadius"), "node.setCornerRadius"),
  ),
  command("node.setIndependentCornerRadii", (params) => {
    const node = getSceneNode(requireId(params, "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
    setExistingProperty(node, "topLeftRadius", requireNumber(params, "topLeftRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
    setExistingProperty(node, "topRightRadius", requireNumber(params, "topRightRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
    setExistingProperty(node, "bottomLeftRadius", requireNumber(params, "bottomLeftRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
    setExistingProperty(node, "bottomRightRadius", requireNumber(params, "bottomRightRadius", "node.setIndependentCornerRadii"), "node.setIndependentCornerRadii");
    return compact(node);
  }),
  command("node.setRectangleStrokeWeights", (params) => {
    const node = getSceneNode(requireId(params, "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
    setExistingProperty(node, "strokeTopWeight", requireNumber(params, "strokeTopWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
    setExistingProperty(node, "strokeLeftWeight", requireNumber(params, "strokeLeftWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
    setExistingProperty(node, "strokeBottomWeight", requireNumber(params, "strokeBottomWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
    setExistingProperty(node, "strokeRightWeight", requireNumber(params, "strokeRightWeight", "node.setRectangleStrokeWeights"), "node.setRectangleStrokeWeights");
    return compact(node);
  }),
];
