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
