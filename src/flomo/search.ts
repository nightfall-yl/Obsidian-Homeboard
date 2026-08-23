// ================= 高级搜索查询解析器 =================
// 1:1 fork 自 obsidian-memoria-main/src/search.ts。

export interface SearchQuery {
  /** 必须同时包含的关键词（AND） */
  includeTerms: string[];
  /** 必须不包含的关键词 */
  excludeTerms: string[];
  /** 必须带的标签（不含 #） */
  includeTags: string[];
  /** 必须不带的标签 */
  excludeTags: string[];
  /** 日期 >= afterDate（yyyy-MM-dd 字符串比较，null = 不限） */
  afterDate: string | null;
  /** 日期 <= beforeDate */
  beforeDate: string | null;
  /** 原始 query（用于展示） */
  raw: string;
}

/** 空查询：表示没有任何筛选条件 */
export const EMPTY_QUERY: SearchQuery = {
  includeTerms: [],
  excludeTerms: [],
  includeTags: [],
  excludeTags: [],
  afterDate: null,
  beforeDate: null,
  raw: "",
};

/** 把搜索框里的字符串解析为结构化 Query */
export function parseSearchQuery(raw: string): SearchQuery {
  const q: SearchQuery = {
    includeTerms: [],
    excludeTerms: [],
    includeTags: [],
    excludeTags: [],
    afterDate: null,
    beforeDate: null,
    raw: raw.trim(),
  };
  if (!q.raw) return q;

  const tokens = q.raw.split(/\s+/).filter((t) => t.length > 0);
  for (const token of tokens) {
    const isExclude = token.startsWith("-") && token.length > 1;
    const body = isExclude ? token.slice(1) : token;

    const dateMatch = body.match(/^(after|before|date):(.+)$/i);
    if (dateMatch) {
      const kind = dateMatch[1]!.toLowerCase() as "after" | "before" | "date";
      const value = dateMatch[2]!;
      const range = parseDateToken(value);
      if (range) {
        if (kind === "after") {
          q.afterDate = pickLater(q.afterDate, range.start);
        } else if (kind === "before") {
          q.beforeDate = pickEarlier(q.beforeDate, range.end);
        } else {
          q.afterDate = pickLater(q.afterDate, range.start);
          q.beforeDate = pickEarlier(q.beforeDate, range.end);
        }
        continue;
      }
    }

    if (body.startsWith("#") && body.length > 1) {
      const tagName = body.slice(1);
      if (isExclude) {
        q.excludeTags.push(tagName);
      } else {
        q.includeTags.push(tagName);
      }
      continue;
    }

    if (isExclude) {
      q.excludeTerms.push(body);
    } else {
      q.includeTerms.push(body);
    }
  }
  return q;
}

/** 解析日期 token，返回 [start, end]（yyyy-MM-dd 字符串） */
function parseDateToken(s: string): { start: string; end: string } | null {
  const yearRe = /^(\d{4})$/;
  const monthRe = /^(\d{4})-(\d{1,2})$/;
  const dateRe = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

  let m = s.match(dateRe);
  if (m) {
    const y = m[1]!;
    const mo = m[2]!.padStart(2, "0");
    const d = m[3]!.padStart(2, "0");
    return { start: `${y}-${mo}-${d}`, end: `${y}-${mo}-${d}` };
  }
  m = s.match(monthRe);
  if (m) {
    const y = parseInt(m[1]!, 10);
    const mo = parseInt(m[2]!, 10);
    if (mo < 1 || mo > 12) return null;
    const moStr = mo.toString().padStart(2, "0");
    const lastDay = new Date(y, mo, 0).getDate();
    const dStr = lastDay.toString().padStart(2, "0");
    return { start: `${y}-${moStr}-01`, end: `${y}-${moStr}-${dStr}` };
  }
  m = s.match(yearRe);
  if (m) {
    const y = m[1];
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  return null;
}

function pickLater(a: string | null, b: string): string {
  if (!a) return b;
  return a > b ? a : b;
}
function pickEarlier(a: string | null, b: string): string {
  if (!a) return b;
  return a < b ? a : b;
}

/** 一个 flomo 是否匹配给定的 Query */
export function matchesQuery(
  memoContent: string,
  memoTags: string[],
  memoDate: string,
  q: SearchQuery
): boolean {
  if (q.raw === "") return true;

  const lowerContent = memoContent.toLowerCase();
  for (const term of q.includeTerms) {
    if (!lowerContent.includes(term.toLowerCase())) return false;
  }
  for (const term of q.excludeTerms) {
    if (lowerContent.includes(term.toLowerCase())) return false;
  }
  for (const tag of q.includeTags) {
    const hit = memoTags.some((t) => t === tag || t.startsWith(tag + "/"));
    if (!hit) return false;
  }
  for (const tag of q.excludeTags) {
    const hit = memoTags.some((t) => t === tag || t.startsWith(tag + "/"));
    if (hit) return false;
  }
  if (q.afterDate && memoDate < q.afterDate) return false;
  if (q.beforeDate && memoDate > q.beforeDate) return false;

  return true;
}

/** 把 flomo 文本中匹配的关键词 wrap 成 <mark> 标签（安全转义） */
export function highlightTerms(text: string, terms: string[]): string {
  if (terms.length === 0) return escapeHtml(text);
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const escapedText = escapeHtml(text);
  const escapedTerms = sorted.map((x) => escapeRegExp(escapeHtml(x)));
  const pattern = escapedTerms.join("|");
  if (!pattern) return escapedText;
  const re = new RegExp(`(${pattern})`, "gi");
  return escapedText.replace(re, '<mark class="flomo-search-hit">$1</mark>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}