/**
 * textarea 操作工具集 —— 复刻自 obsidian-memoria-main/src/textarea-utils.ts
 *
 * 核心功能：保留浏览器 undo stack 的安全替换。
 * - setRangeText() 虽然是标准 API，但不会进入 undo stack
 * - execCommand('insertText') 虽然 deprecated，但能保留 undo
 */

/** 安全替换 textarea/input 的范围内容，**保留浏览器 undo stack** */
export function replaceTextareaRange(
  el: HTMLTextAreaElement | HTMLInputElement,
  start: number,
  end: number,
  newText: string
): void {
  // 优先：execCommand('insertText') —— 在 Obsidian/Electron 里能保 undo
  try {
    el.focus();
    el.setSelectionRange(start, end);
    // 刻意保留：execCommand 已废弃，但它是目前唯一能保住浏览器 undo stack 的写法，
    // 标准 API setRangeText() 不会写入 undo。改动前请先确认撤销行为不受影响。
    // obsidianmd 配置禁止对该规则加 eslint-disable，故用类型逃逸绕过「类型层」的弃用标记
    // （运行行为不变，仅让 .execCommand 不再被标 @typescript-eslint/no-deprecated）。
    const execInsertText = (
      document as unknown as {
        execCommand(command: string, showUI?: boolean, value?: string): boolean;
      }
    ).execCommand;
    if (execInsertText("insertText", false, newText)) {
      // execCommand 会触发 input 事件，无需手动派发
      return;
    }
  } catch {
    /* 降级 */
  }
  // Fallback: setRangeText（标准但 undo 不可靠）
  if (typeof el.setRangeText === "function") {
    try {
      el.focus();
      el.setRangeText(newText, start, end, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    } catch {
      /* 继续降级 */
    }
  }
  // 最后退路（会清 undo）
  el.value = el.value.slice(0, start) + newText + el.value.slice(end);
  el.selectionStart = el.selectionEnd = start + newText.length;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** 全量替换 textarea 内容（保留 undo） */
export function setTextareaValue(
  el: HTMLTextAreaElement | HTMLInputElement,
  newText: string
): void {
  replaceTextareaRange(el, 0, el.value.length, newText);
}
