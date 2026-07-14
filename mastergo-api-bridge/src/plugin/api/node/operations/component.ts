import {
  command,
  compact,
  getComponentNode,
  getComponentPropertiesNode,
  getComponentSetNode,
  getInstanceNode,
  optionalRecord,
  optionalString,
  requireBoolean,
  requireId,
  requireRecord,
  requireString,
  requireStringArray,
  requireStringOrBoolean,
  setProperty,
  type OperationCommand,
} from "./toolkit";

export const componentOperationCommands: readonly OperationCommand[] = [
  command("node.component.addProperty", (params) => {
    const node = getComponentPropertiesNode(
      requireId(params, "node.component.addProperty"),
      "node.component.addProperty",
    );
    const propertyId = node.addComponentProperty(
      requireString(params, "propertyName", "node.component.addProperty"),
      requireString(params, "type", "node.component.addProperty") as Exclude<
        ComponentPropertyType,
        "VARIANT"
      >,
      requireStringOrBoolean(params, "defaultValue", "node.component.addProperty"),
      optionalRecord(params, "options") as ComponentPropertyOptions | undefined,
    );
    return { propertyId };
  }),
  command("node.component.editProperty", (params) => {
    const node = getComponentPropertiesNode(
      requireId(params, "node.component.editProperty"),
      "node.component.editProperty",
    );
    const propertyId = node.editComponentProperty(
      requireString(params, "propertyId", "node.component.editProperty"),
      requireRecord(params, "newValue", "node.component.editProperty") as Parameters<
        ComponentNode["editComponentProperty"]
      >[1],
    );
    return { propertyId };
  }),
  command("node.component.deleteProperty", (params) => {
    const node = getComponentPropertiesNode(
      requireId(params, "node.component.deleteProperty"),
      "node.component.deleteProperty",
    );
    node.deleteComponentProperty(
      requireString(params, "propertyId", "node.component.deleteProperty"),
    );
    return compact(node);
  }),
  command("node.component.setVariantPropertyValues", (params) => {
    const node = getComponentNode(
      requireId(params, "node.component.setVariantPropertyValues"),
      "node.component.setVariantPropertyValues",
    );
    node.setVariantPropertyValues(
      requireRecord(params, "properties", "node.component.setVariantPropertyValues") as Record<
        string,
        string
      >,
    );
    return compact(node);
  }),
  command("node.component.createInstance", (params) =>
    compact(
      getComponentNode(
        requireId(params, "node.component.createInstance"),
        "node.component.createInstance",
      ).createInstance(),
    ),
  ),
  command("node.componentSet.createVariantComponent", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.createVariantComponent"),
      "node.componentSet.createVariantComponent",
    );
    node.createVariantComponent();
    return compact(node);
  }),
  command("node.componentSet.createVariantProperties", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.createVariantProperties"),
      "node.componentSet.createVariantProperties",
    );
    node.createVariantProperties(
      requireStringArray(params, "properties", "node.componentSet.createVariantProperties"),
    );
    return compact(node);
  }),
  command("node.componentSet.editVariantProperties", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.editVariantProperties"),
      "node.componentSet.editVariantProperties",
    );
    node.editVariantProperties(
      requireRecord(params, "properties", "node.componentSet.editVariantProperties") as Record<
        string,
        string
      >,
    );
    return compact(node);
  }),
  command("node.componentSet.editVariantPropertyValues", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.editVariantPropertyValues"),
      "node.componentSet.editVariantPropertyValues",
    );
    node.editVariantPropertyValues(
      requireRecord(
        params,
        "properties",
        "node.componentSet.editVariantPropertyValues",
      ) as Record<string, { oldValue: string; newValue: string }>,
    );
    return compact(node);
  }),
  command("node.componentSet.editVariantPropertiesAlias", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.editVariantPropertiesAlias"),
      "node.componentSet.editVariantPropertiesAlias",
    );
    node.editVariantPropertiesAlias(
      requireRecord(
        params,
        "properties",
        "node.componentSet.editVariantPropertiesAlias",
      ) as Record<string, string>,
    );
    return compact(node);
  }),
  command("node.componentSet.editVariantPropertyValuesAlias", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.editVariantPropertyValuesAlias"),
      "node.componentSet.editVariantPropertyValuesAlias",
    );
    node.editVariantPropertyValuesAlias(
      requireRecord(
        params,
        "properties",
        "node.componentSet.editVariantPropertyValuesAlias",
      ) as Record<string, { name: string; alias: string }>,
    );
    return compact(node);
  }),
  command("node.componentSet.deleteVariantProperty", (params) => {
    const node = getComponentSetNode(
      requireId(params, "node.componentSet.deleteVariantProperty"),
      "node.componentSet.deleteVariantProperty",
    );
    node.deleteVariantProperty(
      requireString(params, "property", "node.componentSet.deleteVariantProperty"),
    );
    return compact(node);
  }),
  command("node.instance.setVariantPropertyValues", (params) => {
    const node = getInstanceNode(
      requireId(params, "node.instance.setVariantPropertyValues"),
      "node.instance.setVariantPropertyValues",
    );
    node.setVariantPropertyValues(
      requireRecord(params, "properties", "node.instance.setVariantPropertyValues") as Record<
        string,
        string
      >,
    );
    return compact(node);
  }),
  command("node.instance.setProperties", (params) => {
    const node = getInstanceNode(
      requireId(params, "node.instance.setProperties"),
      "node.instance.setProperties",
    );
    node.setProperties(
      requireRecord(params, "properties", "node.instance.setProperties") as Record<
        string,
        string | boolean
      >,
    );
    return compact(node);
  }),
  command("node.instance.setExposedInstance", (params) =>
    setProperty(
      params,
      "isExposedInstance",
      requireBoolean(params, "isExposedInstance", "node.instance.setExposedInstance"),
      "node.instance.setExposedInstance",
    ),
  ),
  command("node.instance.resetOverrides", (params) => {
    const node = getInstanceNode(
      requireId(params, "node.instance.resetOverrides"),
      "node.instance.resetOverrides",
    );
    node.resetOverrides();
    return compact(node);
  }),
  command("node.instance.swapComponent", (params) => {
    const node = getInstanceNode(
      requireId(params, "node.instance.swapComponent"),
      "node.instance.swapComponent",
    );
    const component = getComponentNode(
      requireString(params, "componentId", "node.instance.swapComponent"),
      "node.instance.swapComponent",
    );
    node.swapComponent(component);
    return compact(node);
  }),
  command("node.instance.detach", (params) =>
    compact(
      getInstanceNode(
        requireId(params, "node.instance.detach"),
        "node.instance.detach",
      ).detachInstance(),
    ),
  ),
  command("node.instance.setMainComponent", (params) => {
    const node = getInstanceNode(
      requireId(params, "node.instance.setMainComponent"),
      "node.instance.setMainComponent",
    );
    const componentId = optionalString(params, "componentId");
    node.mainComponent = componentId
      ? getComponentNode(componentId, "node.instance.setMainComponent")
      : null;
    return compact(node);
  }),
];
