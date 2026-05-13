import { Editor, getLanguage, MarkdownFileInfo, MarkdownView, Menu, Notice, Plugin, TFile, setIcon, } from "obsidian";
import { ElementCardBuilderModal } from "./elementCardBuilderModal";
import { Locals } from "./i18/messages";
import { parseElementCardConfig } from "./elementCardConfig";
import { ElementCardError } from "./elementCardError";
import { ElementCardProcessor } from "./elementCardProcessor"; 
import { 
	DEFAULT_ELEMENTCARD_SETTINGS, 
	ELEMENTCARD_CARD_PALETTES, 
	ElementCardCardPalettePreset, 
	ElementCardComponentSettings 
} from "./elementCardTypes";
import { stringifyElementCardConfig } from "./elementCardYaml";
import { CodeBlockProcessor } from "./processor/codeBlockProcessor";
import { Renders } from "./render/renders";
import { applyElementCardStyles, ElementCardSettingTab } from "./settings";
import { HeatmapConfig } from "./types";
import { mountEditButtonToCodeblock } from "./view/codeblock/CodeblockEditButtonMount";
import { HeatmapCreateModal } from "./view/form/GraphFormModal";
import { ForceViewModeManager } from "./forceViewMode";
import { CursorPositionManager } from "./cursorPosition";
import { Homepage } from "./homepage/Homepage";
import { CalendarView } from "./calendar/CalendarView";
import { VIEW_TYPE_CALENDAR } from "./calendar/constants";
import { calendarSettings } from "./calendar/ui/stores";
import { defaultCalendarSettings } from "./calendar/settings";
import type { IWeekStartOption } from "obsidian-calendar-ui";

const CSS_ID = 'obsidian-elements-styles';

const loadCss = () => {
	if (document.getElementById(CSS_ID)) return;
	const link = document.createElement('link');
	link.id = CSS_ID;
	link.rel = 'stylesheet';
	link.href = 'styles.css';
	document.head.appendChild(link);
};


declare global {
	interface Window {
		renderHeatmap?: (
			container: HTMLElement,
			graphConfig: HeatmapConfig
		) => void;
	}
}

const PALETTE_KEYS: ElementCardCardPalettePreset[] = ["sage", "mist", "amber", "plum", "slate"];

function pickRandomPalettes(count: number): ElementCardCardPalettePreset[] {
	const shuffled = [...PALETTE_KEYS].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

function generateElementCardSample(): string {
	const palettes = pickRandomPalettes(2);
	const local = Locals.get();
	return String.raw`title: ${local.elementCard_default_title}
columns: 2
gap: 2
cards:
  - type: links
    title: 卡片 1
    span: 1
    linksLayout: inline
    palettePreset: ${palettes[0]}
    links:
      - label: 链接 1
        url:
      - label: 链接 2
        url:
  - type: links
    title: 卡片 2
    span: 1
    linksLayout: inline
    palettePreset: ${palettes[1]}
    links:
      - label: 链接 1
        url:
      - label: 链接 2
        url:
`;
}

export default class ElementCardComponentPlugin extends Plugin {
	settings: ElementCardComponentSettings;
	forceViewModeManager: ForceViewModeManager;
	cursorPositionManager: CursorPositionManager;
	homepage: Homepage;

	async onload() {
		await this.loadSettings();
		loadCss();
		applyElementCardStyles(this.settings);
		this.registerGlobalRenderApi();

		// Initialize integrated plugins
		this.forceViewModeManager = new ForceViewModeManager(this, this.settings.forceViewMode);
		this.cursorPositionManager = new CursorPositionManager(this, this.settings.cursorPosition);
		
		this.forceViewModeManager.onload();
		this.cursorPositionManager.onload();

		// Register Calendar view
		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));

		// Initialize calendar settings from plugin settings
		const calSettings = this.settings.calendar;
		calendarSettings.set({
			...defaultCalendarSettings,
			wordsPerDot: calSettings.wordsPerDot,
			weekStart: calSettings.weekStart as IWeekStartOption,
			shouldConfirmBeforeCreate: calSettings.shouldConfirmBeforeCreate,
			position: calSettings.position || "left",
			highlightToday: calSettings.highlightToday !== false,
		});

		// Add ribbon icon for calendar (only if enabled)
		if (this.settings.calendar.enabled) {
			const isZhLang = (getLanguage() || "en").startsWith("zh");
			this.addRibbonIcon("calendar-days", isZhLang ? "打开日历" : "Open Calendar", () => {
				this.activateCalendarView();
			});
		}

		this.addCommand({
			id: "open-elements-calendar",
			name: (getLanguage() || "en").startsWith("zh") ? "打开日历" : "Open Calendar",
			callback: () => {
				this.activateCalendarView();
			},
		});

		// Initialize Homepage
		this.homepage = new Homepage(this.app);
		const hpSettings = this.settings.homepage;
		this.homepage.updateSettings(hpSettings);
		this.app.workspace.onLayoutReady(() => {
			this.homepage.schedulePinInFileExplorer();
		});

		if (hpSettings.enabled) {
			const isZhLang = (getLanguage() || "en").startsWith("zh");
			this.addRibbonIcon("home", isZhLang ? "打开主页" : "Open Homepage", (e) => {
				const alternate = e.button === 1 || e.button === 2 || e.metaKey || e.ctrlKey;
				this.homepage.open(alternate);
			});

			this.addCommand({
				id: "open-homepage",
				name: isZhLang ? "打开主页" : "Open Homepage",
				callback: () => this.homepage.open(),
			});
		}

		if (hpSettings.openOnStartup) {
			this.app.workspace.onLayoutReady(async () => {
				await new Promise((r) => setTimeout(r, 100));
				await this.homepage.open();
				this.homepage.schedulePinInFileExplorer();
			});
		}

		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				const homepageSettings = this.settings.homepage;
				if (!homepageSettings.enabled) return;
				if (homepageSettings.revertView) await this.homepage.revertViewIfNeeded();
				if (homepageSettings.openWhenEmpty) await this.homepage.openWhenEmpty();
				this.homepage.schedulePinInFileExplorer();
			})
		);

		this.registerEvent(
			this.app.vault.on("create", () => {
				this.homepage.schedulePinInFileExplorer();
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", () => {
				this.homepage.schedulePinInFileExplorer();
			})
		);

		// Register setting tab
		this.addSettingTab(new ElementCardSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("heatmap", (code, el, ctx) => {
			const processor = new CodeBlockProcessor();
			processor.renderFromCodeBlock(code, el, ctx, this.app);
			if (el.parentElement) {
				mountEditButtonToCodeblock(this.app, code, el.parentElement);
			}
		});

		this.registerMarkdownCodeBlockProcessor("elementCard", (source, el, ctx) => {
			const processor = new ElementCardProcessor(this, this.settings, (action) => {
				switch (action) {
					case "open-homepage":
						this.homepage?.open();
						break;
					case "open-memoria":
						this.openMemoria();
						break;
					case "open-weread":
						this.openWeread();
						break;
				}
			});
			processor.render(source, el, ctx, this.app);
		});

		this.addCommand({
			id: "open-elementCard-builder",
			name: "New ElementCard",
			editorCallback: (editor: Editor) => {
				this.insertElementCardBlock(editor);
			},
		});

		this.addCommand({
			id: "create-heatmap",
			name: "New Heatmap",
			editorCallback: () => {
				this.openHeatmapModal();
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, _info) => {
				menu.setUseNativeMenu(false);
				menu.addItem((item) =>
					item
						.setTitle(Locals.get().elementCard_menu_title)
						.setIcon("lucide-layout-template")
						.onClick(() => {})
				);
				window.setTimeout(() => {
					this.attachElementCardSubmenuHover(menu, editor);
				}, 0);
			})
		);
	}

	onunload() {
		this.forceViewModeManager?.onunload();
		this.cursorPositionManager?.onunload();
		this.homepage?.clearPinTimers();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
		document.getElementById(CSS_ID)?.remove();
	}

	async activateCalendarView() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]);
			return;
		}
		const position = this.settings.calendar.position || "left";
		const leaf = position === "left"
			? this.app.workspace.getLeftLeaf(false)
			: this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_CALENDAR,
				active: true,
			});
		}
		const calendarLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
		if (calendarLeaf) {
			this.app.workspace.revealLeaf(calendarLeaf);
		}
	}

	async loadSettings() {
		const loadedSettings = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_ELEMENTCARD_SETTINGS, loadedSettings);
		this.settings.homepage = {
			...DEFAULT_ELEMENTCARD_SETTINGS.homepage,
			...(loadedSettings?.homepage ?? {}),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update managers with new settings
		this.forceViewModeManager?.updateSettings(this.settings.forceViewMode);
		this.cursorPositionManager?.updateSettings(this.settings.cursorPosition);
		// Update calendar settings store
		const calSettings = this.settings.calendar;
		calendarSettings.set({
			...defaultCalendarSettings,
			wordsPerDot: calSettings.wordsPerDot,
			weekStart: calSettings.weekStart as IWeekStartOption,
			shouldConfirmBeforeCreate: calSettings.shouldConfirmBeforeCreate,
			position: calSettings.position || "left",
			highlightToday: calSettings.highlightToday !== false,
		});
		// Update homepage settings
		this.homepage?.updateSettings(this.settings.homepage);
		this.homepage?.schedulePinInFileExplorer();
	}

	private registerGlobalRenderApi() {
		window.renderHeatmap = (
			container: HTMLElement,
			graphConfig: HeatmapConfig
		): void => {
			Renders.render(container, graphConfig);
		};
	}

	private insertElementCardBlock(editor: Editor) {
		editor.replaceSelection(`\`\`\`elementCard\n${generateElementCardSample()}\n\`\`\`\n`);
	}

	private openHeatmapModal() {
		new HeatmapCreateModal(this.app).open();
	}

	private attachElementCardSubmenuHover(menu: Menu, editor: Editor) {
		const local = Locals.get();
		const menus = Array.from(document.querySelectorAll<HTMLElement>(".menu"));
		const currentMenuEl = menus.at(-1);
		if (!currentMenuEl) {
			return;
		}

		const menuItemEl = Array.from(currentMenuEl.querySelectorAll<HTMLElement>(".menu-item")).find(
			(itemEl) => itemEl.textContent?.includes(local.elementCard_menu_title)
		);
		if (!menuItemEl || menuItemEl.dataset.elementCardSubmenuBound === "true") {
			return;
		}

		menuItemEl.dataset.elementCardSubmenuBound = "true";
		menuItemEl.addClass("elementCard-menu-item--has-submenu");

		const titleEl = menuItemEl.querySelector<HTMLElement>(".menu-item-title");
		if (titleEl && !titleEl.querySelector(".elementCard-menu-item__chevron")) {
			titleEl.createSpan({
				cls: "elementCard-menu-item__chevron",
				text: "›",
			});
		}

		let submenuEl: HTMLElement | null = null;
		let hideTimer: number | null = null;
		let pointerInsideSubmenu = false;

		const clearHideTimer = () => {
			if (hideTimer !== null) {
				window.clearTimeout(hideTimer);
				hideTimer = null;
			}
		};

		const scheduleHide = () => {
			clearHideTimer();
			hideTimer = window.setTimeout(() => {
				if (!pointerInsideSubmenu) {
					submenuEl?.remove();
					submenuEl = null;
				}
			}, 120);
		};

		const runMenuInsert = (insert: () => void) => {
			submenuEl?.remove();
			submenuEl = null;
			menu.hide();
			window.setTimeout(() => {
				editor.focus();
				insert();
			}, 0);
		};

		const createSubmenuItem = (title: string, icon: string, onClick: () => void) => {
			const itemEl = createDiv({ cls: "menu-item elementCard-hover-submenu__item" });
			const iconEl = itemEl.createDiv({ cls: "menu-item-icon" });
			setIcon(iconEl, icon);
			itemEl.createDiv({ cls: "menu-item-title", text: title });
			itemEl.addEventListener("mousedown", (evt) => {
				evt.preventDefault();
				evt.stopPropagation();
				runMenuInsert(onClick);
			});
			return itemEl;
		};

		const showSubmenu = () => {
			clearHideTimer();
			if (submenuEl) {
				return;
			}

			const menuRect = currentMenuEl.getBoundingClientRect();
			const rect = menuItemEl.getBoundingClientRect();
			submenuEl = createDiv({ cls: "menu elementCard-hover-submenu" });
			submenuEl.style.left = `${menuRect.right - 4}px`;
			submenuEl.style.top = `${rect.top}px`;
			submenuEl.appendChild(
				createSubmenuItem(local.context_menu_insert_elementCard, "lucide-columns-2", () => {
					this.insertElementCardBlock(editor);
				})
			);
			submenuEl.appendChild(
				createSubmenuItem(local.context_menu_create, "lucide-chart-no-axes-combined", () => {
					this.openHeatmapModal();
				})
			);
			document.body.appendChild(submenuEl);
			submenuEl.addEventListener("mouseenter", () => {
				pointerInsideSubmenu = true;
				clearHideTimer();
			});
			submenuEl.addEventListener("mouseleave", () => {
				pointerInsideSubmenu = false;
				scheduleHide();
			});
		};

		menuItemEl.addEventListener("mouseenter", showSubmenu);
		menuItemEl.addEventListener("mouseleave", () => {
			pointerInsideSubmenu = false;
			scheduleHide();
		});
		menu.onHide(() => {
			clearHideTimer();
			submenuEl?.remove();
			submenuEl = null;
		});
	}

	openBuilder() {
		const view = this.getActiveMarkdownView();
		if (!view?.file?.path) {
			new Notice(Locals.get().notice_open_markdown_first);
			return;
		}

		const editor = view.editor;
		const start = editor.getCursor("from");
		const initialConfig = ElementCardBuilderModal.createInitialConfig(this.settings);
		const codeBlock = ElementCardBuilderModal.toCodeBlock(initialConfig);
		editor.replaceSelection(codeBlock);
		const insertedLines = this.countBlockLines(codeBlock);
		this.openBuilderForBlock(
			view.file.path,
			start.line,
			start.line + insertedLines - 1,
			stringifyElementCardConfig(initialConfig)
		);
	}

	private getActiveMarkdownView() {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	private countBlockLines(codeBlock: string) {
		return codeBlock.trimEnd().split("\n").length;
	}

	openBuilderForBlock(
		sourcePath: string,
		startLine: number,
		endLine: number,
		content: string
	) {
		this.openBuilderModal(sourcePath, startLine, endLine, content);
	}

	private openBuilderModal(
		sourcePath: string,
		startLine: number,
		endLine: number,
		content: string
	) {
		try {
			const config = parseElementCardConfig(content);
			new ElementCardBuilderModal(
				this.app,
				this.settings,
				async (nextConfig) => {
					try {
						await this.replaceBlockInFile(
							sourcePath,
							startLine,
							endLine,
							ElementCardBuilderModal.toCodeBlock(nextConfig)
						);
					} catch (error) {
						console.error(error);
						new Notice(Locals.get().notice_elementCard_update_failed);
					}
				},
				config
			).open();
		} catch (error) {
			if (error instanceof ElementCardError) {
				new Notice(error.summary);
				return;
			}

			console.error(error);
			new Notice(Locals.get().notice_elementCard_parse_failed);
		}
	}

	private editElementCardBlockAtCursor(editor: Editor) {
		const block = this.findElementCardBlockAtCursor(editor);
		if (!block) {
			new Notice(Locals.get().notice_elementCard_cursor_required);
			return;
		}

		try {
			const view = this.getActiveMarkdownView();
			const sourcePath = view?.file?.path;
			if (!sourcePath) {
				throw new Error(Locals.get().notice_no_active_markdown_file);
			}
			this.openBuilderModal(
				sourcePath,
				block.startLine,
				block.endLine,
				block.content
			);
		} catch (error) {
			if (error instanceof ElementCardError) {
				new Notice(error.summary);
				return;
			}

			console.error(error);
			new Notice(Locals.get().notice_elementCard_parse_failed);
		}
	}

	private findElementCardBlockAtCursor(editor: Editor) {
		const cursorLine = editor.getCursor().line;
		let startLine = -1;
		for (let line = cursorLine; line >= 0; line--) {
			const current = editor.getLine(line).trim();
			if (current.startsWith("```elementCard")) {
				startLine = line;
				break;
			}
			if (current.startsWith("```") && !current.startsWith("```elementCard")) {
				return null;
			}
		}

		if (startLine === -1) {
			return null;
		}

		let endLine = -1;
		const lastLine = editor.lineCount();
		for (let line = startLine + 1; line < lastLine; line++) {
			if (editor.getLine(line).trim() === "```") {
				endLine = line;
				break;
			}
		}

		if (endLine === -1 || cursorLine > endLine) {
			return null;
		}

		const contentLines: string[] = [];
		for (let line = startLine + 1; line < endLine; line++) {
			contentLines.push(editor.getLine(line));
		}

		return {
			startLine,
			endLine,
			content: contentLines.join("\n"),
		};
	}

	private async replaceBlockInFile(
		sourcePath: string,
		startLine: number,
		endLine: number,
		replacement: string
	) {
		const file = this.app.vault.getAbstractFileByPath(sourcePath);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${sourcePath}`);
		}

		const original = await this.app.vault.cachedRead(file);
		const hasTrailingNewline = original.endsWith("\n");
		const lines = original.split("\n");
		if (hasTrailingNewline) {
			lines.pop();
		}

		let resolvedEndLine = endLine;
		if (startLine >= 0 && startLine < lines.length && lines[startLine]?.trim().startsWith("```")) {
			for (let line = startLine + 1; line < lines.length; line++) {
				if (lines[line]?.trim() === "```") {
					resolvedEndLine = line;
					break;
				}
			}
		}

		const replacementLines = replacement.trimEnd().split("\n");
		lines.splice(startLine, resolvedEndLine - startLine + 1, ...replacementLines);

		const nextContent = `${lines.join("\n")}${hasTrailingNewline ? "\n" : ""}`;
		await this.app.vault.modify(file, nextContent);
	}

	private openWeread() {
		this.executePluginCommand("weread", "打开微信读书书架", "打开微信读书书架", "obsidian-weread-plugin:open-weread-bookshelf-view");
	}

	private openMemoria() {
		this.executePluginCommand("memoria", "打开 Memoria 面板", "打开 Memoria 面板");
	}

	private executePluginCommand(pluginHint: string, fallbackName: string, exactCmdName?: string, commandId?: string) {
		const allCommands = (this.app as any).commands?.commands || {};

		if (commandId && allCommands[commandId]) {
			(this.app as any).commands.executeCommandById(commandId);
			return;
		}

		if (exactCmdName) {
			const exact = Object.values(allCommands).find((cmd: any) => cmd?.name === exactCmdName);
			if (exact) {
				(this.app as any).commands.executeCommandById((exact as { id: string }).id);
				return;
			}
		}

		const match = Object.values(allCommands).find((cmd: any) => {
			if (!cmd?.name) return false;
			return cmd.name.toLowerCase().includes(pluginHint.toLowerCase());
		});

		if (match) {
			(this.app as any).commands.executeCommandById((match as { id: string }).id);
			return;
		}

		new Notice(Locals.get().notice_command_not_found.replace("{0}", fallbackName));
	}
}
