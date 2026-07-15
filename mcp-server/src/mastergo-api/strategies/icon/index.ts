import { z } from "zod";

import type {
  BridgeResponseMessage,
  InvokeMethodRequest,
} from "../../../mastergo-protocol.js";
import {
  MasterGoApiStrategy,
  type MasterGoApiMetadata,
  type MasterGoApiTransport,
} from "../../api-strategy.js";
import {
  clearIconCache,
  getIconSvg,
  listIconSources,
  sanitizeSvg,
  searchIcons,
} from "./iconify.js";

const sourceSchema = z
  .enum(["iconify"])
  .nullish()
  .describe("Icon source id. Defaults to iconify.");
const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(50)
  .nullish()
  .describe("Maximum number of results. Defaults to 20.");
const offsetSchema = z
  .number()
  .int()
  .min(0)
  .nullish()
  .describe("Result offset for pagination. Defaults to 0.");
const colorSchema = z
  .string()
  .min(1)
  .nullish()
  .describe("Optional SVG color. Supports CSS color strings accepted by Iconify.");
const sizeSchema = z
  .number()
  .min(1)
  .max(512)
  .nullish()
  .describe("Optional icon size in pixels.");
const insertPositionSchema = {
  x: z.number().nullish().describe("Optional x coordinate for the inserted icon."),
  y: z.number().nullish().describe("Optional y coordinate for the inserted icon."),
};

type IconInsertParams = {
  id?: string | null;
  svg?: string | null;
  source?: "iconify" | null;
  name?: string | null;
  color?: string | null;
  size?: number | null;
  x?: number | null;
  y?: number | null;
};

type LocalResolver = (params: Record<string, unknown>) => Promise<unknown> | unknown;

class IconLocalStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema: z.ZodObject;

  constructor(
    metadata: MasterGoApiMetadata,
    paramsSchema: z.ZodObject,
    private readonly resolveLocal: LocalResolver,
  ) {
    super(metadata);
    this.paramsSchema = paramsSchema;
  }

  override async invoke(
    _transport: MasterGoApiTransport,
    params?: Record<string, unknown>,
  ): Promise<BridgeResponseMessage> {
    const parsedParams = parseParams(this.method, this.paramsSchema, params);
    return localResponse(this.method, await this.resolveLocal(parsedParams));
  }
}

class IconInsertStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema = z
    .object({
      id: z
        .string()
        .min(1)
        .nullish()
        .describe("Icon id in collection:name format, for example lucide:search."),
      svg: z
        .string()
        .min(1)
        .nullish()
        .describe("Raw SVG to sanitize and insert instead of fetching by id."),
      source: sourceSchema,
      name: z
        .string()
        .min(1)
        .nullish()
        .describe("Optional layer name for the inserted icon."),
      color: colorSchema,
      size: sizeSchema,
      ...insertPositionSchema,
    })
    .strict();

  constructor() {
    super({
      method: "icon.insert",
      title: "Insert SVG icon or illustration",
      description:
        "Fetch or sanitize an SVG icon/illustration and insert it as an editable vector node in the current MasterGo document.",
      resultDescription: "Compact node summary for the inserted editable SVG vector frame.",
      readOnly: false,
    });
  }

  override async invoke(
    transport: MasterGoApiTransport,
    params?: Record<string, unknown>,
  ): Promise<BridgeResponseMessage> {
    const parsedParams = parseParams(
      this.method,
      this.paramsSchema,
      params,
    ) as IconInsertParams;
    const svg = await resolveInsertSvg(parsedParams);
    const response = await transport.request({
      method: this.method,
      params: {
        svg,
        name: parsedParams.name ?? parsedParams.id ?? "Icon",
        size: parsedParams.size ?? undefined,
        x: parsedParams.x ?? undefined,
        y: parsedParams.y ?? undefined,
      },
    });

    return response;
  }
}

export const iconApiStrategies: readonly MasterGoApiStrategy[] = [
  local(
    {
      method: "icon.sources",
      title: "List SVG asset sources",
      description: "List configured SVG icon and illustration search sources.",
      resultDescription: "Available icon sources and their capabilities.",
      readOnly: true,
    },
    z.object({}).strict(),
    () => ({ sources: listIconSources() }),
  ),
  local(
    {
      method: "icon.search",
      title: "Search SVG icons and illustrations",
      description:
        "Search configured SVG icon and illustration sources for editable SVG assets without inserting them.",
      resultDescription:
        "Paged SVG icon or illustration candidates with ids, source metadata, collections, and optional preview SVG.",
      readOnly: true,
    },
    z
      .object({
        query: z
          .string()
          .min(1)
          .describe(
            "SVG icon or illustration search keyword, for example search, home, trash, arrow-left, empty-state, or chart.",
          ),
        source: sourceSchema,
        collections: z
          .array(z.string().min(1))
          .nullish()
          .describe(
            "Optional Iconify collection prefixes to search, such as lucide, mdi, tabler, or material-symbols.",
          ),
        limit: limitSchema,
        offset: offsetSchema,
        includePreviewSvg: z
          .boolean()
          .nullish()
          .describe("Whether to include sanitized preview SVG for each returned icon."),
      })
      .strict(),
    (params) =>
      searchIcons({
        query: params.query as string,
        source: params.source as "iconify" | null | undefined,
        collections: params.collections as string[] | null | undefined,
        limit: params.limit as number | null | undefined,
        offset: params.offset as number | null | undefined,
        includePreviewSvg: params.includePreviewSvg as boolean | null | undefined,
      }),
  ),
  local(
    {
      method: "icon.getSvg",
      title: "Get SVG icon or illustration",
      description: "Fetch and sanitize one SVG icon/illustration by id without inserting it.",
      resultDescription: "Sanitized editable SVG string and source metadata.",
      readOnly: true,
    },
    iconSvgParamsSchema(),
    (params) =>
      getIconSvg({
        id: params.id as string,
        source: params.source as "iconify" | null | undefined,
        color: params.color as string | null | undefined,
        size: params.size as number | null | undefined,
      }),
  ),
  new IconInsertStrategy(),
  local(
    {
      method: "icon.cache.clear",
      title: "Clear icon cache",
      description: "Clear in-memory SVG icon search and SVG fetch caches.",
      resultDescription: "Number of cleared cache entries.",
      readOnly: false,
    },
    z.object({}).strict(),
    () => clearIconCache(),
  ),
];

function local(
  metadata: MasterGoApiMetadata,
  paramsSchema: z.ZodObject,
  resolveLocal: LocalResolver,
): MasterGoApiStrategy {
  return new IconLocalStrategy(metadata, paramsSchema, resolveLocal);
}

function iconSvgParamsSchema(): z.ZodObject {
  return z
    .object({
      id: z
        .string()
        .min(1)
        .describe("Icon id in collection:name format, for example lucide:search."),
      source: sourceSchema,
      color: colorSchema,
      size: sizeSchema,
    })
    .strict();
}

async function resolveInsertSvg(params: IconInsertParams): Promise<string> {
  if (params.svg) {
    return sanitizeSvg(params.svg);
  }
  if (!params.id) {
    throw new Error("icon.insert requires either params.id or params.svg.");
  }

  return (
    await getIconSvg({
      id: params.id,
      source: params.source,
      color: params.color,
      size: params.size,
    })
  ).svg;
}

function parseParams(
  method: string,
  schema: z.ZodObject,
  params?: Record<string, unknown>,
): Record<string, unknown> {
  try {
    return schema.strict().parse(params ?? {});
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

    throw new Error(`Invalid params for ${method}: ${details}`, {
      cause: error,
    });
  }
}

function localResponse(method: string, res: unknown): BridgeResponseMessage {
  return {
    id: `${method}:local`,
    type: "response",
    data: {
      code: 0,
      res,
      errorMsg: "",
    },
  };
}
