// ================= Flomo 核心类型定义 =================
// 1:1 fork 自 obsidian-memoria-main/src/types.ts 的核心子集（主视图所需）。

/** 单条 flomo 记录 */
export interface Flomo {
  /** 所在文件路径，如 "00 inbox/2026.md" */
  file: string;
  /** 日期 yyyy-MM-dd */
  date: string;
  /** 时间 HH:mm */
  time: string;
  /** 完整 Date 对象（本地时间） */
  datetime: Date;
  /** 正文（不含时间前缀） */
  content: string;
  /** 从正文中解析出来的标签 */
  tags: string[];
  /** 是否包含图片 */
  hasImage: boolean;
  /** 是否包含链接 */
  hasLink: boolean;
  /** 是否置顶（含 #置顶 标签） */
  isPinned: boolean;
  /** 是否收藏（含 #收藏 标签） */
  isStarred: boolean;
  /** 在源文件中的行号范围 [startLine, endLine] 0-based */
  range: [number, number];
}

/** 面板所需的最小设置（读取 / 写入的单个笔记文件，与快速捕获共用同一文件） */
export interface FlomoBoardConfig {
  /** 单个 flomo 笔记文件路径（相对 vault 根） */
  filePath: string;
}

/** 保留标签：不出现在卡片底部标签胶囊里 */
export const PIN_TAG = "置顶";
export const STAR_TAG = "收藏";
export const RESERVED_TAGS = new Set([PIN_TAG, STAR_TAG]);