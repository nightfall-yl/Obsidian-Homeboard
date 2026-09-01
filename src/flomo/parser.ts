// ================= Flomo 解析器 =================
// 1:1 fork 自 obsidian-memoria-main/src/parser.ts 的核心子集。
// 负责把 YYYY.md 文件解析成 Flomo[]，以及把 Flomo 序列化回文件。

import type { Flomo} from "./types";
import { PIN_TAG, STAR_TAG } from "./types";

const WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/**
 * 解析一个 md 文件内容，抽出所有 flomo。
 * 识别规则：
 *   ## 2026-04-25 周六      <- 日期分组
 *   - 12:43 内容内容        <- 一条 flomo
 *     (缩进 2 空格的后续行视作同一条 flomo 的多行内容)
 */
export function parseFile(filePath: string, raw: string): Flomo[] {
  const lines = raw.split(/\r?\n/);
  const flomos: Flomo[] = [];

  let currentDate = "";
  let i = 0;
  const dateHeaderRe = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+.+)?$/;
  const memoStartRe = /^-\s+(\d{2}:\d{2})\s?(.*)$/;

  while (i < lines.length) {
    const line = lines[i]!;
    const dm = line.match(dateHeaderRe);
    if (dm) {
      currentDate = dm[1]!;
      i++;
      continue;
    }
    const mm = line.match(memoStartRe);
    if (mm && currentDate) {
      const time = mm[1]!;
      const firstLine = mm[2] ?? "";
      const startLine = i;
      const bodyLines: string[] = [firstLine];
      i++;
      // 吸收缩进行（2 空格缩进 或 空行紧跟缩进行）
      while (i < lines.length) {
        const next = lines[i]!;
        if (memoStartRe.test(next) || dateHeaderRe.test(next)) break;
        if (/^#\s+\d{4}\s*$/.test(next)) break;
        if (next.startsWith("  ")) {
          bodyLines.push(next.slice(2));
          i++;
          continue;
        }
        if (next.trim() === "") {
          // 跳过任意多个连续空行，看再之后第一行是否仍属本 flomo
          let j = i + 1;
          while (j < lines.length && lines[j]!.trim() === "") j++;
          if (j >= lines.length) break;
          const peek = lines[j]!;
          if (memoStartRe.test(peek) || dateHeaderRe.test(peek)) break;
          if (/^#\s+\d{4}\s*$/.test(peek)) break;
          if (peek.startsWith("  ")) {
            for (let k = i; k < j; k++) bodyLines.push("");
            i = j;
            continue;
          }
          break;
        }
        break;
      }
      const endLine = i - 1;
      while (bodyLines.length && bodyLines[0]!.trim() === "") bodyLines.shift();
      while (bodyLines.length && bodyLines[bodyLines.length - 1]!.trim() === "")
        bodyLines.pop();
      const content = bodyLines.join("\n");
      const datetime = parseLocalDateTime(currentDate, time);
      const tags = extractTags(content);
      const hasImage = detectImage(content);
      const hasLink = detectLink(content);
      const isPinned = tags.includes(PIN_TAG);
      const isStarred = tags.includes(STAR_TAG);
      flomos.push({
        file: filePath,
        date: currentDate,
        time,
        datetime,
        content,
        tags,
        hasImage,
        hasLink,
        isPinned,
        isStarred,
        range: [startLine, endLine],
      });
      continue;
    }
    i++;
  }
  return flomos;
}

/** 把 "2026-04-25" + "12:43" 解析成本地 Date */
export function parseLocalDateTime(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map((s) => parseInt(s, 10));
  const [h, mi] = time.split(":").map((s) => parseInt(s, 10));
  return new Date(y!, mo! - 1, d, h, mi, 0, 0);
}

/** 抽取 #tag（支持中文、嵌套如 #父/子） */
export function extractTags(text: string): string[] {
  const re = /#([A-Za-z0-9_\u4e00-\u9fff][A-Za-z0-9_\u4e00-\u9fff/]*)/g;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1]!);
  }
  return [...set];
}

/** 是否包含图片：Markdown ![](url) 或 Obsidian 风格 ![[xxx.png]] */
export function detectImage(text: string): boolean {
  if (/!\[[^\]]*\]\([^)]+\)/.test(text)) return true;
  if (/!\[\[[^\]]+\.(png|jpe?g|gif|webp|svg|bmp|avif)(\|[^\]]*)?\]\]/i.test(text))
    return true;
  return false;
}

/** 是否包含链接：http(s) 链接、Markdown 链接、Obsidian wikilink */
export function detectLink(text: string): boolean {
  const stripped = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/!\[\[[^\]]+\]\]/g, "");
  if (/\[[^\]]+\]\([^)]+\)/.test(stripped)) return true;
  if (/\[\[[^\]]+\]\]/.test(stripped)) return true;
  if (/https?:\/\/[^\s)]+/.test(stripped)) return true;
  return false;
}

/** 根据 Date 生成本地 yyyy-MM-dd */
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 根据 Date 生成本地 HH:mm */
export function fmtTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const mi = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${mi}`;
}

/** 根据 Date 生成中文星期 */
export function fmtWeekday(d: Date): string {
  return WEEKDAY_CN[d.getDay()]!;
}

/** 生成一条 flomo 的 md 文本（时间独占一行 + 内容全部缩进 2 空格） */
export function renderMemo(time: string, content: string): string {
  const raw = content.replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  while (lines.length && lines[0]!.trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1]!.trim() === "") lines.pop();
  if (lines.length === 0) {
    return `- ${time}`;
  }
  const body = lines.map((l) => (l.trim() === "" ? "" : `  ${l}`)).join("\n");
  return `- ${time}\n${body}`;
}