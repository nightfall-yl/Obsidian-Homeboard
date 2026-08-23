/**
 * Linter 功能的独立设置模型（持久化在插件目录下的 `linter-settings.json`，
 * 与 Dashboard 主 data.json 分离，不占用统一 settings 对象）。
 */

export type DateCreatedSourceOfTruth = "file system" | "frontmatter";
export type DateModifiedSourceOfTruth = "file system" | "user or Linter edits";

export interface YamlTimestampSettings {
  enabled: boolean;
  dateCreated: boolean;
  dateCreatedKey: string;
  dateCreatedSourceOfTruth: DateCreatedSourceOfTruth;
  dateModified: boolean;
  dateModifiedKey: string;
  dateModifiedSourceOfTruth: DateModifiedSourceOfTruth;
  format: string;
  convertToUTC: boolean;
}

export interface LinterSettings {
  /** 保存时格式化：开启后，仅在手动保存（Cmd+S）时触发 lint；关闭则编辑即触发。 */
  lintOnSave: boolean;
  /** 需要跳过的文件夹路径列表（前缀匹配，用于保存时格式化）。 */
  foldersToIgnore: string[];
  /** YAML 时间戳：自动维护 frontmatter 中的 date created / date modified。 */
  yamlTimestamp: YamlTimestampSettings;
  /** 不同内容间换行：在段落、引用、列表项之间每块内容末尾补两个空格 + 换行。 */
  twoSpaces: {
    enabled: boolean;
  };
}

export const DEFAULT_SETTINGS: LinterSettings = {
  lintOnSave: false,
  foldersToIgnore: [],
  yamlTimestamp: {
    enabled: true,
    dateCreated: true,
    dateCreatedKey: "date created",
    dateCreatedSourceOfTruth: "file system",
    dateModified: true,
    dateModifiedKey: "date modified",
    dateModifiedSourceOfTruth: "file system",
    format: "YYYY-MM-DD HH:mm:ss",
    convertToUTC: false,
  },
  twoSpaces: {
    enabled: true,
  },
};