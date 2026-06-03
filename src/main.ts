import { Editor, getLanguage, MarkdownView, Notice, Plugin, setIcon } from "obsidian";
import { NavBarProcessor } from "./navbarProcessor";
import { NavBarBuilderModal } from "./navbarBuilderModal";
import { mountNavbarEditButton } from "./navbarEditButtonMount";
import { stringifyNavBarConfig } from "./navbarYaml";
import { Locals } from "src/i18/messages";
import { CodeBlockProcessor } from "./processor/codeBlockProcessor";
import { Renders } from "./render/renders";
import { ElementsSettingTab } from "./settings";
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
import { ElementsSettings, DEFAULT_ELEMENTS_SETTINGS } from "./types";

const CSS_ID = 'elements-styles';

const loadCss = async (plugin: ElementsPlugin) => {
	if (document.getElementById(CSS_ID)) return;

	try {
		const cssContent = await plugin.app.vault.adapter.read(plugin.manifest.dir + '/styles.css');
		const style = document.createElement('style');
		style.id = CSS_ID;
		style.textContent = cssContent;
		document.head.appendChild(style);
	} catch (error) {
		console.error('[Elements] Failed to load styles:', error);
	}
};


declare global {
	interface Window {
		renderHeatmap?: (
			container: HTMLElement,
			graphConfig: HeatmapConfig
		) => void;
	}
}

export default class ElementsPlugin extends Plugin {
	settings: ElementsSettings;
	forceViewModeManager: ForceViewModeManager;
	cursorPositionManager: CursorPositionManager;
	homepage: Homepage;

	async onload() {
		await this.loadSettings();
		await loadCss(this);  // ✅ 传入 plugin 实例
		this.registerGlobalRenderApi();

		// ========================================
		// ① HOMEPAGE - 主页管理（优先级最高）
		// ========================================
		this.homepage = new Homepage(this.app);
		const hpSettings = this.settings.homepage;
		this.homepage.updateSettings(hpSettings);

		if (hpSettings.openOnStartup) {
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
			});
		}

		this.registerEvent(
			this.app.workspace.on("layout-change", async () => {
				const homepageSettings = this.settings.homepage;
				if (!homepageSettings.enabled) return;
				if (homepageSettings.revertView) await this.homepage.revertViewIfNeeded();
				if (homepageSettings.openWhenEmpty) await this.homepage.openWhenEmpty();
			})
		);

		// ========================================
		// ② CALENDAR - 日历视图
		// ========================================
		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));

		const calSettings = this.settings.calendar;
		calendarSettings.set({
			...defaultCalendarSettings,
			wordsPerDot: calSettings.wordsPerDot,
			weekStart: calSettings.weekStart as IWeekStartOption,
			shouldConfirmBeforeCreate: calSettings.shouldConfirmBeforeCreate,
			position: calSettings.position || "left",
			highlightToday: calSettings.highlightToday !== false,
		});

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

		// ========================================
		// ③ NAVBAR - 导航栏
		// ========================================
		this.registerMarkdownCodeBlockProcessor("navbar", (source, el, ctx) => {
			const processor = new NavBarProcessor(this);
			processor.render(source, el, ctx);
			if (el.parentElement) {
				const sectionInfo = ctx.getSectionInfo?.(el);
				const startLine = sectionInfo?.lineStart;
				const endLine = sectionInfo?.lineEnd;
				if (startLine !== undefined && endLine !== undefined) {
					mountNavbarEditButton(this.app, source, el.parentElement, ctx.sourcePath, startLine, endLine);
				}
			}
		});

		this.addCommand({
			id: "open-navbar-builder",
			name: "New NavBar",
			editorCallback: (editor: Editor) => {
				this.insertNavBarBlock(editor);
			},
		});

		// ========================================
		// ④ HEATMAP - 热力图
		// ========================================
		this.registerMarkdownCodeBlockProcessor("heatmap", (code, el, ctx) => {
			const processor = new CodeBlockProcessor();
			processor.renderFromCodeBlock(code, el, ctx, this.app);
			if (el.parentElement) {
				mountEditButtonToCodeblock(this.app, code, el.parentElement, ctx);
			}
		});

		this.addCommand({
			id: "create-heatmap",
			name: "New Heatmap",
			editorCallback: () => {
				this.openHeatmapModal();
			},
		});

		// ========================================
		// ⑤ FORCE VIEW MODE - 强制视图模式
		// ========================================
		this.forceViewModeManager = new ForceViewModeManager(this, this.settings.forceViewMode);
		this.forceViewModeManager.onload();

		// ========================================
		// ⑥ CURSOR POSITION - 光标位置记忆（最后初始化）
		// ========================================
		this.cursorPositionManager = new CursorPositionManager(this, this.settings.cursorPosition);
		this.cursorPositionManager.onload();

		// ========================================
		// 全局设置面板注册
		// ========================================
		this.addSettingTab(new ElementsSettingTab(this.app, this));
	}

	onunload() {
		this.forceViewModeManager?.onunload();
		this.cursorPositionManager?.onunload();
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
		this.settings = Object.assign({}, DEFAULT_ELEMENTS_SETTINGS, loadedSettings);
		this.settings.homepage = {
			...DEFAULT_ELEMENTS_SETTINGS.homepage,
			...(loadedSettings?.homepage ?? {}),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.forceViewModeManager?.updateSettings(this.settings.forceViewMode);
		this.cursorPositionManager?.updateSettings(this.settings.cursorPosition);
		const calSettings = this.settings.calendar;
		calendarSettings.set({
			...defaultCalendarSettings,
			wordsPerDot: calSettings.wordsPerDot,
			weekStart: calSettings.weekStart as IWeekStartOption,
			shouldConfirmBeforeCreate: calSettings.shouldConfirmBeforeCreate,
			position: calSettings.position || "left",
			highlightToday: calSettings.highlightToday !== false,
		});
		this.homepage?.updateSettings(this.settings.homepage);
	}

	private registerGlobalRenderApi() {
		window.renderHeatmap = (
			container: HTMLElement,
			graphConfig: HeatmapConfig
		): void => {
			Renders.render(container, graphConfig);
		};
	}

	private insertNavBarBlock(editor: Editor) {
		const initialConfig = NavBarBuilderModal.createInitialConfig();
		editor.replaceSelection(NavBarBuilderModal.toCodeBlock(initialConfig));
	}

	private openHeatmapModal() {
		new HeatmapCreateModal(this.app).open();
	}
}
