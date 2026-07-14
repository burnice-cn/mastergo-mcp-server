# Repository Guidelines

## Project Structure & Module Organization

This workspace contains two independent Yarn/TypeScript projects, each with its own Git history and lockfile:

- `mcp-server/`: Node.js MCP service. Runtime code is in `src/`, protocol notes are in `docs/`, and TypeScript builds to ignored `dist/` output.
- `mastergo-api-bridge/`: MasterGo plugin that connects to the server over WebSocket. Sources are under `src/`; `scripts/build.mjs` bundles the plugin into `plugin/`.

Keep shared wire-format changes synchronized between `mcp-server/src/mastergo-protocol.ts` and `mastergo-api-bridge/src/shared/protocol.ts`.

## Build, Test, and Development Commands

Run commands from the relevant subproject directory. Both projects require Yarn 4.9.1; the server requires Node.js 20+.

```bash
corepack enable && yarn install  # Install dependencies for the current project
yarn typecheck                   # Run strict TypeScript checks
```

In `mcp-server/`:

```bash
yarn dev     # Run the server directly from src/index.ts
yarn build   # Compile TypeScript into dist/
yarn start   # Run the compiled server
curl http://127.0.0.1:3000/health
```

In `mastergo-api-bridge/`, run `yarn build`, then load the generated `plugin/` directory in MasterGo.

## Coding Style & Naming Conventions

Use TypeScript ESM, strict types, double quotes, semicolons, LF endings, and final newlines. Follow `.editorconfig`: use two-space indentation in new or modified code. Use `kebab-case.ts` filenames, `PascalCase` for classes and types, and `camelCase` for functions, variables, and exported handler instances. In `mcp-server`, retain `.js` suffixes in relative imports for NodeNext compatibility. Avoid `any`; validate external messages with Zod.

## Testing Guidelines

No automated test runner or coverage threshold is configured. At minimum, run `yarn typecheck` and `yarn build` in every changed project. For bridge or protocol changes, start the server, check `/health`, connect the MasterGo plugin, and exercise the affected MCP tool. If adding a test framework, use `*.test.ts` files and add an explicit `yarn test` script.

## Commit & Pull Request Guidelines

Existing history only contains initial commits, so no formal convention is established. Use short, imperative subjects, optionally scoped, such as `mcp-server: validate bridge token`. Keep commits limited to one subproject or one protocol change. Pull requests should identify affected project(s), summarize behavior and configuration changes, list verification commands, link related issues, and include logs or screenshots for plugin/UI behavior.

## Security & Configuration

Copy settings from `mcp-server/.env.example`; never commit `.env` files or tokens. Keep HTTP and WebSocket listeners on `127.0.0.1` unless remote access is intentional, and use `MASTERGO_BRIDGE_TOKEN` whenever the bridge is exposed beyond a trusted local environment.
