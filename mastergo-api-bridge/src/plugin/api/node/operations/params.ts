import type { JsonRecord } from "./types";

export function requireId(params: JsonRecord | undefined, method: string): string {
  return requireString(params, "id", method);
}

export function requireString(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): string {
  const value = requireParam(params, key, method);
  if (typeof value !== "string") {
    throw new Error(`${method} requires string params.${key}`);
  }

  return value;
}

export function optionalString(
  params: JsonRecord | undefined,
  key: string,
): string | null {
  const value = params?.[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`Expected params.${key} to be a string or null.`);
  }

  return value;
}

export function requireNumber(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): number {
  const value = requireParam(params, key, method);
  if (typeof value !== "number") {
    throw new Error(`${method} requires number params.${key}`);
  }

  return value;
}

export function optionalNumber(params: JsonRecord | undefined, key: string): number | null {
  const value = params?.[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "number") {
    throw new Error(`Expected params.${key} to be a number or null.`);
  }

  return value;
}

export function requireBoolean(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): boolean {
  const value = requireParam(params, key, method);
  if (typeof value !== "boolean") {
    throw new Error(`${method} requires boolean params.${key}`);
  }

  return value;
}

export function requireStringOrBoolean(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): string | boolean {
  const value = requireParam(params, key, method);
  if (typeof value !== "string" && typeof value !== "boolean") {
    throw new Error(`${method} requires string or boolean params.${key}`);
  }

  return value;
}

export function requireArray(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): unknown[] {
  const value = requireParam(params, key, method);
  if (!Array.isArray(value)) {
    throw new Error(`${method} requires array params.${key}`);
  }

  return value;
}

export function requireStringArray(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): string[] {
  const value = requireArray(params, key, method);
  if (!value.every((item) => typeof item === "string")) {
    throw new Error(`${method} requires string[] params.${key}`);
  }

  return value;
}

export function requireRecord(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): JsonRecord {
  const value = requireParam(params, key, method);
  if (!isRecord(value)) {
    throw new Error(`${method} requires object params.${key}`);
  }

  return value;
}

export function optionalRecord(params: JsonRecord | undefined, key: string): JsonRecord | null {
  const value = params?.[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    throw new Error(`Expected params.${key} to be an object or null.`);
  }

  return value;
}

export function optionalTypedRecord<TValue>(
  params: JsonRecord | undefined,
  key: string,
): TValue | undefined {
  const value = optionalRecord(params, key);

  return value === null ? undefined : asTyped<TValue>(value);
}

export function asTyped<TValue>(value: unknown): TValue {
  return value as TValue;
}

export function requireParam(
  params: JsonRecord | undefined,
  key: string,
  method: string,
): unknown {
  if (!params || !(key in params)) {
    throw new Error(`${method} requires params.${key}`);
  }

  return params[key];
}

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
