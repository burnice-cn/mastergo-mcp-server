import { ApiHandler } from "../api-handler";

type EmptyParams = Record<string, never>;
type LayerCodegenParams = {
  layerId: string;
  framework: MGDSL.Framework;
  maxJsonBytes?: number | null;
};
type DslCodegenParams = {
  data: MGDSL.MGDSLData;
  framework: MGDSL.Framework;
  maxJsonBytes?: number | null;
};
type ComponentTemplateParams = {
  template: MGTMP.ComponentTemplate;
};
type MaxJsonBytesParams = {
  maxJsonBytes?: number | null;
};
type HandlerCall<TParams, TResult> = (params?: TParams) => TResult | Promise<TResult>;

class CallbackHandler<TParams = EmptyParams, TResult = unknown> extends ApiHandler<
  TParams,
  TResult
> {
  constructor(method: string, private readonly callback: HandlerCall<TParams, TResult>) {
    super(method);
  }

  async call(params?: TParams): Promise<TResult> {
    return this.callback(params);
  }
}

let codeChangeRegistered = false;
let latestCodeChange: MGDSL.CustomCode["data"] | null = null;
let codeChangeCount = 0;

export const codegenApiHandlers: readonly ApiHandler[] = [
  new CallbackHandler("mg.mode", () => mg.mode ?? null),
  new CallbackHandler("mg.codegen.available", () => ({
    available: Boolean(mg.codegen),
    mode: mg.mode ?? null,
    directMethods: [
      "setComponentTemplate",
      "getCode",
      "getDSL",
      "getCodeByDSL",
    ],
    pollableEvents: ["codeChange"],
    unsupportedCallbackEvents: ["generateDSL", "generate"],
  })),
  new CallbackHandler<ComponentTemplateParams>(
    "mg.codegen.setComponentTemplate",
    (params) => {
      const codegen = requireCodegen("mg.codegen.setComponentTemplate");
      const { template } = requireParams(params, "mg.codegen.setComponentTemplate");

      codegen.setComponentTemplate(template);
      return { set: true };
    },
  ),
  new CallbackHandler<LayerCodegenParams>("mg.codegen.getCode", async (params) => {
    const codegen = requireCodegen("mg.codegen.getCode");
    const { layerId, framework, maxJsonBytes } = requireParams(
      params,
      "mg.codegen.getCode",
    );
    const result = await codegen.getCode(layerId, framework);

    return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getCode");
  }),
  new CallbackHandler<LayerCodegenParams>("mg.codegen.getDSL", async (params) => {
    const codegen = requireCodegen("mg.codegen.getDSL");
    const { layerId, framework, maxJsonBytes } = requireParams(
      params,
      "mg.codegen.getDSL",
    );
    const result = await codegen.getDSL(layerId, framework);

    return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getDSL");
  }),
  new CallbackHandler<DslCodegenParams>("mg.codegen.getCodeByDSL", async (params) => {
    const codegen = requireCodegen("mg.codegen.getCodeByDSL");
    const { data, framework, maxJsonBytes } = requireParams(
      params,
      "mg.codegen.getCodeByDSL",
    );
    const result = await codegen.getCodeByDSL(data, framework);

    return enforceJsonSize(result, maxJsonBytes, "mg.codegen.getCodeByDSL");
  }),
  new CallbackHandler("mg.codegen.onCodeChange", () => {
    const codegen = requireCodegen("mg.codegen.onCodeChange");
    const alreadyRegistered = codeChangeRegistered;

    if (!codeChangeRegistered) {
      codegen.on("codeChange", (data) => {
        latestCodeChange = data;
        codeChangeCount += 1;
      });
      codeChangeRegistered = true;
    }

    return {
      registered: true,
      alreadyRegistered,
      count: codeChangeCount,
    };
  }),
  new CallbackHandler<MaxJsonBytesParams>("mg.codegen.getLatestCodeChange", (params) => {
    requireCodegen("mg.codegen.getLatestCodeChange");
    const result = {
      count: codeChangeCount,
      data: latestCodeChange,
    };

    return enforceJsonSize(
      result,
      params?.maxJsonBytes ?? null,
      "mg.codegen.getLatestCodeChange",
    );
  }),
  new CallbackHandler("mg.codegen.clearLatestCodeChange", () => {
    requireCodegen("mg.codegen.clearLatestCodeChange");
    latestCodeChange = null;

    return {
      cleared: true,
      count: codeChangeCount,
    };
  }),
];

function requireCodegen(method: string): CodegenAPI {
  if (!mg.codegen) {
    throw new Error(
      `${method} requires mg.codegen, which is only available in MasterGo DevMode/codegen contexts.`,
    );
  }

  return mg.codegen;
}

function requireParams<TParams>(params: TParams | undefined, method: string): TParams {
  if (!params) {
    throw new Error(`${method} requires params`);
  }

  return params;
}

function enforceJsonSize<TValue>(
  value: TValue,
  maxJsonBytes: number | null | undefined,
  method: string,
): TValue {
  if (!maxJsonBytes) {
    return value;
  }

  const json = JSON.stringify(value);
  const byteLength = utf8ByteLength(json);
  if (byteLength > maxJsonBytes) {
    throw new Error(
      `${method} result JSON is ${byteLength} bytes, exceeding maxJsonBytes ${maxJsonBytes}.`,
    );
  }

  return value;
}

function utf8ByteLength(value: string): number {
  let bytes = 0;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}
