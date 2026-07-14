import {
  asTyped,
  command,
  compactTextTarget,
  getTextTarget,
  optionalRecord,
  rangeEnd,
  rangeStart,
  requireArray,
  requireNumber,
  requireRecord,
  requireString,
  setTextProperty,
  type OperationCommand,
} from "./toolkit";

export const textOperationCommands: readonly OperationCommand[] = [
  command("node.text.setCharacters", (params) => {
    const text = getTextTarget(params, "node.text.setCharacters");
    text.characters = requireString(params, "characters", "node.text.setCharacters");
    return compactTextTarget(text);
  }),
  command("node.text.insertCharacters", (params) => {
    const text = getTextTarget(params, "node.text.insertCharacters");
    text.insertCharacters(
      requireNumber(params, "start", "node.text.insertCharacters"),
      requireString(params, "characters", "node.text.insertCharacters"),
    );
    return compactTextTarget(text);
  }),
  command("node.text.deleteCharacters", (params) => {
    const text = getTextTarget(params, "node.text.deleteCharacters");
    text.deleteCharacters(
      requireNumber(params, "start", "node.text.deleteCharacters"),
      requireNumber(params, "end", "node.text.deleteCharacters"),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setAlignHorizontal", (params) =>
    setTextProperty(
      params,
      "textAlignHorizontal",
      requireString(params, "textAlignHorizontal", "node.text.setAlignHorizontal"),
      "node.text.setAlignHorizontal",
    ),
  ),
  command("node.text.setAlignVertical", (params) =>
    setTextProperty(
      params,
      "textAlignVertical",
      requireString(params, "textAlignVertical", "node.text.setAlignVertical"),
      "node.text.setAlignVertical",
    ),
  ),
  command("node.text.setAutoResize", (params) =>
    setTextProperty(
      params,
      "textAutoResize",
      requireString(params, "textAutoResize", "node.text.setAutoResize"),
      "node.text.setAutoResize",
    ),
  ),
  command("node.text.setParagraphSpacing", (params) =>
    setTextProperty(
      params,
      "paragraphSpacing",
      requireNumber(params, "paragraphSpacing", "node.text.setParagraphSpacing"),
      "node.text.setParagraphSpacing",
    ),
  ),
  command("node.text.setRangeFontSize", (params) => {
    const text = getTextTarget(params, "node.text.setRangeFontSize");
    text.setRangeFontSize(
      rangeStart(params, "node.text.setRangeFontSize"),
      rangeEnd(params, "node.text.setRangeFontSize"),
      requireNumber(params, "fontSize", "node.text.setRangeFontSize"),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeTextDecoration", (params) => {
    const text = getTextTarget(params, "node.text.setRangeTextDecoration");
    text.setRangeTextDecoration(
      rangeStart(params, "node.text.setRangeTextDecoration"),
      rangeEnd(params, "node.text.setRangeTextDecoration"),
      requireString(
        params,
        "decoration",
        "node.text.setRangeTextDecoration",
      ) as TextDecoration,
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeFontName", (params) => {
    const text = getTextTarget(params, "node.text.setRangeFontName");
    text.setRangeFontName(
      rangeStart(params, "node.text.setRangeFontName"),
      rangeEnd(params, "node.text.setRangeFontName"),
      asTyped<FontName>(requireRecord(params, "fontName", "node.text.setRangeFontName")),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeLetterSpacing", (params) => {
    const text = getTextTarget(params, "node.text.setRangeLetterSpacing");
    text.setRangeLetterSpacing(
      rangeStart(params, "node.text.setRangeLetterSpacing"),
      rangeEnd(params, "node.text.setRangeLetterSpacing"),
      asTyped<LetterSpacing>(
        requireRecord(params, "letterSpacing", "node.text.setRangeLetterSpacing"),
      ),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeLineHeight", (params) => {
    const text = getTextTarget(params, "node.text.setRangeLineHeight");
    text.setRangeLineHeight(
      rangeStart(params, "node.text.setRangeLineHeight"),
      rangeEnd(params, "node.text.setRangeLineHeight"),
      asTyped<LineHeight>(requireRecord(params, "lineHeight", "node.text.setRangeLineHeight")),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeFills", (params) => {
    const text = getTextTarget(params, "node.text.setRangeFills");
    text.setRangeFills(
      rangeStart(params, "node.text.setRangeFills"),
      rangeEnd(params, "node.text.setRangeFills"),
      requireArray(params, "fills", "node.text.setRangeFills") as Paint[],
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeHyperlink", (params) => {
    const text = getTextTarget(params, "node.text.setRangeHyperlink");
    text.setRangeHyperlink(
      rangeStart(params, "node.text.setRangeHyperlink"),
      rangeEnd(params, "node.text.setRangeHyperlink"),
      optionalRecord(params, "hyperlink") as Hyperlink | null,
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeTextCase", (params) => {
    const text = getTextTarget(params, "node.text.setRangeTextCase");
    text.setRangeTextCase(
      rangeStart(params, "node.text.setRangeTextCase"),
      rangeEnd(params, "node.text.setRangeTextCase"),
      requireString(params, "textCase", "node.text.setRangeTextCase") as TextCase,
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeListStyle", (params) => {
    const text = getTextTarget(params, "node.text.setRangeListStyle");
    text.setRangeListStyle(
      rangeStart(params, "node.text.setRangeListStyle"),
      rangeEnd(params, "node.text.setRangeListStyle"),
      requireString(params, "listStyle", "node.text.setRangeListStyle") as
        | "ORDERED"
        | "BULLETED"
        | "NONE",
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeFillStyleId", (params) => {
    const text = getTextTarget(params, "node.text.setRangeFillStyleId");
    text.setRangeFillStyleId(
      rangeStart(params, "node.text.setRangeFillStyleId"),
      rangeEnd(params, "node.text.setRangeFillStyleId"),
      requireString(params, "fillStyleId", "node.text.setRangeFillStyleId"),
    );
    return compactTextTarget(text);
  }),
  command("node.text.setRangeTextStyleId", (params) => {
    const text = getTextTarget(params, "node.text.setRangeTextStyleId");
    text.setRangeTextStyleId(
      rangeStart(params, "node.text.setRangeTextStyleId"),
      rangeEnd(params, "node.text.setRangeTextStyleId"),
      requireString(params, "textStyleId", "node.text.setRangeTextStyleId"),
    );
    return compactTextTarget(text);
  }),
];
