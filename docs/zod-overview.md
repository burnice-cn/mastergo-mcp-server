# Zod 说明文档

## Zod 是什么

Zod 是一个 TypeScript 优先的运行时数据校验库。它用代码声明数据结构，然后在程序运行时检查外部输入是否符合这个结构。

简单说：

- TypeScript 负责开发阶段的静态类型检查。
- Zod 负责运行阶段的真实数据校验。

这两个能力不一样。TypeScript 编译后类型会消失，无法阻止用户、网络请求、JSON 配置、MCP 客户端参数等外部数据传入错误结构。Zod 的作用就是在运行时把这些数据校验清楚。

## 它解决什么问题

在 `mcp-server` 这类服务里，输入通常来自 MCP 客户端。客户端传来的 `arguments` 本质上是 JSON 数据，服务端不能假设它一定正确。

例如 `mastergo_api_call` 工具期望收到：

```json
{
  "method": "node.page",
  "params": {
    "id": "PAGE_ID_FROM_mg.document"
  }
}
```

但客户端也可能传来：

```json
{
  "method": "",
  "params": []
}
```

这些错误如果直接进入业务代码，可能导致请求失败、异常难定位，甚至带来安全问题。Zod 可以在业务代码执行前先校验输入，并给出明确错误。

## 为什么 MCP Server 会用到 Zod

`@modelcontextprotocol/sdk` 的高级服务接口 `McpServer.registerTool` 支持通过 `inputSchema` 描述工具参数。这个 schema 可以使用 Zod 编写。

当前项目的代码片段：

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

这段代码的含义是：

- `method` 必须是非空字符串，首尾空格会被清理。
- `params` 在 MCP 边界是通用的可选对象；找到对应方法后，具体的 `MasterGoApiStrategy` 会使用该方法专属的 Zod schema 继续校验并规范化参数。

这里采用两层校验：MCP SDK 先校验外层的 `method` 和 `params` 结构，策略再校验方法专属字段。只有两层校验都通过后，请求才会通过 WebSocket 发送给 `mastergo-api-bridge`。

## Zod 和 TypeScript 的关系

Zod 不替代 TypeScript，它补足 TypeScript 运行时缺失的部分。

常见配合方式：

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().positive(),
});

type User = z.infer<typeof UserSchema>;
```

这里：

- `UserSchema` 用于运行时校验。
- `User` 是根据 schema 自动推导出的 TypeScript 类型。

这样可以避免重复维护一份校验规则和一份类型定义。

## 常用能力

### 基础类型

```ts
z.string()
z.number()
z.boolean()
z.null()
z.unknown()
```

### 对象

```ts
z.object({
  name: z.string(),
  count: z.number(),
})
```

### 枚举

```ts
z.enum(["GET", "POST", "PUT"])
```

### 联合类型

```ts
z.union([z.string(), z.number(), z.boolean()])
```

### 可选字段

```ts
z.string().optional()
```

### 默认值

```ts
z.string().default("GET")
```

### 字段说明

```ts
z.string().describe("Relative API path.")
```

`describe` 对 MCP 工具尤其有用，因为客户端可以展示这些说明，帮助模型或用户理解参数含义。

## parse 和 safeParse

Zod 有两种常见校验方式。

`parse` 校验失败会抛异常：

```ts
const value = UserSchema.parse(input);
```

`safeParse` 不抛异常，而是返回结果对象：

```ts
const result = UserSchema.safeParse(input);

if (!result.success) {
  console.error(result.error);
  return;
}

console.log(result.data);
```

在工具入参由 MCP SDK 自动处理时，一般不需要手动调用 `parse`。如果后续要校验配置文件、插件返回值或 MasterGo API 响应，可以直接在业务代码里使用 `safeParse`。

## 当前项目里的定位

在本项目中，Zod 主要用于：

- 描述 MCP 工具的外层输入参数。
- 让 MCP SDK 在调用工具前校验 `method` 和通用 `params` 结构。
- 让每个 `MasterGoApiStrategy` 校验并规范化方法专属参数。
- 从策略 schema 生成 `mastergo_api_scheme` 返回的 JSON Schema。
- 保持参数定义、默认值、说明文本和 TypeScript 类型尽量一致。

后续如果 `mastergo-api-bridge` 暴露更多 MasterGo API，应为对应策略定义明确的 Zod 参数 schema。
