# Zod 使用文档

本文档说明如何在当前 `mcp-server` 项目中使用 Zod。

当前项目依赖版本：

```json
"zod": "^4.4.3"
```

## 安装

项目已经安装了 Zod。新环境安装依赖即可：

```bash
yarn install
```

如果未来需要手动添加：

```bash
yarn add zod
```

## 基本导入

```ts
import { z } from "zod";
```

项目中已经在 [src/index.ts](/home/ostangxinzhu/MyProjects/mastergo-mcp-server-new/mcp-server/src/index.ts) 使用了这个导入。

## 在 MCP Tool 中定义输入

最常见用法是在 `server.registerTool` 的 `inputSchema` 中声明参数。

```ts
server.registerTool(
  "example_tool",
  {
    title: "Example Tool",
    description: "Example tool with validated input.",
    inputSchema: {
      name: z.string().min(1),
      count: z.number().int().positive().default(1),
    },
  },
  async ({ name, count }) => {
    return {
      content: [
        {
          type: "text",
          text: `${name}: ${count}`,
        },
      ],
    };
  },
);
```

调用工具时：

- `name` 必须是非空字符串。
- `count` 必须是正整数。
- 如果未传 `count`，默认使用 `1`。

## 当前项目的实际 schema

当前项目把 MasterGo 能力拆成三个通用工具：

- `mastergo_api_list`：查询当前 MCP server 已知的 MasterGo API 方法。
- `mastergo_api_scheme`：查询单个 API 方法的输入结构。
- `mastergo_api_call`：按 `method + params` 查找对应策略，校验并规范化参数后调用插件侧 API handler。

`mastergo_api_list` 使用的 schema：

```ts
inputSchema: {
  query: z
    .string()
    .optional()
    .describe("Optional keyword filter matched against method, title, and description."),
}
```

### query

```ts
query: z.string().optional()
```

`query` 是可选字符串，用来按关键字过滤 API 目录。例如传入 `document` 可以查找和文档相关的 API。

`mastergo_api_list` 的返回项只包含 `method` 和 `description`。需要查看某个 API 的输入结构时，再调用 `mastergo_api_scheme`。

`mastergo_api_scheme` 使用的 schema：

```ts
inputSchema: {
  method: z
    .string()
    .trim()
    .min(1)
    .describe("MasterGo API method name, for example mg.document or node.page."),
}
```

它会返回单个方法的 `inputScheme`，例如 `node.page` 需要：

```json
{
  "type": "object",
  "required": ["id"],
  "additionalProperties": false,
  "properties": {
    "id": {
      "type": "string",
      "minLength": 1,
      "description": "Page node id. Get page ids from mg.document before calling this method."
    }
  }
}
```

`mastergo_api_call` 使用的 schema：

```ts
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
}
```

### method

```ts
method: z.string().trim().min(1)
```

`method` 是插件侧注册的 API 方法名，例如 `mg.document`、`node.page`。`trim()` 会清理首尾空格，`min(1)` 保证不能传空字符串。

### params

```ts
params: z.record(z.string(), z.unknown()).optional()
```

`params` 在 MCP 边界是通用的可选对象。MCP SDK 校验外层结构后，服务端会按 `method` 查找对应的 `MasterGoApiStrategy`，再用该策略的 Zod schema 精确校验并规范化方法参数。校验失败时不会发送 bridge 请求；校验成功后才会通过 WebSocket 转发。`mastergo_api_scheme` 返回的 `inputScheme` 也由同一份策略 schema 生成，可用于调用前发现具体参数要求。

示例：

```json
{
  "method": "node.page",
  "params": {
    "id": "PAGE_ID_FROM_mg.document"
  }
}
```

## 手动校验数据

如果你需要校验 MasterGo API 返回值，或者校验插件桥接服务返回的数据，可以手动调用 `safeParse`。

```ts
const CurrentFileSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const result = CurrentFileSchema.safeParse(response.body);

if (!result.success) {
  throw new Error(`Invalid MasterGo response: ${result.error.message}`);
}

const currentFile = result.data;
```

推荐优先使用 `safeParse`，因为它不会直接抛异常，便于你自己组织错误信息。

## 推导 TypeScript 类型

如果 schema 会在多个地方复用，可以用 `z.infer` 自动推导类型。

```ts
const MasterGoNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});

type MasterGoNode = z.infer<typeof MasterGoNodeSchema>;
```

这样 schema 和类型来自同一份定义，减少类型和运行时校验不一致的问题。

## 建议写法

### 为每个公开工具都写 inputSchema

MCP 工具是对外接口，所有外部输入都应该有明确 schema。

推荐：

```ts
inputSchema: {
  fileId: z.string().min(1),
  nodeId: z.string().min(1).optional(),
}
```

不推荐：

```ts
inputSchema: {
  payload: z.unknown(),
}
```

`z.unknown()` 适合临时桥接或非常泛化的接口。稳定工具应该尽量收窄输入。

### 对字符串加最小约束

如果空字符串没有业务意义，写 `min(1)`：

```ts
z.string().min(1)
```

### 给模型可读字段加 describe

MCP 客户端和模型可以利用字段说明来更准确地调用工具。

```ts
z
  .string()
  .min(1)
  .describe("MasterGo file id.")
```

### 对可选值显式使用 optional

```ts
z.string().optional()
```

不要用空字符串代表未传值，除非 MasterGo API 本身明确要求。

### 对默认值使用 default

```ts
z.enum(["GET", "POST"]).default("GET")
```

这样调用方不传字段时，工具回调里也能拿到明确值。

## 后续扩展示例

如果后续要新增一个固定的 MasterGo API 方法，先在 `mastergo-api-bridge` 中新增并注册匹配的 `ApiHandler`，再在 `mcp-server/src/mastergo-api/strategies/<domain>/` 下新增独立策略，并从对应领域的 `index.ts` 导出。策略负责方法元数据、Zod 参数 schema、bridge 转发和可选的结果转换；`mastergo_api_scheme` 的 JSON Schema 直接由这份 Zod schema 生成，不需要集中式 API 目录或第二份手写输入 schema。

如果某个高频能力需要升级成专用 MCP 工具，也可以这样写：

```ts
server.registerTool(
  "mastergo_get_document",
  {
    title: "Get MasterGo Document",
    description: "Read current document summary from the MasterGo bridge.",
    inputSchema: {},
  },
  async () => {
    const result = await bridgeServer.request({
      method: "mg.document",
    });

    return jsonResult(result);
  },
);
```

如果工具需要参数：

```ts
server.registerTool(
  "mastergo_get_page",
  {
    title: "Get MasterGo Page",
    description: "Read one page from the current MasterGo document.",
    inputSchema: {
      id: z.string().min(1).describe("MasterGo page id."),
    },
  },
  async ({ id }) => {
    const result = await bridgeServer.request({
      method: "node.page",
      params: { id },
    });

    return jsonResult(result);
  },
);
```

专用工具的优点是 schema 更精确，模型更容易正确调用；通用 `mastergo_api_call` 的优点是新增 API 时不需要频繁增加 MCP tool。
