/**
 * Obsidian 私有（未在官方 public typings 中暴露）但运行时稳定存在的成员。
 *
 * 这些声明只补「类型」，不改任何运行行为，用于让 @typescript-eslint
 * 的 type-checked 规则（no-unsafe-call / no-unsafe-member-access / ...）
 * 不再把这些调用判为 any。仅在本项目内、且确认 Obsidian 运行时会提供对应
 * 字段/方法时才可引用，切勿臆造。
 */
import "obsidian";

declare module "obsidian" {
  /** 全局配置键：基础字体、折叠标题、显示行号、可读行宽。 */
  type VaultConfigKey =
    | "theme"
    | "baseFontSize"
    | "foldHeading"
    | "showLineNumber"
    | "readableLineLength";

  interface Vault {
    /** 运行时内部完整配置对象（含 defaultViewMode / livePreview 等未公开项）。 */
    config: Record<string, unknown>;
    /** 读取某全局配置项（未公开到 public typings）。 */
    getConfig(key: VaultConfigKey): unknown;
    /** 写入某全局配置项（未公开到 public typings）。 */
    setConfig(key: VaultConfigKey, value: unknown): void;
  }

  interface App {
    /** 切换内置主题（obsidian/moonstone 等，运行时接受任意主题 id）。 */
    setTheme(theme: string): void;
    /** 触发字体重绘，通常在 baseFontSize 变化后调用。 */
    updateFontSize(): void;
  }
}
