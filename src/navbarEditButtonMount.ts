import { App, Editor, MarkdownView, Notice } from "obsidian";
import { mountFloatingEditButton } from "./view/codeblock/floatingEditButton";
import { NavBarBuilderModal } from "./navbarBuilderModal";
import { parseNavBarConfig, NavBarParseError } from "./navbarConfig";

async function replaceRangeInView(
	app: App,
	from: { line: number; ch: number },
	to: { line: number; ch: number },
	replacement: string
): Promise<boolean> {
	const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
	if (!markdownView) {
		new Notice("No active markdown view");
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
		console.error("[navbar] replaceRange failed:", e);
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

export function mountNavbarEditButton(
	app: App,
	code: string,
	codeblockDom: HTMLElement,
	sourcePath: string,
	startLine: number,
	endLine: number
) {
	let currentCode = code;
	let currentStartLine = startLine;
	let currentEndLine = endLine;

	return mountFloatingEditButton({
		app,
		codeblockDom,
		className: "navbar-codeblock-edit-button",
		iconName: "pencil",
		onClick: () => {
			try {
				const config = parseNavBarConfig(currentCode);
				new NavBarBuilderModal(
					app,
					async (nextConfig) => {
						const newBlock = NavBarBuilderModal.toCodeBlock(nextConfig).trimEnd();
						const newLines = newBlock.split("\n");

						const from = { line: currentStartLine, ch: 0 };
						const to = { line: currentEndLine, ch: 0 };

						const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
						if (markdownView) {
							to.ch = markdownView.editor.getLine(currentEndLine).length;
						}

						const success = await replaceRangeInView(app, from, to, newLines.join("\n"));
						if (success) {
							currentEndLine = currentStartLine + newLines.length - 1;
							currentCode = NavBarBuilderModal.toCodeBlockInner(nextConfig);
						}
					},
					config
				).open();
			} catch (error) {
				if (error instanceof NavBarParseError) {
					new Notice(error.message);
				} else {
					console.error(error);
				}
			}
		},
	});
}
