# mastergo-api-bridge

MasterGo plugin bridge. Source files live in `src/`; build outputs a loadable
plugin bundle into `plugin/`.

## Scripts

```bash
yarn install
yarn typecheck
yarn build
```

After `yarn build`, load the `plugin/` directory in MasterGo.

## Layout

- `src/plugin/index.ts`: plugin sandbox entry, compiled to `plugin/index.js`.
- `src/shared/protocol.ts`: shared TypeScript protocol types used by the plugin sandbox code.
- `src/manifest.json`: plugin manifest source.
- `plugin/index.js`: compiled plugin sandbox script.
- `plugin/index.html`: plugin UI file, loaded independently by MasterGo; it is not imported by or compiled into `index.js`.
- `plugin/manifest.json`: copied manifest artifact.

MasterGo runtime globals such as `mg` and `__html__` are provided by
`@mastergo/plugin-typings` through `tsconfig.json`.
