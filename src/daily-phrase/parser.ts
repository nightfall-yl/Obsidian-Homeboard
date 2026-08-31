export interface PhraseItem {
  /** 分类 / 关键词（来自 ## 标题），可空 */
  tag?: string;
  /** 英文句子 */
  en: string;
  /** 中文释义 */
  zh: string;
  /** 使用场景 */
  scene: string;
}

/** 字段键名 → 统一字段。支持英文/中文键名，半角或全角冒号。 */
const FIELD_ALIASES: Record<string, "en" | "zh" | "scene"> = {
  en: "en",
  english: "en",
  sentence: "en",
  英文: "en",
  zh: "zh",
  cn: "zh",
  chinese: "zh",
  translation: "zh",
  中文: "zh",
  scene: "scene",
  usage: "scene",
  context: "scene",
  situation: "scene",
  场景: "scene",
  用法: "scene"
};

/**
 * 把 .md 文本解析为口语条目数组（默认格式）：
 *   ## 分类（可选）
 *   en: 英文句子
 *   zh: 中文释义
 *   scene: 使用场景
 * 容错：en/zh/scene 大小写与中英键名、半角/全角冒号；## 标题或 --- 作为条目边界；
 * 无标题时以新的 en: 出现作为下一条起点。仅当同时具备 en 与 zh 才计入。
 */
export function parseDailyPhrases(text: string): PhraseItem[] {
  const items: PhraseItem[] = [];
  let cur: PhraseItem = { en: "", zh: "", scene: "" };
  let hasContent = false;

  const pushCur = (): void => {
    if (hasContent && cur.en.trim() && cur.zh.trim()) {
      items.push({
        tag: cur.tag,
        en: cur.en.trim(),
        zh: cur.zh.trim(),
        scene: cur.scene.trim()
      });
    }
    cur = { en: "", zh: "", scene: "" };
    hasContent = false;
  };

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // 条目边界：## 标题 或 --- 分隔线
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      pushCur();
      cur.tag = heading[1]!.trim() || undefined;
      continue;
    }
    if (/^-{3,}$/.test(line)) {
      pushCur();
      continue;
    }

    // 字段行：[-*] key: value（半角/全角冒号，key 可在行首或带列表符）
    const field = /^(?:[-*]\s+)?([\w一-龥]+)\s*[:：]\s*(.*)$/.exec(line);
    if (field) {
      const key = field[1]!.toLowerCase();
      const value = field[2]!;
      const mapped = FIELD_ALIASES[key];
      if (mapped) {
        // 遇到新的 en 且当前条目已有 en（无标题分隔）→ 视为下一条
        if (mapped === "en" && cur.en.trim()) {
          pushCur();
        }
        cur[mapped] = value;
        hasContent = true;
      }
    }
  }
  pushCur();
  return items;
}
