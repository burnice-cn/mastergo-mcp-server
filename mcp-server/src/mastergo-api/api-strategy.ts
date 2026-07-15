import { z } from "zod";

import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../mastergo-protocol.js";

export type JsonSchemaObject = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean | Record<string, unknown>;
};

export type MasterGoApiMetadata = {
  readonly method: string;
  readonly category?: string;
  readonly title: string;
  readonly description: string;
  readonly resultDescription: string;
  readonly readOnly: boolean;
};

export type MasterGoApiListItem = Pick<
  Required<MasterGoApiMetadata>,
  "method" | "category" | "description"
>;

export type MasterGoApiScheme = Required<MasterGoApiMetadata> & {
  inputScheme: JsonSchemaObject;
};

export interface MasterGoApiTransport {
  request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage>;
}

export abstract class MasterGoApiStrategy {
  protected abstract readonly paramsSchema: z.ZodObject;
  private readonly metadata: MasterGoApiMetadata;

  constructor(metadata: MasterGoApiMetadata) {
    this.metadata = Object.freeze({ ...metadata });
  }

  get method(): string {
    return this.metadata.method;
  }

  get category(): string {
    return this.metadata.category ?? inferCategory(this.method);
  }

  get title(): string {
    return this.metadata.title;
  }

  get description(): string {
    return this.metadata.description;
  }

  toListItem(): MasterGoApiListItem {
    return {
      method: this.method,
      category: this.category,
      description: this.description,
    };
  }

  toScheme(): MasterGoApiScheme {
    return {
      ...this.metadata,
      category: this.category,
      inputScheme: toJsonSchemaObject(this.strictParamsSchema),
    } as MasterGoApiScheme;
  }

  async invoke(
    transport: MasterGoApiTransport,
    params?: Record<string, unknown>,
  ): Promise<BridgeResponseMessage> {
    const parsedParams = this.parseParams(params);
    const response = await transport.request({
      method: this.method,
      params: parsedParams,
    });

    if (response.data.code !== 0) {
      return response;
    }

    return {
      ...response,
      data: {
        ...response.data,
        res: this.transformResult(response.data.res),
      },
    };
  }

  protected transformResult(result: unknown): unknown {
    return result;
  }

  private get strictParamsSchema(): z.ZodObject {
    return this.paramsSchema.strict();
  }

  private parseParams(params?: Record<string, unknown>): Record<string, unknown> {
    try {
      return this.strictParamsSchema.parse(params ?? {});
    } catch (error) {
      if (!(error instanceof z.ZodError)) {
        throw error;
      }

      const details = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "params";
          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw new Error(`Invalid params for ${this.method}: ${details}`, {
        cause: error,
      });
    }
  }
}

function inferCategory(method: string): string {
  const parts = method.split(".");

  if (parts[0] === "node" && parts.length >= 3) {
    return `${parts[0]}.${parts[1]}`;
  }
  if (parts[0] === "mg" && parts[1] === "codegen") {
    return "mg.codegen";
  }

  return parts[0] || "other";
}

function toJsonSchemaObject(schema: z.ZodObject): JsonSchemaObject {
  const generated = z.toJSONSchema(schema, { target: "draft-7" });
  const { $schema: _schema, ...inputScheme } = generated;

  if (inputScheme.type !== "object") {
    throw new Error("MasterGo API params schema must generate an object JSON schema.");
  }

  return inputScheme as JsonSchemaObject;
}
