import {
  asTyped,
  command,
  compact,
  getConnectorNode,
  getSceneNode,
  optionalNumber,
  requireArray,
  requireBoolean,
  requireId,
  requireNumber,
  requireRecord,
  requireString,
  setExistingProperty,
  setProperty,
  type OperationCommand,
} from "./toolkit";
import { toCompactTextSublayer } from "../../compact-node";

export const shapeOperationCommands: readonly OperationCommand[] = [
  command("node.ellipse.setArcData", (params) =>
    setProperty(
      params,
      "arcData",
      asTyped<ArcData>(requireRecord(params, "arcData", "node.ellipse.setArcData")),
      "node.ellipse.setArcData",
    ),
  ),
  command("node.polygon.setPointCount", (params) =>
    setProperty(
      params,
      "pointCount",
      requireNumber(params, "pointCount", "node.polygon.setPointCount"),
      "node.polygon.setPointCount",
    ),
  ),
  command("node.star.setPointCount", (params) =>
    setProperty(
      params,
      "pointCount",
      requireNumber(params, "pointCount", "node.star.setPointCount"),
      "node.star.setPointCount",
    ),
  ),
  command("node.star.setInnerRadius", (params) =>
    setProperty(
      params,
      "innerRadius",
      requireNumber(params, "innerRadius", "node.star.setInnerRadius"),
      "node.star.setInnerRadius",
    ),
  ),
  command("node.pen.setPenPaths", (params) =>
    setProperty(
      params,
      "penPaths",
      requireArray(params, "penPaths", "node.pen.setPenPaths") as PenPaths[],
      "node.pen.setPenPaths",
    ),
  ),
  command("node.boolean.setOperation", (params) =>
    setProperty(
      params,
      "booleanOperation",
      requireString(params, "booleanOperation", "node.boolean.setOperation"),
      "node.boolean.setOperation",
    ),
  ),
  command("node.line.setCaps", (params) => {
    const node = getSceneNode(requireId(params, "node.line.setCaps"), "node.line.setCaps");
    setExistingProperty(
      node,
      "leftStrokeCap",
      requireString(params, "leftStrokeCap", "node.line.setCaps"),
      "node.line.setCaps",
    );
    setExistingProperty(
      node,
      "rightStrokeCap",
      requireString(params, "rightStrokeCap", "node.line.setCaps"),
      "node.line.setCaps",
    );
    return compact(node);
  }),
  command("node.intelligentContainer.setShaderCode", (params) =>
    setProperty(
      params,
      "shaderCode",
      requireString(params, "shaderCode", "node.intelligentContainer.setShaderCode"),
      "node.intelligentContainer.setShaderCode",
    ),
  ),
  command("node.intelligentContainer.setPlaying", (params) =>
    setProperty(
      params,
      "isPlaying",
      requireBoolean(params, "isPlaying", "node.intelligentContainer.setPlaying"),
      "node.intelligentContainer.setPlaying",
    ),
  ),
  command("node.slice.setPreserveRatio", (params) =>
    setProperty(
      params,
      "isPreserveRatio",
      requireBoolean(params, "isPreserveRatio", "node.slice.setPreserveRatio"),
      "node.slice.setPreserveRatio",
    ),
  ),
  command("node.connector.createText", (params) =>
    toCompactTextSublayer(
      getConnectorNode(
        requireId(params, "node.connector.createText"),
        "node.connector.createText",
      ).createText(),
    ),
  ),
  command("node.connector.getText", (params) => {
    const text = getConnectorNode(
      requireId(params, "node.connector.getText"),
      "node.connector.getText",
    ).text;
    return text ? toCompactTextSublayer(text) : null;
  }),
  command("node.connector.setCornerRadius", (params) =>
    setProperty(
      params,
      "cornerRadius",
      optionalNumber(params, "cornerRadius"),
      "node.connector.setCornerRadius",
    ),
  ),
  command("node.connector.setEndpoints", (params) => {
    const node = getConnectorNode(
      requireId(params, "node.connector.setEndpoints"),
      "node.connector.setEndpoints",
    );
    node.connectorStart = asTyped<ConnectorEndpoint>(
      requireRecord(params, "connectorStart", "node.connector.setEndpoints"),
    );
    node.connectorEnd = asTyped<ConnectorEndpoint>(
      requireRecord(params, "connectorEnd", "node.connector.setEndpoints"),
    );
    return compact(node);
  }),
  command("node.connector.setStrokeCaps", (params) => {
    const node = getConnectorNode(
      requireId(params, "node.connector.setStrokeCaps"),
      "node.connector.setStrokeCaps",
    );
    node.connectorStartStrokeCap = requireString(
      params,
      "connectorStartStrokeCap",
      "node.connector.setStrokeCaps",
    ) as ConnectorStrokeCap;
    node.connectorEndStrokeCap = requireString(
      params,
      "connectorEndStrokeCap",
      "node.connector.setStrokeCaps",
    ) as ConnectorStrokeCap;
    return compact(node);
  }),
];
