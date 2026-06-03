import { App, Editor, MarkdownView, MarkdownPostProcessorContext, Notice } from "obsidian";
import { HeatmapCreateModal } from "../form/GraphFormModal";
import { mountFloatingEditButton } from "./floatingEditButton";
import { Locals } from "src/i18/messages";

async function replaceRangeInView(
	app: App,
	from: { line: number; ch: number },
	to: { line: number; ch: number },
	replacement: string
): Promise<boolean> {
	const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
	if (!markdownView) {
		new Notice(Locals.get().notice_heatmap_no_markdown_view);
		return false;
	}

	const currentMode = markdownView.getMode();
	const state = markdownView.getState();
	const wasReadingMode = currentMode === "preview";

	if (wasReadingMode) {
		state.mode = "source";
		state.source = false;
		await markdownView.setState(state, { history: false });
		await new Promise((r) => setTimeout(r, 100));
	}

	const editor = markdownView.editor;
	try {
		editor.replaceRange(replacement, from, to);
	} catch (e) {
		console.error("[replaceRangeInView] replaceRange failed:", e);
		new Notice("保存失败: " + (e as Error).message);
		if (wasReadingMode) {
			state.mode = "preview";
			await markdownView.setState(state, { history: false });
		}
		return false;
	}

	if (wasReadingMode) {
		state.mode = "preview";
		await markdownView.setState(state, { history: false });
	}

	return true;
}

export function mountEditButtonToCodeblock(
	app: App,
	code: string,
	codeblockDom: HTMLElement,
	ctx: MarkdownPostProcessorContext
) {
	let currentCode = code;

	const sectionInfo = ctx.getSectionInfo(codeblockDom);
	let startLine: number | null = null;
	let endLine: number | null = null;

	if (sectionInfo) {
		startLine = sectionInfo.lineStart;
		endLine = sectionInfo.lineEnd;
	}

	return mountFloatingEditButton({
		app,
		codeblockDom,
		className: "heatmap-codeblock-edit-button",
		iconName: "pencil",
		onClick: () => {
			try {
				const modal = new HeatmapCreateModal(app, currentCode, async (content) => {
					try {
						if (startLine !== null && endLine !== null) {
							const newBlock = "```heatmap\n" + content.trimEnd() + "\n```";
							const newLines = newBlock.split("\n");

							const from = { line: startLine, ch: 0 };
							const to = { line: endLine, ch: 0 };

							const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
							if (markdownView) {
								to.ch = markdownView.editor.getLine(endLine).length;
							}

							const success = await replaceRangeInView(app, from, to, newLines.join("\n"));
							if (success) {
								const newEndLine = startLine + newLines.length - 1;
								endLine = newEndLine;
								currentCode = content;
							}
						} else {
							new Notice("无法定位热力图代码块位置，请手动编辑");
						}
					} catch (callbackError) {
						console.error("[HeatmapEditButton] Save callback error:", callbackError);
						new Notice("保存热力图配置失败: " + (callbackError as Error).message);
					}
				});

				modal.open();

			} catch (clickError) {
				console.error("[HeatmapEditButton] Click handler error:", clickError);
				new Notice("打开热力图编辑器失败: " + (clickError as Error).message);
			}
		},
	});
}
