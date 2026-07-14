import { z } from "zod";

import {
  MasterGoApiStrategy,
  type MasterGoApiMetadata,
} from "../../api-strategy.js";

const emptyParamsSchema = z.object({}).strict();
const idParamsSchema = z
  .object({
    id: z.string().min(1).describe("Scene node id."),
  })
  .strict();
const positionParamsSchema = z
  .object({
    x: z.number().describe("Canvas x coordinate."),
    y: z.number().describe("Canvas y coordinate."),
  })
  .strict();
const rgbaSchema = z
  .object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    a: z.number().min(0).max(1),
  })
  .strict()
  .describe("RGBA color with channels in the 0..1 range.");
const createNodeParamsSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .nullish()
      .describe("Optional name to assign to the created node."),
  })
  .strict();
const notifyOptionsSchema = z
  .object({
    position: z
      .enum(["top", "bottom"])
      .nullish()
      .describe("Notification vertical position."),
    type: z
      .enum(["normal", "highlight", "error", "warning", "success"])
      .nullish()
      .describe("Notification visual type."),
    timeout: z
      .number()
      .min(0)
      .nullish()
      .describe("Notification timeout in milliseconds."),
    isLoading: z
      .boolean()
      .nullish()
      .describe("Whether the notification shows a loading state."),
  })
  .strict();

class ForwardMasterGoApiStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema: z.ZodObject;

  constructor(metadata: MasterGoApiMetadata, paramsSchema: z.ZodObject) {
    super(metadata);
    this.paramsSchema = paramsSchema;
  }
}

export const basicMgApiStrategies: readonly MasterGoApiStrategy[] = [
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.documentId",
      title: "Read document id",
      description: "Return the current MasterGo document id.",
      resultDescription: "Document id returned by mg.documentId.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.command",
      title: "Read launch command",
      description: "Return the command used to launch the current plugin run.",
      resultDescription: "Launch command string returned by mg.command.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.themeColor",
      title: "Read theme color",
      description: "Return the current MasterGo theme color.",
      resultDescription: "Theme color value, usually dark or light.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.currentUser",
      title: "Read current user",
      description: "Return the current MasterGo user, or null when unavailable.",
      resultDescription: "Current user id, name, and photo URL, or null.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.viewport",
      title: "Read viewport",
      description: "Return a compact summary of the current viewport.",
      resultDescription:
        "Viewport center, zoom, bounds, DOM position, ruler visibility, and layout grid visibility.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.getNodeById",
      title: "Get node by id",
      description:
        "Return a compact summary for one scene node by id, or null if it is not found.",
      resultDescription:
        "Compact node summary including id, name, type, parent id, bounds, visibility, lock state, and child count when available.",
      readOnly: true,
    },
    idParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.getNodeByPosition",
      title: "Get node by position",
      description:
        "Return a compact summary for the scene node at one canvas position, or null if none is found.",
      resultDescription: "Compact node summary for the node at the requested position.",
      readOnly: true,
    },
    positionParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.getHoverLayer",
      title: "Get hover layer",
      description:
        "Return a compact summary for the currently hovered layer, or the current page when no layer is hovered.",
      resultDescription: "Compact node or page summary returned by mg.getHoverLayer.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.hexToRGBA",
      title: "Convert hex to RGBA",
      description: "Convert a hex color string to an RGBA color object.",
      resultDescription: "RGBA color returned by mg.hexToRGBA.",
      readOnly: true,
    },
    z
      .object({
        hex: z.string().min(1).describe("Hex color string."),
      })
      .strict(),
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.RGBAToHex",
      title: "Convert RGBA to hex",
      description: "Convert an RGBA color object to a hex color string.",
      resultDescription: "Hex color string returned by mg.RGBAToHex.",
      readOnly: true,
    },
    z
      .object({
        rgba: rgbaSchema,
      })
      .strict(),
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.notify",
      title: "Show notification",
      description: "Display a MasterGo notification message in the current plugin sandbox.",
      resultDescription: "Notification status returned after the message is scheduled.",
      readOnly: false,
    },
    z
      .object({
        message: z.string().min(1).describe("Notification message."),
        options: notifyOptionsSchema.nullish().describe("Optional notification settings."),
      })
      .strict(),
  ),
  ...createNodeStrategies(),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.createNodeFromSvgAsync",
      title: "Create node from SVG",
      description: "Create a frame node from SVG markup and return its compact summary.",
      resultDescription: "Compact summary for the created frame node.",
      readOnly: false,
    },
    z
      .object({
        svg: z.string().min(1).describe("SVG markup to import."),
        name: z
          .string()
          .min(1)
          .nullish()
          .describe("Optional name to assign to the created node."),
      })
      .strict(),
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.listAvailableFontsAsync",
      title: "List available fonts",
      description: "Return fonts available to the current plugin sandbox.",
      resultDescription: "Array of available font descriptors.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  new ForwardMasterGoApiStrategy(
    {
      method: "mg.loadFontAsync",
      title: "Load font",
      description: "Load one font by family and style before text operations.",
      resultDescription: "Boolean result returned by mg.loadFontAsync.",
      readOnly: false,
    },
    z
      .object({
        family: z.string().min(1).describe("Font family."),
        style: z.string().min(1).describe("Font style."),
      })
      .strict(),
  ),
  ...createLocalStyleStrategies(),
];

function createNodeStrategies(): MasterGoApiStrategy[] {
  return [
    ["mg.createRectangle", "rectangle"],
    ["mg.createLine", "line"],
    ["mg.createEllipse", "ellipse"],
    ["mg.createPolygon", "polygon"],
    ["mg.createStar", "star"],
    ["mg.createPen", "pen"],
    ["mg.createText", "text"],
    ["mg.createFrame", "frame"],
    ["mg.createSection", "section"],
    ["mg.createComponent", "component"],
    ["mg.createPage", "page"],
    ["mg.createSlice", "slice"],
    ["mg.createConnector", "connector"],
    ["mg.createIntelligentContainer", "intelligent container"],
  ].map(
    ([method, label]) =>
      new ForwardMasterGoApiStrategy(
        {
          method,
          title: `Create ${label} node`,
          description: `Create a ${label} node and return its compact summary.`,
          resultDescription: `Compact summary for the created ${label} node.`,
          readOnly: false,
        },
        createNodeParamsSchema,
      ),
  );
}

function createLocalStyleStrategies(): MasterGoApiStrategy[] {
  return [
    ["mg.getLocalPaintStyles", "paint"],
    ["mg.getLocalEffectStyles", "effect"],
    ["mg.getLocalTextStyles", "text"],
    ["mg.getLocalGridStyles", "grid"],
    ["mg.getLocalStrokeWidthStyles", "stroke width"],
    ["mg.getLocalCornerRadiusStyles", "corner radius"],
    ["mg.getLocalPaddingStyles", "padding"],
    ["mg.getLocalSpacingStyles", "spacing"],
  ].map(
    ([method, label]) =>
      new ForwardMasterGoApiStrategy(
        {
          method,
          title: `List local ${label} styles`,
          description: `Return compact summaries for local ${label} styles in the current document.`,
          resultDescription: `Compact summaries for local ${label} styles.`,
          readOnly: true,
        },
        emptyParamsSchema,
      ),
  );
}
