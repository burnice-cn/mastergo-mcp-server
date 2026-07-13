# mcp-server

MasterGo MCP server. It exposes an MCP Streamable HTTP endpoint for MCP clients,
and a WebSocket endpoint for `mastergo-api-bridge`.

Request flow:

```text
MCP client -> HTTP -> mcp-server -> WebSocket -> mastergo-api-bridge
mastergo-api-bridge -> WebSocket -> mcp-server -> HTTP -> MCP client
```

## Requirements

- Node.js 20+
- Yarn via Corepack

## Install

```bash
yarn install
```

## Configure

Copy `.env.example` values into your shell:

```bash
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_PATH=/mcp
MASTERGO_BRIDGE_WS_PATH=/bridge
MASTERGO_BRIDGE_TOKEN=
MASTERGO_BRIDGE_REQUEST_TIMEOUT_MS=10000
```

Default endpoints:

- MCP client: `http://127.0.0.1:3000/mcp`
- api-bridge WebSocket: `ws://127.0.0.1:3000/bridge`

If `MASTERGO_BRIDGE_TOKEN` is set, the browser-side bridge should connect with
`ws://127.0.0.1:3000/bridge?token=...`.

## Scripts

```bash
yarn dev
yarn test
yarn typecheck
yarn build
yarn start
```

## Tools

- `mastergo_config`: returns the active bridge configuration.
- `mastergo_api_list`: lists MasterGo API methods with method and description.
- `mastergo_api_scheme`: returns the input scheme for one API method.
- `mastergo_api_call`: calls a MasterGo API method through the connected
  `mastergo-api-bridge` WebSocket client.

Example `mastergo_api_list` input:

```json
{
  "query": "document"
}
```

Example `mastergo_api_scheme` input:

```json
{
  "method": "node.page"
}
```

Example `mastergo_api_call` input:

```json
{
  "method": "node.page",
  "params": {
    "id": "PAGE_ID_FROM_mg.document"
  }
}
```

## Adding a MasterGo API

Each MasterGo method is implemented as an independent strategy under
`src/mastergo-api/strategies/<domain>/`. A strategy owns the method metadata,
Zod params schema, bridge forwarding, and any optional result transformation.

To add a method:

1. Add and register the matching `ApiHandler` in `mastergo-api-bridge`.
2. Add the strategy file in the appropriate domain directory.
3. Export the strategy from that domain's `index.ts`.
4. Run:

   ```bash
   yarn test
   yarn typecheck
   yarn build
   ```

`mastergo_api_scheme` is generated from the strategy's Zod schema. Do not
maintain a second handwritten JSON input schema.

## Health Check

```bash
curl http://127.0.0.1:3000/health
```

## Bridge Protocol

See `docs/websocket-bridge.md`.
