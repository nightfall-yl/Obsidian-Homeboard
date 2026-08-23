/**
 * YAML 时间戳规则：自动维护 frontmatter 中的 date created / date modified。
 * 移植自 obsidian-linter 的同名规则（保留 file system / frontmatter 两种来源语义）。
 * 使用行级替换而非正则全局替换，避免与 --- 分隔线的边界问题。
 */
import type moment from "moment";
import parseFormat from "moment-parseformat";
import { formatYAML, initYAML, insertAt } from "./yaml";
import {
  type YamlTimestampSettings,
} from "./settings";

/** Obsidian 暴露在全局的 moment（`window.moment`）。 */
const windowMoment = window.moment;

/** 从文件系统 / 编辑器获取的运行期元数据。 */
export interface YamlTimestampRuntime {
  /** 是否在本次 lint 中已经产生了其它修改（用于决定 date modified 是否更新）。 */
  alreadyModified: boolean;
  /** 文件创建时间（ISO 字符串）。 */
  fileCreatedTime: string;
  /** 文件修改时间（ISO 字符串）。 */
  fileModifiedTime: string;
  /** 当前时刻，用于写 date modified。 */
  currentTime: moment.Moment;
  /** 用于格式化的 locale。 */
  locale: string;
  /** 文件路径，用于错误信息。 */
  fileName: string;
}

export function applyYamlTimestamp(
  text: string,
  settings: YamlTimestampSettings,
  runtime: YamlTimestampRuntime
): string {
  let textModified = runtime.alreadyModified;
  const newText = initYAML(text);
  textModified = textModified || newText !== text;

  return formatYAML(newText, (yamlText) => {
    if (settings.dateCreated) {
      const result = handleDateCreatedValue(yamlText, settings, runtime);
      yamlText = result.text;
      textModified = textModified || result.modified;
    }
    if (settings.dateModified) {
      yamlText = handleDateModifiedValue(yamlText, textModified, settings, runtime);
    }
    return yamlText;
  });
}

/**
 * 在 YAML 文本中安全替换指定 key 的值行。
 * 采用"找行→替换→重组"的方式，避免正则跨越 --- 边界的问题。
 */
function replaceYAMLKeyLine(
  yamlText: string,
  key: string,
  newValue: string
): { text: string; replaced: boolean } {
  const lines = yamlText.split("\n");
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // 匹配 "key: value" 或 "key: value"（key 后允许空格/tab）
    const keyPattern = new RegExp(`^${escapeRegExp(key)}\\s*:\\s*`);
    if (keyPattern.test(line)) {
      lines[i] = `${key}: ${newValue}`;
      replaced = true;
      break;
    }
  }

  return { text: lines.join("\n"), replaced };
}

/** 简单转义正则特殊字符。 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function handleDateCreatedValue(
  text: string,
  s: YamlTimestampSettings,
  runtime: YamlTimestampRuntime
): { text: string; modified: boolean } {
  let textModified = false;
  const key = s.dateCreatedKey;

  const createdDate = windowMoment(runtime.fileCreatedTime);
  createdDate.locale(runtime.locale);

  const formattedDate = s.convertToUTC
    ? createdDate.utc().format(s.format)
    : createdDate.format(s.format);

  // 查找现有行
  const match = text.match(new RegExp(`^(${escapeRegExp(key)}\\s*:\\s*)(.+)$`, "m"));

  if (!match) {
    // key 不存在，插入到 --- 分隔线之前
    const yamlEnd = text.lastIndexOf("\n---");
    if (yamlEnd >= 0) {
      text = insertAt(text, yamlEnd, `\n${key}: ${formattedDate}`);
      textModified = true;
    }
    return { text, modified: textModified };
  }

  // 解析现有值
  const existingValue = match[2]?.trim() ?? "";
  const parsed = tryParseDate(existingValue, s.format, runtime.locale, s.convertToUTC);

  if (s.dateCreatedSourceOfTruth === "frontmatter") {
    if (parsed == null) {
      console.log("[LinterLite] date created parse failed, keeping original:", existingValue);
      return { text, modified: false };
    }
    const formatted = s.convertToUTC
      ? parsed.utc().format(s.format)
      : parsed.format(s.format);
    if (formatted !== existingValue) {
      const result = replaceYAMLKeyLine(text, key, formatted);
      text = result.text;
      textModified = true;
    }
  } else {
    if (parsed == null || !parsed.isValid()) {
      const result = replaceYAMLKeyLine(text, key, formattedDate);
      text = result.text;
      textModified = true;
    } else if (parsed.format(s.format) !== existingValue) {
      const result = replaceYAMLKeyLine(text, key, formattedDate);
      text = result.text;
      textModified = true;
    }
  }

  return { text, modified: textModified };
}

function handleDateModifiedValue(
  text: string,
  textModified: boolean,
  s: YamlTimestampSettings,
  runtime: YamlTimestampRuntime
): string {
  const key = s.dateModifiedKey;

  const modifiedDate = windowMoment(runtime.fileModifiedTime);
  modifiedDate.locale(runtime.locale);
  const formattedModifiedDate = s.convertToUTC
    ? runtime.currentTime.utc().format(s.format)
    : runtime.currentTime.format(s.format);

  // 查找现有行
  const match = text.match(new RegExp(`^(${escapeRegExp(key)}\\s*:\\s*)(.+)$`, "m"));

  if (!match) {
    // key 不存在，插入到 --- 分隔线之前
    const yamlEnd = text.lastIndexOf("\n---");
    if (yamlEnd >= 0) {
      text = insertAt(text, yamlEnd, `\n${key}: ${formattedModifiedDate}`);
    }
    return text;
  }

  const existingValue = match[2]?.trim() ?? "";
  const parsed = tryParseDate(existingValue, s.format, runtime.locale, s.convertToUTC);

  let shouldUpdate = textModified;

  if (parsed == null || !parsed.isValid()) {
    // 解析失败：保留旧值，不覆盖
    console.log("[LinterLite] date modified parse failed, keeping original:", existingValue);
    return text;
  }

  if (parsed.format(s.format) !== existingValue) {
    shouldUpdate = true; // 格式不匹配
  }

  if (
    s.dateModifiedSourceOfTruth !== "user or Linter edits" &&
    getTimeDifferenceInSeconds(parsed, modifiedDate) > 5
  ) {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    const result = replaceYAMLKeyLine(text, key, formattedModifiedDate);
    text = result.text;
  }

  return text;
}

function getTimeDifferenceInSeconds(
  modifiedDateTimeMetadata: moment.Moment,
  yamlModifiedDateTime: moment.Moment
): number {
  return Math.abs(
    modifiedDateTimeMetadata.diff(yamlModifiedDateTime, "seconds")
  );
}

/**
 * 安全解析日期字符串：
 * 1. 先尝试用用户设置的 format 解析
 * 2. 若失败，用 parseFormat() 自动检测格式并重试
 * 3. 全部失败返回 null（调用方需保留旧值）
 */
function tryParseDate(
  timestamp: string,
  format: string,
  locale: string,
  utc: boolean
): moment.Moment | null {
  if (!timestamp || !timestamp.trim()) {
    return null;
  }

  // 尝试1：用用户指定的 format
  const parsedWithFormat = utc
    ? windowMoment.utc(timestamp, format, locale, true)
    : windowMoment(timestamp, format, locale, true);
  if (parsedWithFormat && parsedWithFormat.isValid()) {
    return parsedWithFormat;
  }

  // 尝试2：自动检测格式
  try {
    const detectedFormat = parseFormat(timestamp);
    if (detectedFormat) {
      const parsedAuto = utc
        ? windowMoment.utc(timestamp, detectedFormat, locale)
        : windowMoment(timestamp, detectedFormat, locale);
      if (parsedAuto && parsedAuto.isValid()) {
        return parsedAuto;
      }
    }
  } catch {
    // parseFormat 可能因异常输入而抛错，忽略即可
  }

  // 尝试3：宽松解析（让 moment 自己猜格式）
  const parsedLoose = utc
    ? windowMoment.utc(timestamp)
    : windowMoment(timestamp);
  if (parsedLoose && parsedLoose.isValid()) {
    return parsedLoose;
  }

  return null;
}