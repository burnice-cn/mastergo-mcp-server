import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { z } from "zod";

import type { ServerConfig } from "./config.js";
import type {
  BridgeHelloMessage,
  BridgeMessage,
  BridgeRequestMessage,
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "./mastergo-protocol.js";

type PendingRequest = {
  resolve: (value: BridgeResponseMessage) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

type ActiveBridge = {
  id: string;
  connectedAt: string;
  socket: WebSocket;
  info?: BridgeHelloMessage;
};

export type BridgeStatus = {
  connected: boolean;
  connectionId?: string;
  connectedAt?: string;
  client?: Omit<BridgeHelloMessage, "type">;
  pendingRequests: number;
};

const bridgeHelloSchema = z.object({
  type: z.literal("hello"),
  name: z.string().optional(),
  version: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});

const bridgeResponseSchema = z.object({
  id: z.string().min(1),
  type: z.literal("response"),
  data: z.object({
    code: z.number().int(),
    res: z.unknown(),
    errorMsg: z.string(),
  }),
});

const bridgeMessageSchema = z.union([bridgeHelloSchema, bridgeResponseSchema]);

export class MasterGoBridgeServer {
  private readonly wss = new WebSocketServer({ noServer: true });
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private activeBridge?: ActiveBridge;

  constructor(private readonly config: ServerConfig) {
    this.wss.on("connection", (socket) => this.handleConnection(socket));
  }

  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): boolean {
    const url = this.parseRequestUrl(req);

    if (url.pathname !== this.config.bridgePath) {
      return false;
    }

    if (!this.isAuthorized(url)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return true;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit("connection", ws, req);
    });

    return true;
  }

  request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage> {
    const bridge = this.activeBridge;

    if (!bridge || bridge.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("mastergo-api-bridge is not connected."));
    }

    const id = randomUUID();
    const message: BridgeRequestMessage = {
      type: "request",
      id,
      method: "mastergo.invoke",
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `mastergo-api-bridge request timed out after ${this.config.bridgeRequestTimeoutMs}ms.`,
          ),
        );
      }, this.config.bridgeRequestTimeoutMs);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout,
      });

      bridge.socket.send(JSON.stringify(message), (error) => {
        if (!error) {
          return;
        }

        const pending = this.pendingRequests.get(id);
        if (!pending) {
          return;
        }

        clearTimeout(pending.timeout);
        this.pendingRequests.delete(id);
        pending.reject(error);
      });
    });
  }

  status(): BridgeStatus {
    const bridge = this.activeBridge;

    if (!bridge || bridge.socket.readyState !== WebSocket.OPEN) {
      return {
        connected: false,
        pendingRequests: this.pendingRequests.size,
      };
    }

    return {
      connected: true,
      connectionId: bridge.id,
      connectedAt: bridge.connectedAt,
      client: bridge.info
        ? {
            name: bridge.info.name,
            version: bridge.info.version,
            capabilities: bridge.info.capabilities,
          }
        : undefined,
      pendingRequests: this.pendingRequests.size,
    };
  }

  close(): Promise<void> {
    this.rejectPendingRequests("mastergo-api-bridge WebSocket server closed.");

    return new Promise((resolve, reject) => {
      this.activeBridge?.socket.close(1001, "Server shutdown");
      this.wss.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private handleConnection(socket: WebSocket): void {
    const connectionId = randomUUID();

    if (this.activeBridge?.socket.readyState === WebSocket.OPEN) {
      this.activeBridge.socket.close(1012, "Replaced by a newer api-bridge connection");
      this.rejectPendingRequests("mastergo-api-bridge connection was replaced.");
    }

    this.activeBridge = {
      id: connectionId,
      connectedAt: new Date().toISOString(),
      socket,
    };

    socket.on("message", (data) => this.handleMessage(connectionId, data));
    socket.on("close", () => this.handleClose(connectionId));
    socket.on("error", (error) => {
      console.error(`mastergo-api-bridge WebSocket error: ${error.message}`);
    });
  }

  private handleMessage(connectionId: string, data: RawData): void {
    if (this.activeBridge?.id !== connectionId) {
      return;
    }

    let parsed: BridgeMessage;

    try {
      parsed = bridgeMessageSchema.parse(JSON.parse(rawDataToString(data)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Invalid mastergo-api-bridge message: ${message}`);
      return;
    }

    if (isBridgeHelloMessage(parsed)) {
      this.activeBridge.info = parsed;
      return;
    }

    const pending = this.pendingRequests.get(parsed.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(parsed.id);

    pending.resolve({
      id: parsed.id,
      type: parsed.type,
      data: {
        code: parsed.data.code,
        res: parsed.data.res ?? null,
        errorMsg: parsed.data.errorMsg,
      },
    });
  }

  private handleClose(connectionId: string): void {
    if (this.activeBridge?.id !== connectionId) {
      return;
    }

    this.activeBridge = undefined;
    this.rejectPendingRequests("mastergo-api-bridge disconnected before responding.");
  }

  private rejectPendingRequests(message: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(message));
      this.pendingRequests.delete(id);
    }
  }

  private parseRequestUrl(req: IncomingMessage): URL {
    const host = req.headers.host ?? `${this.config.httpHost}:${this.config.httpPort}`;
    return new URL(req.url ?? "/", `http://${host}`);
  }

  private isAuthorized(url: URL): boolean {
    if (!this.config.bridgeToken) {
      return true;
    }

    return url.searchParams.get("token") === this.config.bridgeToken;
  }
}

function rawDataToString(data: RawData): string {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }

  return Buffer.concat(data).toString("utf8");
}

function isBridgeHelloMessage(message: BridgeMessage): message is BridgeHelloMessage {
  return "type" in message && message.type === "hello";
}
