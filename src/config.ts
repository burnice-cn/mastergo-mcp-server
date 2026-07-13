const DEFAULT_HTTP_HOST = "127.0.0.1";
const DEFAULT_HTTP_PORT = 3000;
const DEFAULT_MCP_PATH = "/mcp";
const DEFAULT_BRIDGE_PATH = "/bridge";
const DEFAULT_BRIDGE_REQUEST_TIMEOUT_MS = 10_000;

export type ServerConfig = {
  httpHost: string;
  httpPort: number;
  mcpPath: string;
  bridgePath: string;
  bridgeToken?: string;
  bridgeRequestTimeoutMs: number;
  mcpUrl: string;
  bridgeUrl: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const httpHost = env.MCP_HTTP_HOST?.trim() || DEFAULT_HTTP_HOST;
  const httpPort = parsePort(env.MCP_HTTP_PORT);
  const mcpPath = normalizePath(env.MCP_HTTP_PATH, DEFAULT_MCP_PATH);
  const bridgePath = normalizePath(env.MASTERGO_BRIDGE_WS_PATH, DEFAULT_BRIDGE_PATH);
  const bridgeRequestTimeoutMs = parsePositiveInteger(
    env.MASTERGO_BRIDGE_REQUEST_TIMEOUT_MS,
    DEFAULT_BRIDGE_REQUEST_TIMEOUT_MS,
    "MASTERGO_BRIDGE_REQUEST_TIMEOUT_MS",
  );
  const bridgeToken = env.MASTERGO_BRIDGE_TOKEN?.trim() || undefined;
  const publicHost = toPublicHost(httpHost);

  return {
    httpHost,
    httpPort,
    mcpPath,
    bridgePath,
    bridgeToken,
    bridgeRequestTimeoutMs,
    mcpUrl: `http://${publicHost}:${httpPort}${mcpPath}`,
    bridgeUrl: `ws://${publicHost}:${httpPort}${bridgePath}`,
  };
}

function parsePort(value: string | undefined): number {
  return parsePositiveInteger(value, DEFAULT_HTTP_PORT, "MCP_HTTP_PORT", 65_535);
}

function normalizePath(value: string | undefined, fallback: string): string {
  const path = value?.trim() || fallback;

  if (!path.startsWith("/")) {
    throw new Error(`HTTP paths must start with "/": ${path}`);
  }

  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  envName: string,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0 || numberValue > max) {
    throw new Error(`${envName} must be a positive integer no greater than ${max}.`);
  }

  return numberValue;
}

function toPublicHost(host: string): string {
  if (host === "0.0.0.0") {
    return "127.0.0.1";
  }

  if (host === "::") {
    return "[::1]";
  }

  if (host.includes(":") && !host.startsWith("[")) {
    return `[${host}]`;
  }

  return host;
}
