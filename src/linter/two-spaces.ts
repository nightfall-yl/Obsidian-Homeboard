/**
 * 不同内容间换行规则：在段落、引用和列表项之间，每个内容块的结尾（其后紧跟
 * 另一行内容时）自动补两个空格 + 换行。移植自 obsidian-linter 同名规则。
 */
import { addTwoSpacesAtEndOfLinesFollowedByAnotherLineOfTextContent, LineBreakIndicators } from "./mdast";

export function applyTwoSpaces(text: string): string {
  return addTwoSpacesAtEndOfLinesFollowedByAnotherLineOfTextContent(
    text,
    LineBreakIndicators.TwoSpaces
  );
}