import { z } from "zod";

export const nodeTypeSchema = z.enum([
  "GROUP",
  "FRAME",
  "RECTANGLE",
  "TEXT",
  "LINE",
  "ELLIPSE",
  "POLYGON",
  "STAR",
  "PEN",
  "COMPONENT",
  "COMPONENT_SET",
  "INSTANCE",
  "BOOLEAN_OPERATION",
  "SLICE",
  "CONNECTOR",
  "SECTION",
  "INTELLIGENT_CONTAINER",
]);
export const idSchema = z.string().min(1).describe("Scene node id.");
export const pageOrNodeIdSchema = z.string().min(1).describe("Page or scene node id.");
export const jsonObjectSchema = z
  .record(z.string(), z.unknown())
  .describe("JSON object matching the MasterGo plugin typing for this value.");
export const jsonArraySchema = z
  .array(z.unknown())
  .describe("JSON array matching the MasterGo plugin typing for this value.");
export const transformSchema = z
  .tuple([
    z.tuple([z.number(), z.number(), z.number()]),
    z.tuple([z.number(), z.number(), z.number()]),
  ])
  .describe("2x3 transform matrix.");
export const rgbaSchema = z
  .object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    a: z.number().min(0).max(1),
  })
  .strict();
export const solidPaintSchema = z
  .object({
    type: z.literal("SOLID"),
    color: rgbaSchema,
    isVisible: z.boolean().nullish(),
    alpha: z.number().min(0).max(1).nullish(),
    blendMode: z.string().nullish(),
    name: z.string().nullish(),
    colorStyleId: z.string().nullish(),
  })
  .strict();
const colorStopSchema = z
  .object({
    position: z.number().min(0).max(1),
    color: rgbaSchema,
  })
  .strict();
const pointSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .strict();
const paintCommonSchema = {
  isVisible: z.boolean().nullish(),
  alpha: z.number().min(0).max(1).nullish(),
  blendMode: z.string().nullish(),
  name: z.string().nullish(),
  colorStyleId: z.string().nullish(),
};
export const gradientPaintSchema = z
  .object({
    type: z.enum([
      "GRADIENT_LINEAR",
      "GRADIENT_RADIAL",
      "GRADIENT_ANGULAR",
      "GRADIENT_DIAMOND",
    ]),
    transform: transformSchema,
    gradientStops: z.array(colorStopSchema).min(1),
    gradientHandlePositions: z.tuple([pointSchema, pointSchema]).nullish(),
    ...paintCommonSchema,
  })
  .strict();
export const imagePaintSchema = z
  .object({
    type: z.literal("IMAGE"),
    imageRef: z.string().min(1),
    scaleMode: z.enum(["FILL", "TILE", "STRETCH", "FIT", "CROP"]).nullish(),
    filters: jsonObjectSchema.nullish(),
    ratio: z.number().nullish(),
    rotation: z.number().nullish(),
    ...paintCommonSchema,
  })
  .strict();
export const paintSchema = z.union([
  solidPaintSchema,
  gradientPaintSchema,
  imagePaintSchema,
]);
export const paintsSchema = z
  .array(paintSchema)
  .describe(
    "Paint array supporting solid, gradient, and image paints.",
  );
export const autoLayoutSchema = z
  .object({
    flexMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).nullish(),
    flexWrap: z.enum(["WRAP", "NO_WRAP"]).nullish(),
    itemSpacing: z.number().nullish(),
    mainAxisAlignItems: z
      .enum(["FLEX_START", "FLEX_END", "CENTER", "SPACING_BETWEEN"])
      .nullish(),
    crossAxisAlignItems: z.enum(["FLEX_START", "FLEX_END", "CENTER"]).nullish(),
    mainAxisSizingMode: z.enum(["FIXED", "AUTO"]).nullish(),
    crossAxisSizingMode: z.enum(["FIXED", "AUTO"]).nullish(),
    crossAxisAlignContent: z.enum(["AUTO", "SPACE_BETWEEN"]).nullish(),
    crossAxisSpacing: z.number().nullable().optional(),
    strokesIncludedInLayout: z.boolean().nullish(),
    itemReverseZIndex: z.boolean().nullish(),
    paddingTop: z.number().nullish(),
    paddingRight: z.number().nullish(),
    paddingBottom: z.number().nullish(),
    paddingLeft: z.number().nullish(),
  })
  .strict()
  .describe("Auto-layout properties to set on a frame or container node.");
export const exportSettingsSchema = z
  .object({
    format: z.enum(["JPG", "PNG", "WEBP", "SVG", "PDF"]),
    isSuffix: z.union([z.boolean(), z.string()]).nullish(),
    fileName: z.string().nullish(),
    constraint: jsonObjectSchema.nullish(),
    useAbsoluteBounds: z.boolean().nullish(),
    useRenderBounds: z.boolean().nullish(),
  })
  .strict();
export const exportSettingsArraySchema = z
  .array(exportSettingsSchema)
  .describe("Export settings array.");
export const numberSchema = z.number();
export const nonNegativeNumberSchema = z.number().min(0);
export const integerIndexSchema = z.number().int().min(0);
export const booleanSchema = z.boolean();
export const stringSchema = z.string();
export const nonEmptyStringSchema = z.string().min(1);
export const idParamsSchema = z.object({ id: idSchema }).strict();
export const pageOrNodeIdParamsSchema = z.object({ id: pageOrNodeIdSchema }).strict();
export const paginatedPageOrNodeIdParamsSchema = z
  .object({
    id: pageOrNodeIdSchema,
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .nullish()
      .describe("Maximum number of nodes to return. Defaults to 200."),
    offset: z
      .number()
      .int()
      .min(0)
      .nullish()
      .describe("Number of matching nodes to skip. Defaults to 0."),
  })
  .strict();
export const maxBytesSchema = z
  .number()
  .int()
  .min(1)
  .nullish()
  .describe("Maximum byte length allowed for binary export results.");
export const rangeFields = {
  start: integerIndexSchema.describe("Inclusive range start."),
  end: integerIndexSchema.describe("Exclusive range end."),
};
export const fontNameSchema = z
  .object({
    family: nonEmptyStringSchema,
    style: nonEmptyStringSchema,
  })
  .strict()
  .describe("Font family and style.");

export function schema(shape: z.ZodRawShape): z.ZodObject {
  return z
    .object({
      id: idSchema,
      ...shape,
    })
    .strict();
}
