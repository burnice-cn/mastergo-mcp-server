# WebSocket Bridge 协议

`mcp-server` 同时提供两个入口：

- MCP HTTP endpoint：给 MCP 客户端调用，默认 `http://127.0.0.1:3000/mcp`。
- WebSocket bridge endpoint：给 `mastergo-api-bridge` 插件连接，默认 `ws://127.0.0.1:3000/bridge`。

整体链路：

```text
MCP client -> HTTP -> mcp-server -> WebSocket -> mastergo-api-bridge
mastergo-api-bridge -> WebSocket -> mcp-server -> HTTP -> MCP client
```

## 连接

`api-bridge` 作为 WebSocket 客户端连接：

```js
const ws = new WebSocket("ws://127.0.0.1:3000/bridge");
```

如果服务端配置了 `MASTERGO_BRIDGE_TOKEN`：

```js
const ws = new WebSocket("ws://127.0.0.1:3000/bridge?token=YOUR_TOKEN");
```

当前服务端只保留一个活动 bridge 连接。新的 `api-bridge` 连接进入后，会替换旧连接。

## hello 消息

连接成功后，`api-bridge` 可以发送一个可选的 `hello` 消息：

```json
{
  "type": "hello",
  "name": "mastergo-api-bridge",
  "version": "0.1.0",
  "capabilities": ["mastergo.invoke"]
}
```

该信息会展示在 `/health` 返回值中。

## 请求消息

MCP tool 侧使用三段式：

- `mastergo_api_list`：只返回 `method` 和 `description`。
- `mastergo_api_scheme`：返回单个 API 的 `inputScheme`。
- `mastergo_api_call`：真正通过 WebSocket 调用 `api-bridge`。

当 MCP 客户端调用 `mastergo_api_call` 工具时，`mcp-server` 会向 `api-bridge` 发送：

```json
{
  "type": "request",
  "id": "request-id",
  "method": "mastergo.invoke",
  "payload": {
    "method": "node.page",
    "params": {
      "id": "PAGE_ID_FROM_mg.document"
    }
  }
}
```

字段说明：

- `id`：请求唯一标识。`api-bridge` 回包必须带同一个 `id`。
- `method`：当前固定为 `mastergo.invoke`。
- `payload.method`：MasterGo API 方法名，例如 `mg.document`、`node.page`。
- `payload.params`：可选参数对象，由具体 API 方法决定。

当前 `mastergo-api-bridge` 已经实现了 `mg.apiVersion`、`mg.document`、`node.page`。新增 MasterGo API 时，需要在插件侧新增并注册匹配的 `ApiHandler`，同时在 `mcp-server` 的 `src/mastergo-api/strategies/<domain>/` 下新增对应策略，并从该领域的 `index.ts` 导出。如果新建了领域集合，还必须在 `src/mastergo-api/register-apis.ts` 中导入并加入注册列表。策略中的 Zod 参数 schema 负责调用前的校验和规范化，同时生成 `mastergo_api_scheme` 返回的 `inputScheme`。

## 成功响应

`api-bridge` 调用 MasterGo API 成功后，返回：

```json
{
  "id": "request-id",
  "type": "response",
  "data": {
    "code": 0,
    "res": {
      "fileId": "xxx",
      "name": "Current File"
    },
    "errorMsg": ""
  }
}
```

`data.res` 可以是对象、数组、字符串、数字、布尔值或 `null`。`mcp-server` 会把 `{ id, type, data }` 包装成 MCP tool result 返回给 MCP 客户端。

## 失败响应

`api-bridge` 调用失败时，返回：

```json
{
  "id": "request-id",
  "type": "response",
  "data": {
    "code": 1001,
    "res": null,
    "errorMsg": "MasterGo API call failed"
  }
}
```

`mcp-server` 使用 `data.code === 0` 判断成功。`data.code !== 0` 时会把结果作为 `isError: true` 的 MCP tool result 返回。

## 超时

`MASTERGO_BRIDGE_REQUEST_TIMEOUT_MS` 控制单次 WebSocket RPC 等待时间，默认 `10000` 毫秒。

超时后，MCP tool 会返回错误：

```json
{
  "id": "",
  "type": "response",
  "data": {
    "code": -1,
    "res": null,
    "errorMsg": "mastergo-api-bridge request timed out after 10000ms."
  }
}
```

## 调试

查看服务状态：

```bash
curl http://127.0.0.1:3000/health
```
