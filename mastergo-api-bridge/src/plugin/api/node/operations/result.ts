import {
  toCompactNode,
  toCompactTextSublayer,
  type CompactNode,
  type CompactTextSublayer,
} from "../../compact-node";
import {
  requireNumber,
  requireId,
} from "./params";
import {
  getPageNode,
  getSceneNode,
  getTextTarget,
} from "./nodes";
import type {
  ExportResult,
  JsonRecord,
  PageOrSceneNode,
  TextTarget,
} from "./types";

export function setProperty(
  params: JsonRecord | undefined,
  property: string,
  value: unknown,
  method: string,
): CompactNode {
  const node = getSceneNode(requireId(params, method), method);
  setExistingProperty(node, property, value, method);
  return compact(node);
}

export function setPageProperty<TValue>(
  params: JsonRecord | undefined,
  property: string,
  value: TValue,
  method: string,
): CompactNode {
  const node = getPageNode(requireId(params, method), method);
  setExistingProperty(node, property, value, method);
  return compact(node);
}

export function setTextProperty(
  params: JsonRecord | undefined,
  property: string,
  value: unknown,
  method: string,
): CompactNode | CompactTextSublayer {
  const text = getTextTarget(params, method);
  setExistingProperty(text, property, value, method);
  return compactTextTarget(text);
}

export function setExistingProperty(
  target: object,
  property: string,
  value: unknown,
  method: string,
): void {
  if (!(property in target)) {
    throw new Error(`${method} cannot set unsupported property: ${property}`);
  }

  (target as Record<string, unknown>)[property] = value;
}

export function compact(node: PageOrSceneNode): CompactNode {
  const summary = toCompactNode(node, { includeChildren: false });
  if (!summary) {
    throw new Error(`Failed to summarize node: ${node.id}`);
  }

  return summary;
}

export function compactTextTarget(target: TextTarget): CompactNode | CompactTextSublayer {
  if ("type" in target) {
    return compact(target);
  }

  return toCompactTextSublayer(target);
}

export function serializeExportResult(
  result: ExportResult,
  options: { maxBytes?: number } = {},
): string | JsonRecord {
  if (typeof result === "string") {
    return result;
  }

  if (options.maxBytes !== undefined && result.byteLength > options.maxBytes) {
    throw new Error(
      `Export result is ${result.byteLength} bytes, exceeding maxBytes ${options.maxBytes}.`,
    );
  }

  return {
    byteLength: result.byteLength,
    encoding: "base64",
    data: uint8ArrayToBase64(result),
  };
}

export function rangeStart(params: JsonRecord | undefined, method: string): number {
  return requireNumber(params, "start", method);
}

export function rangeEnd(params: JsonRecord | undefined, method: string): number {
  return requireNumber(params, "end", method);
}

function uint8ArrayToBase64(value: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < value.length; index += chunkSize) {
    const chunk = value.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}
