import { z } from "zod";

import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../mastergo-protocol.js";

export type JsonSchemaObject = {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type MasterGoApiMetadata = {
  method: string;
  title: string;
  description: string;
  resultDescription: string;
  readOnly: boolean;
};

export type MasterGoApiListItem = Pick<MasterGoApiMetadata, "method" | "description">;

export type MasterGoApiScheme = MasterGoApiMetadata & {
  inputScheme: JsonSchemaObject;
};

export interface MasterGoApiTransport {
  request(payload: InvokeMethodRequest): Promise<BridgeResponseMessage>;
}

export abstract class MasterGoApiStrategy {
  protected abstract readonly paramsSchema: z.ZodObject;

  constructor(private readonly metadata: MasterGoApiMetadata) {}

  get method(): string {
    return this.metadata.method;
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
      description: this.description,
    };
  }

  toScheme(): MasterGoApiScheme {
    return {
      ...this.metadata,
      inputScheme: toJsonSchemaObject(this.paramsSchema),
    };
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

  private parseParams(params?: Record<string, unknown>): Record<string, unknown> {
    try {
      return this.paramsSchema.parse(params ?? {});
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

function toJsonSchemaObject(schema: z.ZodObject): JsonSchemaObject {
  const generated = z.toJSONSchema(schema, { target: "draft-7" });
  const { $schema: _schema, ...inputScheme } = generated;

  if (inputScheme.type !== "object") {
    throw new Error("MasterGo API params schema must generate an object JSON schema.");
  }

  return inputScheme as JsonSchemaObject;
}
