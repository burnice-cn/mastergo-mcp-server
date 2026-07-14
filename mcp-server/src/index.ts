#!/usr/bin/env node

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { MasterGoBridgeServer } from "./bridge-server.js";
import { loadConfig, type ServerConfig } from "./config.js";
import { createMasterGoApiRegistry } from "./mastergo-api/register-apis.js";

const config = loadConfig();
const bridgeServer = new MasterGoBridgeServer(config);
const apiRegistry = createMasterGoApiRegistry();

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "mastergo-mcp-server",
      version: "0.1.0",
    },
    {
      instructions:
        "Receive MCP requests over Streamable HTTP and forward MasterGo API calls to mastergo-api-bridge over WebSocket.",
    },
  );

  server.registerTool(
    "mastergo_api_list",
    {
      title: "List MasterGo APIs",
      description:
        "List available MasterGo API methods known by this MCP server. Returns method and description only.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Optional keyword filter matched against method, title, and description."),
      },
    },
    async ({ query }) => {
      const apis = apiRegistry.list({ query });

      return jsonResult({
        count: apis.length,
        apis,
        nextStep:
          "Call mastergo_api_scheme with one method name to get its input scheme before calling mastergo_api_call.",
      });
    },
  );

  server.registerTool(
    "mastergo_api_scheme",
    {
      title: "Read MasterGo API input scheme",
      description:
        "Return the input scheme for one MasterGo API method. Use this after mastergo_api_list and before mastergo_api_call.",
      inputSchema: {
        method: z
          .string()
          .trim()
          .min(1)
          .describe("MasterGo API method name, for example mg.document or node.page."),
      },
    },
    async ({ method }) => {
      const scheme = apiRegistry.getScheme(method);

      if (!scheme) {
        return jsonResult(
          {
            method,
            errorMsg: `Unknown MasterGo API method: ${method}`,
            availableApis: apiRegistry.list(),
          },
          true,
        );
      }

      return jsonResult({
        ...scheme,
        nextStep:
          "Call mastergo_api_call with this method and params matching inputScheme.",
      });
    },
  );

  server.registerTool(
    "mastergo_api_call",
    {
      title: "Call MasterGo API method",
      description:
        "Call a MasterGo API method through the connected mastergo-api-bridge. Use mastergo_api_scheme first to get the method input scheme.",
      inputSchema: {
        method: z
          .string()
          .trim()
          .min(1)
          .describe("MasterGo API method name, for example mg.document or node.page."),
        params: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Method params object. For example, node.page requires { id: string }."),
      },
    },
    async ({ method, params }) => {
      try {
        const result = await apiRegistry.invoke(method, params, bridgeServer);

        return jsonResult(result, result.data.code !== 0);
      } catch (error) {
        return jsonResult(
          {
            id: "",
            type: "response",
            data: {
              code: -1,
              res: null,
              errorMsg: error instanceof Error ? error.message : String(error),
            },
          },
          true,
        );
      }
    },
  );

  return server;
}

const httpServer = createServer((req, res) => {
  handleHttpRequest(req, res).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`MCP HTTP request failed: ${message}`);

    if (!res.headersSent) {
      writeJson(res, 500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  });
});

httpServer.on("upgrade", (req, socket, head) => {
  if (bridgeServer.handleUpgrade(req, socket, head)) {
    return;
  }

  socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
  socket.destroy();
});

httpServer.listen(config.httpPort, config.httpHost, () => {
  console.error(`MCP HTTP endpoint: ${config.mcpUrl}`);
  console.error(`MasterGo bridge WebSocket endpoint: ${config.bridgeUrl}`);
});

process.on("SIGINT", () => {
  shutdown().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Shutdown failed: ${message}`);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Shutdown failed: ${message}`);
    process.exit(1);
  });
});

async function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = parseRequestUrl(req, config);

  if (req.method === "GET" && url.pathname === "/health") {
    writeJson(res, 200, {
      ok: true,
      mcpUrl: config.mcpUrl,
      bridgeUrl: config.bridgeUrl,
      bridge: bridgeServer.status(),
    });
    return;
  }

  if (url.pathname !== config.mcpPath) {
    writeJson(res, 404, {
      error: "Not found",
    });
    return;
  }

  if (req.method !== "POST") {
    writeJson(
      res,
      405,
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      },
      {
        Allow: "POST",
      },
    );
    return;
  }

  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } finally {
    await transport.close();
    await mcpServer.close();
  }
}

function jsonResult(data: unknown, isError = false): CallToolResult {
  const structuredContent = isRecord(data) ? data : { result: data ?? null };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data ?? null, null, 2),
      },
    ],
    structuredContent,
    isError,
  };
}

function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function parseRequestUrl(req: IncomingMessage, serverConfig: ServerConfig): URL {
  const host = req.headers.host ?? `${serverConfig.httpHost}:${serverConfig.httpPort}`;
  return new URL(req.url ?? "/", `http://${host}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function shutdown(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await bridgeServer.close();
  process.exit(0);
}
