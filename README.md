# MasterGo MCP Server

这是一个把 MCP 客户端连接到 MasterGo 插件 API 的本地桥接项目。项目包含两个独立的 Yarn/TypeScript 子项目：

- `mcp-server/`：本地 MCP Streamable HTTP 服务，同时提供 WebSocket bridge 入口。
- `mastergo-api-bridge/`：MasterGo 插件，加载到 MasterGo 后连接 `mcp-server`，并在 MasterGo 沙盒内执行真实 API。

调用链路：

```text
MCP 客户端 -> http://127.0.0.1:3000/mcp -> mcp-server
       -> ws://127.0.0.1:3000/bridge -> mastergo-api-bridge -> MasterGo API
```

## 功能概览

- 通过 MCP 调用 MasterGo 的 `mg.*`、`node.*`、`mg.codegen.*` 等 API。
- 支持节点读取、创建、布局、样式、文本、组件、实例等操作。
- 支持 `icon.*` SVG 图标/插画搜索、获取和插入，默认使用 Iconify。
- 支持 API 分类查询，降低 MCP 客户端选择 API 的上下文成本。
- MasterGo 插件 bridge 支持断线自动重连。


## 参考
该MCP参考以下项目思路实现：
[`whwanyt/mastergo-mcp-plugin`](https://github.com/whwanyt/mastergo-mcp-plugin).

## 环境要求

- Node.js 20+
- Yarn 4.9.1，建议通过 Corepack 启用
- MasterGo 桌面端或可加载本地插件的 MasterGo 环境

## 安装依赖

两个子项目相互独立，需要分别安装依赖。

```bash
cd mcp-server
corepack enable
yarn install

cd ../mastergo-api-bridge
corepack enable
yarn install
```

## 启动 MCP Server

```bash
cd mcp-server
yarn dev
```

默认地址：

- MCP endpoint：`http://127.0.0.1:3000/mcp`
- WebSocket bridge：`ws://127.0.0.1:3000/bridge`
- 健康检查：`http://127.0.0.1:3000/health`

检查服务状态：

```bash
curl http://127.0.0.1:3000/health
```

如果需要启用 bridge token，在 `mcp-server/.env.example` 的基础上设置：

```bash
MASTERGO_BRIDGE_TOKEN=your-token
```

此时插件 UI 的 WebSocket 地址也需要带上 `?token=your-token`。

## 构建并加载 MasterGo 插件

```bash
cd mastergo-api-bridge
yarn build
```

构建后加载目录：

```text
mastergo-api-bridge/plugin/
```

在 MasterGo 中加载该 `plugin/` 目录。插件 UI 会连接：

```text
ws://127.0.0.1:3000/bridge
```

连接成功后，`mcp-server` 的 `/health` 会显示 bridge connected。

## MCP 客户端配置

MCP 客户端需要连接：

```text
http://127.0.0.1:3000/mcp
```

HTTP MCP 配置示例：

```json
{
  "mcpServers": {
    "mastergo": {
      "url": "http://127.0.0.1:3000/mcp",
      "type": "http"
    }
  }
}
```

启动客户端后，可通过客户端的 MCP 状态命令查看 `mastergo` 是否连接成功。

## MCP Tools

服务端只暴露少量 MCP tools，具体 MasterGo API 通过 `method` 参数调用。

- `mastergo_api_categories`：查看 API 分类和数量。
- `mastergo_api_list`：列出 API，可按 `query` 或 `category` 过滤。
- `mastergo_api_scheme`：查看某个 API 的输入 schema。
- `mastergo_api_call`：调用某个 API。

推荐调用流程：

```text
mastergo_api_categories
-> mastergo_api_list
-> mastergo_api_scheme
-> mastergo_api_call
```

示例：查看文本相关 API。

```json
{
  "category": "node.text"
}
```

示例：查看一个 API 的参数结构。

```json
{
  "method": "node.text.setRangeFontSize"
}
```

示例：调用 API。

```json
{
  "method": "node.text.setRangeFontSize",
  "params": {
    "id": "TEXT_NODE_ID",
    "start": 0,
    "end": 5,
    "fontSize": 24
  }
}
```

## 常用能力示例

### 读取文档和页面

```json
{
  "method": "mg.document"
}
```

```json
{
  "method": "node.page",
  "params": {
    "id": "PAGE_ID"
  }
}
```

### 创建文本并设置样式

```json
{
  "method": "mg.createText",
  "params": {
    "name": "Title"
  }
}
```

```json
{
  "method": "node.text.setCharacters",
  "params": {
    "id": "TEXT_NODE_ID",
    "characters": "Hello MasterGo"
  }
}
```

```json
{
  "method": "node.text.setRangeFontSize",
  "params": {
    "id": "TEXT_NODE_ID",
    "start": 0,
    "end": 14,
    "fontSize": 24
  }
}
```

```json
{
  "method": "node.text.setRangeFills",
  "params": {
    "id": "TEXT_NODE_ID",
    "start": 0,
    "end": 14,
    "fills": [
      {
        "type": "SOLID",
        "color": { "r": 0.1, "g": 0.1, "b": 0.1, "a": 1 }
      }
    ]
  }
}
```

### 搜索并插入 SVG 图标/插画

```json
{
  "method": "icon.search",
  "params": {
    "query": "empty-state",
    "collections": ["lucide"],
    "limit": 10
  }
}
```

```json
{
  "method": "icon.insert",
  "params": {
    "id": "lucide:search",
    "name": "Search Icon",
    "size": 24,
    "x": 100,
    "y": 100
  }
}
```

## 开发命令

`mcp-server/`：

```bash
yarn dev
yarn test
yarn typecheck
yarn build
yarn start
```

`mastergo-api-bridge/`：

```bash
yarn typecheck
yarn build
```

## 注意事项

- `mcp-server` 不会自动加载 `.env` 文件，需要在启动前导出环境变量。
- 修改 `mastergo-api-bridge/src/plugin/index.ts` 后需要重新执行 `yarn build`。
- `mastergo-api-bridge/plugin/index.html` 是插件 UI 文件，目前不由 esbuild 打包。
- 修改插件后，需要在 MasterGo 中重新加载插件。
- 标记为“私有化”的 MasterGo API 不应接入本项目。

## 子项目文档

- `mcp-server/README.md`
- `mcp-server/docs/websocket-bridge.md`
- `mastergo-api-bridge/README.md`
