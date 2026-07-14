import { z } from "zod";

import {
  MasterGoApiStrategy,
  type MasterGoApiMetadata,
} from "../../api-strategy.js";

const emptyParamsSchema = z.object({}).strict();
const frameworkSchema = z
  .enum(["REACT", "VUE2", "VUE3", "ANDROID", "IOS"])
  .describe("Target code generation framework.");
const layerIdSchema = z.string().min(1).describe("Layer id to generate code for.");
const jsonObjectSchema = z
  .record(z.string(), z.unknown())
  .describe("JSON object matching the MasterGo plugin typing for this value.");
const maxJsonBytesSchema = z
  .number()
  .int()
  .min(1)
  .nullish()
  .describe("Maximum JSON string length allowed for the returned payload.");

class CodegenStrategy extends MasterGoApiStrategy {
  protected readonly paramsSchema: z.ZodObject;

  constructor(metadata: MasterGoApiMetadata, paramsSchema: z.ZodObject) {
    super(metadata);
    this.paramsSchema = paramsSchema;
  }
}

export const codegenStrategies: readonly MasterGoApiStrategy[] = [
  strategy(
    {
      method: "mg.mode",
      title: "Read MasterGo mode",
      description: "Return the current MasterGo plugin mode.",
      resultDescription: "Current mode, such as inspect, design, codegen, or snippetgen.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  strategy(
    {
      method: "mg.codegen.available",
      title: "Check codegen availability",
      description:
        "Return whether mg.codegen is available in the current MasterGo sandbox.",
      resultDescription:
        "Availability, current mode, supported direct methods, and callback-event limitations.",
      readOnly: true,
    },
    emptyParamsSchema,
  ),
  strategy(
    {
      method: "mg.codegen.setComponentTemplate",
      title: "Set codegen component template",
      description:
        "Set the MasterGo DevMode component template used for component-to-code mapping.",
      resultDescription: "Template registration status.",
      readOnly: false,
    },
    z
      .object({
        template: jsonObjectSchema.describe("MGTMP.ComponentTemplate JSON object."),
      })
      .strict(),
  ),
  strategy(
    {
      method: "mg.codegen.getCode",
      title: "Get generated code",
      description: "Generate code for one layer id and target framework.",
      resultDescription: "CodeFile returned by mg.codegen.getCode, or null.",
      readOnly: true,
    },
    codegenLayerParamsSchema(),
  ),
  strategy(
    {
      method: "mg.codegen.getDSL",
      title: "Get generated DSL",
      description: "Generate DSL for one layer id and target framework.",
      resultDescription: "MGDSLData returned by mg.codegen.getDSL, or null.",
      readOnly: true,
    },
    codegenLayerParamsSchema(),
  ),
  strategy(
    {
      method: "mg.codegen.getCodeByDSL",
      title: "Get code by DSL",
      description: "Generate code for one DSL payload and target framework.",
      resultDescription: "CodeFile returned by mg.codegen.getCodeByDSL, or null.",
      readOnly: true,
    },
    z
      .object({
        data: jsonObjectSchema.describe("MGDSL.MGDSLData JSON object."),
        framework: frameworkSchema,
        maxJsonBytes: maxJsonBytesSchema,
      })
      .strict(),
  ),
  strategy(
    {
      method: "mg.codegen.onCodeChange",
      title: "Register codeChange listener",
      description:
        "Register a bridge-side mg.codegen codeChange listener and cache the latest generated code event.",
      resultDescription: "Listener registration status.",
      readOnly: false,
    },
    emptyParamsSchema,
  ),
  strategy(
    {
      method: "mg.codegen.getLatestCodeChange",
      title: "Read latest codeChange event",
      description:
        "Return the latest codeChange payload cached by mg.codegen.onCodeChange.",
      resultDescription: "Latest codeChange payload, count, and availability metadata.",
      readOnly: true,
    },
    z
      .object({
        maxJsonBytes: maxJsonBytesSchema,
      })
      .strict(),
  ),
  strategy(
    {
      method: "mg.codegen.clearLatestCodeChange",
      title: "Clear latest codeChange event",
      description: "Clear the bridge-side cached codeChange payload.",
      resultDescription: "Clear status and remaining codeChange event count.",
      readOnly: false,
    },
    emptyParamsSchema,
  ),
];

function strategy(
  metadata: MasterGoApiMetadata,
  paramsSchema: z.ZodObject,
): MasterGoApiStrategy {
  return new CodegenStrategy(metadata, paramsSchema);
}

function codegenLayerParamsSchema(): z.ZodObject {
  return z
    .object({
      layerId: layerIdSchema,
      framework: frameworkSchema,
      maxJsonBytes: maxJsonBytesSchema,
    })
    .strict();
}
