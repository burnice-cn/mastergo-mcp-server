import {
  requireId,
} from "./params";
import type {
  ChildrenNode,
  JsonRecord,
  PageOrSceneNode,
  TextTarget,
} from "./types";

export function getPageOrSceneNode(id: string, method: string): PageOrSceneNode {
  const page = mg.document.children.find((candidate) => candidate.id === id);
  if (page) {
    return page;
  }

  return getSceneNode(id, method);
}

export function getSceneNode(id: string, method: string): SceneNode {
  const node = mg.getNodeById(id);
  if (!node) {
    throw new Error(`${method} could not find scene node: ${id}`);
  }

  return node;
}

export function getPageNode(id: string, method: string): PageNode {
  const page = mg.document.children.find((candidate) => candidate.id === id);
  if (!page) {
    throw new Error(`${method} could not find page node: ${id}`);
  }

  return page;
}

export function getBaseNode(id: string, method: string): BaseNodeMixin & SceneNode {
  return requireCallable<BaseNodeMixin & SceneNode>(
    getSceneNode(id, method),
    "getPluginData",
    method,
  );
}

export function getChildrenNode(id: string, method: string): ChildrenNode {
  const node = getPageOrSceneNode(id, method);
  if (!("findAll" in node) || typeof node.findAll !== "function") {
    throw new Error(`${method} requires a page or children-capable node.`);
  }

  return node as ChildrenNode;
}

export function getConnectorNode(id: string, method: string): ConnectorNode {
  const node = getSceneNode(id, method);
  if (node.type !== "CONNECTOR") {
    throw new Error(`${method} requires a CONNECTOR node.`);
  }

  return node;
}

export function getComponentNode(id: string, method: string): ComponentNode {
  const node = getSceneNode(id, method);
  if (node.type !== "COMPONENT") {
    throw new Error(`${method} requires a COMPONENT node.`);
  }

  return node;
}

export function getComponentSetNode(id: string, method: string): ComponentSetNode {
  const node = getSceneNode(id, method);
  if (node.type !== "COMPONENT_SET") {
    throw new Error(`${method} requires a COMPONENT_SET node.`);
  }

  return node;
}

export function getComponentPropertiesNode(
  id: string,
  method: string,
): ComponentNode | ComponentSetNode {
  const node = getSceneNode(id, method);
  if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
    throw new Error(`${method} requires a COMPONENT or COMPONENT_SET node.`);
  }

  return node;
}

export function getInstanceNode(id: string, method: string): InstanceNode {
  const node = getSceneNode(id, method);
  if (node.type !== "INSTANCE") {
    throw new Error(`${method} requires an INSTANCE node.`);
  }

  return node;
}

export function getExportNode(
  params: JsonRecord | undefined,
  method: string,
): SceneNode & ExportMixin {
  const node = getSceneNode(requireId(params, method), method);
  if (!("export" in node) || typeof node.export !== "function") {
    throw new Error(`${method} requires an export-capable scene node.`);
  }

  return node as SceneNode & ExportMixin;
}

export function getTextTarget(
  params: JsonRecord | undefined,
  method: string,
): TextTarget {
  const node = getSceneNode(requireId(params, method), method);

  if (node.type === "TEXT") {
    return node;
  }
  if (node.type === "CONNECTOR" && node.text) {
    return node.text;
  }

  throw new Error(`${method} requires a TEXT node or CONNECTOR node with text.`);
}

export function requireCallable<TTarget extends object>(
  target: object,
  functionName: string,
  method: string,
): TTarget {
  if (
    !(functionName in target) ||
    typeof (target as Record<string, unknown>)[functionName] !== "function"
  ) {
    throw new Error(`${method} requires callable ${functionName}.`);
  }

  return target as TTarget;
}
