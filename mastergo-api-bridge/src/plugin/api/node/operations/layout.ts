import {
  asTyped,
  command,
  compact,
  getSceneNode,
  optionalNumber,
  optionalRecord,
  requireArray,
  requireBoolean,
  requireCallable,
  requireId,
  requireNumber,
  requireRecord,
  requireString,
  setExistingProperty,
  setProperty,
  type OperationCommand,
} from "./toolkit";

export const layoutOperationCommands: readonly OperationCommand[] = [
  command("node.setPosition", (params) => {
    const node = getSceneNode(requireId(params, "node.setPosition"), "node.setPosition");
    setExistingProperty(node, "x", requireNumber(params, "x", "node.setPosition"), "node.setPosition");
    setExistingProperty(node, "y", requireNumber(params, "y", "node.setPosition"), "node.setPosition");
    return compact(node);
  }),
  command("node.setSize", (params) => {
    const node = getSceneNode(requireId(params, "node.setSize"), "node.setSize");
    setExistingProperty(
      node,
      "width",
      requireNumber(params, "width", "node.setSize"),
      "node.setSize",
    );
    setExistingProperty(
      node,
      "height",
      requireNumber(params, "height", "node.setSize"),
      "node.setSize",
    );
    return compact(node);
  }),
  command("node.setBound", (params) =>
    setProperty(
      params,
      "bound",
      asTyped<Bound>(requireRecord(params, "bound", "node.setBound")),
      "node.setBound",
    ),
  ),
  command("node.setMinMaxSize", (params) => {
    const node = getSceneNode(
      requireId(params, "node.setMinMaxSize"),
      "node.setMinMaxSize",
    );
    setExistingProperty(node, "minWidth", optionalNumber(params, "minWidth"), "node.setMinMaxSize");
    setExistingProperty(node, "maxWidth", optionalNumber(params, "maxWidth"), "node.setMinMaxSize");
    setExistingProperty(node, "minHeight", optionalNumber(params, "minHeight"), "node.setMinMaxSize");
    setExistingProperty(node, "maxHeight", optionalNumber(params, "maxHeight"), "node.setMinMaxSize");
    return compact(node);
  }),
  command("node.setRotation", (params) =>
    setProperty(
      params,
      "rotation",
      requireNumber(params, "rotation", "node.setRotation"),
      "node.setRotation",
    ),
  ),
  command("node.setConstrainProportions", (params) =>
    setProperty(
      params,
      "constrainProportions",
      requireBoolean(params, "constrainProportions", "node.setConstrainProportions"),
      "node.setConstrainProportions",
    ),
  ),
  command("node.setLayoutPositioning", (params) =>
    setProperty(
      params,
      "layoutPositioning",
      requireString(params, "layoutPositioning", "node.setLayoutPositioning"),
      "node.setLayoutPositioning",
    ),
  ),
  command("node.setAlignSelf", (params) =>
    setProperty(
      params,
      "alignSelf",
      requireString(params, "alignSelf", "node.setAlignSelf"),
      "node.setAlignSelf",
    ),
  ),
  command("node.setFlexGrow", (params) =>
    setProperty(
      params,
      "flexGrow",
      requireNumber(params, "flexGrow", "node.setFlexGrow"),
      "node.setFlexGrow",
    ),
  ),
  command("node.rescale", (params) => {
    const node = requireCallable<SceneNode & {
      rescale(scale: number, scaleOption?: ScaleOption): void;
    }>(getSceneNode(requireId(params, "node.rescale"), "node.rescale"), "rescale", "node.rescale");
    node.rescale(
      requireNumber(params, "scale", "node.rescale"),
      optionalRecord(params, "scaleOption") as ScaleOption | undefined,
    );
    return compact(node);
  }),
  command("node.resize", (params) => {
    const node = requireCallable<SceneNode & { resize(width: number, height: number): void }>(
      getSceneNode(requireId(params, "node.resize"), "node.resize"),
      "resize",
      "node.resize",
    );
    node.resize(
      requireNumber(params, "width", "node.resize"),
      requireNumber(params, "height", "node.resize"),
    );
    return compact(node);
  }),
  command("node.flip", (params) => {
    const node = requireCallable<SceneNode & { flip(direction: "VERTICAL" | "HORIZONTAL"): void }>(
      getSceneNode(requireId(params, "node.flip"), "node.flip"),
      "flip",
      "node.flip",
    );
    node.flip(requireString(params, "direction", "node.flip") as "VERTICAL" | "HORIZONTAL");
    return compact(node);
  }),
  command("node.setScaleFactor", (params) =>
    setProperty(
      params,
      "scaleFactor",
      requireNumber(params, "scaleFactor", "node.setScaleFactor"),
      "node.setScaleFactor",
    ),
  ),
  command("node.setAbsoluteTransform", (params) =>
    setProperty(
      params,
      "absoluteTransform",
      requireArray(params, "absoluteTransform", "node.setAbsoluteTransform") as Transform,
      "node.setAbsoluteTransform",
    ),
  ),
  command("node.setRelativeTransform", (params) =>
    setProperty(
      params,
      "relativeTransform",
      requireArray(params, "relativeTransform", "node.setRelativeTransform") as Transform,
      "node.setRelativeTransform",
    ),
  ),
  command("node.setConstraints", (params) =>
    setProperty(
      params,
      "constraints",
      asTyped<Constraints>(requireRecord(params, "constraints", "node.setConstraints")),
      "node.setConstraints",
    ),
  ),
];
