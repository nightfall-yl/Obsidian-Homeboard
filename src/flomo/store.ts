// ================= 数据存储层 =================
// 1:1 fork 自 obsidian-memoria-main/src/store.ts 的核心子集（主视图所需）。
// 负责从 vault 读取 YYYY.md 文件 -> 解析成 flomos，并支持追加/编辑/删除/置顶/收藏。

import type { App} from "obsidian";
import { TFile, normalizePath } from "obsidian";
import type { Flomo, FlomoBoardConfig} from "./types";
import { PIN_TAG, STAR_TAG } from "./types";
import {
  parseFile,
  renderMemo,
  fmtDate,
  fmtTime,
  fmtWeekday,
} from "./parser";

export class FlomoStore {
  private flomos: Flomo[] = [];
  private listeners: Array<() => void> = [];
  private loading = false;
  private reloadLocks = new Map<string, { running: boolean; pending: boolean }>();

  constructor(private app: App, private config: FlomoBoardConfig) {}

  /** 订阅数据变更 */
  onChange(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((x) => x !== cb);
    };
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  getAll(): Flomo[] {
    return this.flomos;
  }

  /** 扫描 folder 下的所有 md 文件，重建 flomo 列表 */
  async reloadAll(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      const files = this.collectFiles();
      const parsed = await Promise.all(
        files.map(async (f) => {
          const raw = await this.app.vault.read(f);
          return parseFile(f.path, raw);
        })
      );
      const result: Flomo[] = [];
      for (const arr of parsed) result.push(...arr);
      this.sortFlomos(result);
      this.flomos = result;
      this.emit();
    } finally {
      this.loading = false;
    }
  }

  /** 文件内容变化时重载单个文件（running/pending flag 合并多次调用） */
  async reloadFile(file: TFile): Promise<void> {
    if (!this.isInFolder(file)) return;
    const key = file.path;
    const existing = this.reloadLocks.get(key);
    if (existing && existing.running) {
      existing.pending = true;
      return;
    }
    const state = { running: true, pending: false };
    this.reloadLocks.set(key, state);
    try {
      do {
        state.pending = false;
        const current = this.app.vault.getAbstractFileByPath(key);
        if (!(current instanceof TFile)) break;
        const raw = await this.app.vault.read(current);
        const fresh = parseFile(current.path, raw);
        this.flomos = this.flomos.filter((m) => m.file !== current.path);
        this.flomos.push(...fresh);
        this.sortFlomos(this.flomos);
        this.emit();
      } while (state.pending);
    } finally {
      this.reloadLocks.delete(key);
    }
  }

  /** 指定文件从 flomo 列表中移除 */
  removeFile(path: string): void {
    const before = this.flomos.length;
    this.flomos = this.flomos.filter((m) => m.file !== path);
    if (this.flomos.length !== before) this.emit();
  }

  /**
   * 排序：
   *   1) 置顶的永远在最前
   *   2) 其他按 datetime 降序（最新在前）
   *   3) 同分钟按文件行号倒序（更晚追加的在前）
   */
  private sortFlomos(arr: Flomo[]): void {
    arr.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const dt = b.datetime.getTime() - a.datetime.getTime();
      if (dt !== 0) return dt;
      if (a.file !== b.file) return a.file < b.file ? 1 : -1;
      return b.range[0] - a.range[0];
    });
  }

  private collectFiles(): TFile[] {
    const target = normalizePath(this.config.filePath);
    const f = this.app.vault.getAbstractFileByPath(target);
    return f instanceof TFile ? [f] : [];
  }

  isInFolder(file: TFile): boolean {
    return file.path === normalizePath(this.config.filePath);
  }

  /** 创建一条新 flomo（追加写入单文件） */
  async addMemo(content: string, when: Date = new Date()): Promise<void> {
    content = content.trim();
    if (!content) return;
    const filePath = await appendFlomoToFile(
      this.app,
      this.config.filePath,
      content,
      when
    );
    const f = this.app.vault.getAbstractFileByPath(filePath);
    if (f instanceof TFile) await this.reloadFile(f);
  }

  /** 编辑一条 flomo（写入前用最新内容重定位真实行号，避免用过期 range 盲写） */
  async editFlomo(flomo: Flomo, newContent: string): Promise<void> {
    newContent = newContent.trim();
    if (!newContent) return;
    const file = this.app.vault.getAbstractFileByPath(flomo.file) as TFile | null;
    if (!file) return;
    const raw = await this.app.vault.read(file);
    const lines = raw.split(/\r?\n/);

    const [s0, e0] = flomo.range;
    const memoHeadRe = new RegExp(`^-\\s+${flomo.time}(?:\\s|$)`);
    let s = s0;
    let e = e0;
    const headOk = s0 >= 0 && s0 < lines.length && memoHeadRe.test(lines[s0]!);

    if (!headOk) {
      const fresh = parseFile(file.path, raw);
      const candidates = fresh.filter(
        (m) =>
          m.date === flomo.date &&
          m.time === flomo.time &&
          m.content === flomo.content
      );
      if (candidates.length === 0) {
        throw new Error("文件已变化，请刷新后重试");
      }
      candidates.sort((a, b) => {
        const da = Math.abs(a.range[0] - s0);
        const db = Math.abs(b.range[0] - s0);
        if (da !== db) return da - db;
        return a.range[0] - b.range[0];
      });
      [s, e] = candidates[0]!.range;
    }

    const rendered = renderMemo(flomo.time, newContent).split("\n");
    lines.splice(s, e - s + 1, ...rendered);
    await this.app.vault.modify(file, lines.join("\n"));
    await this.reloadFile(file);
  }

  /** 编辑 flomo 的日期/时间 + 内容（若日期改变，移动到新日期分组下） */
  async editFlomoDateTime(
    flomo: Flomo,
    newDateTime: Date,
    newContent: string
  ): Promise<void> {
    newContent = newContent.trim();
    if (!newContent) return;
    const newDateStr = fmtDate(newDateTime);
    const newTimeStr = fmtTime(newDateTime);
    const weekday = fmtWeekday(newDateTime);
    const dateChanged = newDateStr !== flomo.date;

    const file = this.app.vault.getAbstractFileByPath(flomo.file) as TFile | null;
    if (!file) return;
    const raw = await this.app.vault.read(file);
    const lines = raw.split(/\r?\n/);

    // 重新定位 flomo 真实行号
    const [s0, e0] = flomo.range;
    const memoHeadRe = new RegExp(`^-\\s+${flomo.time}(?:\\s|$)`);
    let s = s0;
    let e = e0;
    const headOk = s0 >= 0 && s0 < lines.length && memoHeadRe.test(lines[s0]!);
    if (!headOk) {
      const fresh = parseFile(file.path, raw);
      const candidates = fresh.filter(
        (m) =>
          m.date === flomo.date &&
          m.time === flomo.time &&
          m.content === flomo.content
      );
      if (candidates.length === 0) {
        throw new Error("文件已变化，请刷新后重试");
      }
      candidates.sort((a, b) => {
        const da = Math.abs(a.range[0] - s0);
        const db = Math.abs(b.range[0] - s0);
        if (da !== db) return da - db;
        return a.range[0] - b.range[0];
      });
      [s, e] = candidates[0]!.range;
    }

    const rendered = renderMemo(newTimeStr, newContent).split("\n");

    if (!dateChanged) {
      // 同一天：直接替换原块
      lines.splice(s, e - s + 1, ...rendered);
      await this.app.vault.modify(file, lines.join("\n"));
      await this.reloadFile(file);
      return;
    }

    // 日期变了：先删旧块，清理孤儿日期标题，再追加到文件末尾（按日期分组）
    lines.splice(s, e - s + 1);
    this.removeOrphanDateHeaders(lines);

    const newHeading = `## ${newDateStr} ${weekday}`;
    const trimmed = lines.join("\n").replace(/\n+$/, "");

    // 提取最后一个日期标题，判断是否同一天
    const lastHeading = this.extractLastDateHeadingFromLines(lines);
    const renderedStr = rendered.join("\n");
    let newText: string;
    if (trimmed === "") {
      newText = `${newHeading}\n${renderedStr}`;
    } else if (lastHeading === newHeading) {
      newText = `${trimmed}\n\n${renderedStr}`;
    } else {
      newText = `${trimmed}\n\n${newHeading}\n${renderedStr}`;
    }

    await this.app.vault.modify(file, newText);
    await this.reloadFile(file);
  }

  /** 从行数组中提取最后一个日期标题（## YYYY-MM-DD …） */
  private extractLastDateHeadingFromLines(lines: string[]): string {
    const re = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+.+)?$/;
    let last = "";
    for (const l of lines) {
      const m = l.match(re);
      if (m) last = l.trim();
    }
    return last;
  }

  /** 删除 flomo（同时清理"孤儿"日期标题与连续空行） */
  async deleteFlomo(flomo: Flomo): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(flomo.file) as TFile | null;
    if (!file) return;

    const raw = await this.app.vault.read(file);
    const lines = raw.split(/\r?\n/);
    const [s, e] = flomo.range;
    lines.splice(s, e - s + 1);

    this.removeOrphanDateHeaders(lines);

    const cleaned: string[] = [];
    let blank = 0;
    for (const ln of lines) {
      if (ln.trim() === "") {
        blank++;
        if (blank <= 2) cleaned.push(ln);
      } else {
        blank = 0;
        cleaned.push(ln);
      }
    }
    await this.app.vault.modify(file, cleaned.join("\n"));
    await this.reloadFile(file);
  }

  /** 切换置顶（追加/移除 #置顶 标签） */
  togglePinned(flomo: Flomo): Promise<void> {
    return this.toggleReservedTag(flomo, PIN_TAG);
  }

  /** 切换收藏（追加/移除 #收藏 标签） */
  toggleStarred(flomo: Flomo): Promise<void> {
    return this.toggleReservedTag(flomo, STAR_TAG);
  }

  private async toggleReservedTag(flomo: Flomo, tag: string): Promise<void> {
    const has = flomo.tags.includes(tag);
    let newContent: string;
    if (has) {
      const re = new RegExp(
        `\\s*#${escapeRegex(tag)}(?![A-Za-z0-9_\\u4e00-\\u9fff/])`,
        "g"
      );
      newContent = flomo.content.replace(re, "");
      newContent = newContent
        .split("\n")
        .map((l) => l.replace(/[ \t]+$/, ""))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (newContent === "") {
        newContent = `（已取消${tag}）`;
      }
    } else {
      const lines = flomo.content.split("\n");
      if (lines.length === 0 || lines[0]!.trim() === "") {
        lines[0] = `#${tag}`;
      } else {
        lines[0] = `${lines[0]!.replace(/\s+$/, "")} #${tag}`;
      }
      newContent = lines.join("\n");
    }
    await this.editFlomo(flomo, newContent);
  }

  /** 原地移除所有"空日期标题" */
  private removeOrphanDateHeaders(lines: string[]): void {
    const dateRe = /^##\s+\d{4}-\d{2}-\d{2}(?:\s+.+)?$/;
    const memoRe = /^- \d{2}:\d{2}/;
    const nextBlockRe = /^#{1,2}\s+/;

    const toDelete: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (!dateRe.test(lines[i]!)) continue;
      let hasMemo = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (nextBlockRe.test(lines[j]!)) break;
        if (memoRe.test(lines[j]!)) {
          hasMemo = true;
          break;
        }
      }
      if (!hasMemo) toDelete.push(i);
    }
    for (let k = toDelete.length - 1; k >= 0; k--) {
      lines.splice(toDelete[k]!, 1);
    }
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureFolder(app: App, folder: string): Promise<void> {
  const exists = app.vault.getAbstractFileByPath(folder);
  if (!exists) {
    await app.vault.createFolder(folder);
  }
}

/**
 * 把一条 flomo 追加写入用户指定的单个笔记文件（与「快速捕获」共用同一文件、同一格式）：
 *   ## YYYY-MM-DD 周X   （按天分组）
 *   - HH:MM
 *     正文（缩进 2 空格）
 * 返回实际写入的文件路径。若文件不存在会自动创建（含父目录）。
 */
export async function appendFlomoToFile(
  app: App,
  filePath: string,
  content: string,
  when: Date = new Date()
): Promise<string> {
  content = content.trim();
  if (!content) throw new Error("内容为空");

  const dateStr = fmtDate(when);
  const timeStr = fmtTime(when);
  const weekday = fmtWeekday(when);
  const heading = `## ${dateStr} ${weekday}`;

  // 正文逐行缩进一档（2 空格），空行保留用于多段换行
  const indent = "  ";
  const body = content
    .split("\n")
    .map((l) => (l.trim() === "" ? "" : indent + l))
    .join("\n");
  const entry = `- ${timeStr}\n${body}`;

  // 组装「旧文本 + 新条目」（同一天并进当天标题下，新的一天再写日期标题）
  const build = (text: string): string => {
    const trimmed = text.replace(/\n+$/, "");
    const lastHeading = extractLastDateHeading(text);
    if (trimmed === "") return `${heading}\n${entry}`;
    if (lastHeading === heading) return `${trimmed}\n\n${entry}`;
    return `${trimmed}\n\n${heading}\n${entry}`;
  };

  const file = app.vault.getAbstractFileByPath(filePath) as TFile | null;
  if (file) {
    await app.vault.process(file, (old) => build(old));
    return filePath;
  }
  const slash = filePath.lastIndexOf("/");
  const parent = slash > 0 ? filePath.slice(0, slash) : "";
  await ensureFolder(app, parent);
  await app.vault.create(filePath, build(""));
  return filePath;
}

/** 取文件最后一个「## YYYY-MM-DD 周X」日期标题行，用于判断今天是否已开篇 */
function extractLastDateHeading(text: string): string {
  const m = text.match(/^## \d{4}-\d{2}-\d{2}\s+\S.*$/gm);
  return m && m.length > 0 ? m[m.length - 1]! : "";
}