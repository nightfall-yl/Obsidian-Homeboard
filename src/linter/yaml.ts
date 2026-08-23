/**
 * Linter 移植所需的轻量 YAML frontmatter 工具。
 * 仅依赖正则，不引入 `yaml`/`js-yaml` 等包：这里只处理 frontmatter 区块的
 * 查找 / 初始化 / 键值行改写，供 yaml-timestamp 规则使用。
 */

/** 匹配文档开头的 `---\n ... \n---` frontmatter 块。 */
export const yamlRegex = /^---\n((?:(((?!---)(?:.|\n)*?)\n)?))---(?=\n|$)/;

/**
 * 替换字符串中的 `$` 为 `$$`，用于 String.replace 的替换串，避免用户文本里的
 * `$` 被当作正则分组引用。
 */
export function escapeDollarSigns(str: string): string {
  return str.replace(/\$/g, "$$$$");
}

/** 在 index 位置插入 value。 */
function insert(str: string, index: number, value: string): string {
  return str.substring(0, index) + value + str.substring(index);
}

/**
 * 若文本没有 frontmatter 则补一个空 frontmatter 块。
 */
export function initYAML(text: string): string {
  if (text.match(yamlRegex) === null) {
    text = "---\n---\n" + text;
  }
  return text;
}

/**
 * 提取第一个 frontmatter 块的正则匹配；若不存在返回 null。
 */
export function getYAMLText(text: string): string | null {
  const yaml = text.match(yamlRegex);
  return yaml ? (yaml[1] ?? null) : null;
}

/**
 * 对 frontmatter 块整体应用 func，并将结果回写。func 接收整个 frontmatter 文本
 * （含开头的 `---\n` 与结尾的 `\n---`），返回改写后的文本；若文本无 frontmatter，
 * 原样返回。
 */
export function formatYAML(
  text: string,
  func: (text: string) => string
): string {
  if (!text.match(yamlRegex)) {
    return text;
  }
  const oldYaml = text.match(yamlRegex)![0];
  const newYaml = func(oldYaml);
  text = text.replace(oldYaml, escapeDollarSigns(newYaml));
  return text;
}

export function insertAt(text: string, index: number, value: string): string {
  return insert(text, index, value);
}