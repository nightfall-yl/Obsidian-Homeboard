import { App, PluginSettingTab, Setting, setIcon, TFolder, TAbstractFile, TFile, AbstractInputSuggest } from "obsidian";
import ElementCardComponentPlugin from "./main";
import {
	DEFAULT_ELEMENTCARD_SETTINGS,
	ElementCardComponentSettings,
	ForceViewModeSettings,
	CursorPositionSettings,
	SAFE_DB_FLUSH_INTERVAL,
	CalendarPluginSettings,
} from "./elementCardTypes";
import { convertToRGBA } from "./colorUtils";
import { VIEW_TYPE_CALENDAR } from "./calendar/constants";

export function applyElementCardStyles(settings: ElementCardComponentSettings) {
	const rootStyle = document.documentElement.style;
	rootStyle.setProperty("--elementCard-card-padding", `${settings.cardPadding}px`);
	rootStyle.setProperty("--elementCard-card-radius", `${settings.cardBorderRadius}px`);
	rootStyle.setProperty(
		"--elementCard-card-border-color",
		convertToRGBA(settings.cardBorderColor, settings.cardBorderTransparency)
	);
	rootStyle.setProperty("--elementCard-resizer-width", `${settings.resizerWidth}px`);
	rootStyle.setProperty(
		"--elementCard-resizer-color",
		settings.showResizers
			? convertToRGBA(settings.resizerColor, settings.resizerTransparency)
			: "transparent"
	);
}

// ===== Navigation Section Type =====
type SettingsSection = {
	id: string;
	label: string;
	labelZh: string;
	icon: string;
};

import { Locals, getLanguage } from "src/i18/messages";

function isZh(): boolean {
	return getLanguage() === "zh";
}

export class FolderSuggestDropdown extends AbstractInputSuggest<TFolder> {
	private allFolders: TFolder[] | null = null;
	private input: HTMLInputElement;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
	) {
		super(app, inputEl);
		this.input = inputEl;
	}

	private ensureLoaded(): void {
		if (this.allFolders) return;
		this.allFolders = this.app.vault.getAllLoadedFiles().filter((f) => f instanceof TFolder) as TFolder[];
	}

	getSuggestions(query: string): TFolder[] {
		this.ensureLoaded();
		const q = query.toLowerCase();
		if (!q) return this.allFolders!;
		return this.allFolders!.filter((f) => f.path.toLowerCase().includes(q));
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		el.setText(folder.path);
	}

	selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		this.input.value = folder.path;
		this.input.dispatchEvent(new Event("input"));
	}
}

export class FileSuggestDropdown extends AbstractInputSuggest<TFile> {
	private allFiles: TFile[];
	private input: HTMLInputElement;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
	) {
		super(app, inputEl);
		this.input = inputEl;
		this.allFiles = app.vault.getMarkdownFiles();
	}

	getSuggestions(query: string): TFile[] {
		const q = query.toLowerCase();
		if (!q) return this.allFiles;
		return this.allFiles.filter((f) =>
			f.path.toLowerCase().includes(q) || f.basename.toLowerCase().includes(q)
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path.replace(/\.md$/, ""));
	}

	selectSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent): void {
		this.input.value = file.path.replace(/\.md$/, "");
		this.input.dispatchEvent(new Event("input"));
	}
}

export class ElementCardSettingTab extends PluginSettingTab {
	plugin: ElementCardComponentPlugin;
	private activeSectionId: string = "homepage";

	constructor(app: App, plugin: ElementCardComponentPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		// Save scroll position and active section before re-render
		const scrollTop = this.containerEl.scrollTop;
		const prevActiveSection = this.activeSectionId;

		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("elementCard-settings-root");

		// Define navigation sections
			const sections: SettingsSection[] = [
				{ id: "homepage", label: "Homepage", labelZh: "主页", icon: "home" },
				{ id: "calendar", label: "Calendar", labelZh: "日历", icon: "calendar-days" },
				{ id: "forceView", label: "Force View Mode", labelZh: "视图模式", icon: "eye" },
				{ id: "cursorPosition", label: "Cursor Position", labelZh: "光标位置", icon: "mouse-pointer" },
			];

		// Create layout: nav + content
		const navEl = containerEl.createDiv({ cls: "elementCard-settings-nav" });
		const contentEl = containerEl.createDiv({ cls: "elementCard-settings-content" });

		const sectionEls = new Map<string, HTMLElement>();
		const navButtons = new Map<string, HTMLButtonElement>();

		const setActiveSection = (sectionId: string) => {
			this.activeSectionId = sectionId;
			sectionEls.forEach((el, id) => {
				el.toggleClass("is-active", id === sectionId);
			});
			navButtons.forEach((btn, id) => {
				btn.toggleClass("is-active", id === sectionId);
			});
		};

		// Create navigation buttons and content sections
		sections.forEach((section, index) => {
			// Navigation button
			const button = navEl.createEl("button", {
				cls: "elementCard-settings-nav-btn",
				attr: { type: "button" },
			});
			const iconEl = button.createSpan({ cls: "elementCard-settings-nav-icon" });
			setIcon(iconEl, section.icon);
			button.createSpan({ text: isZh() ? section.labelZh : section.label });
			button.addEventListener("click", () => setActiveSection(section.id));
			navButtons.set(section.id, button);

			// Content section
			const sectionEl = contentEl.createDiv({ cls: "elementCard-settings-section" });
			sectionEls.set(section.id, sectionEl);

			// Restore previously active section (or default to first)
			if (section.id === prevActiveSection || (index === 0 && !sections.find((s) => s.id === prevActiveSection))) {
				setActiveSection(section.id);
			}

			// Render section content
			if (section.id === "homepage") {
				this.renderHomepageSection(sectionEl);
			} else if (section.id === "forceView") {
				this.renderForceViewModeSection(sectionEl);
			} else if (section.id === "cursorPosition") {
				this.renderCursorPositionSection(sectionEl);
			} else if (section.id === "calendar") {
				this.renderCalendarSection(sectionEl);
			}
		});

		// Restore scroll position after re-render (fixes mobile jump-to-top)
		requestAnimationFrame(() => {
			this.containerEl.scrollTop = scrollTop;
		});
	}

	private createSettingsGroup(containerEl: HTMLElement, title?: string): HTMLElement {
		if (title) {
			containerEl.createEl("h2", {
				cls: "elementCard-settings-group-title",
				text: title,
			});
		}
		return containerEl.createDiv({ cls: "elementCard-settings-group" });
	}

	private renderForceViewModeSection(containerEl: HTMLElement): void {
		const basicGroup = this.createSettingsGroup(containerEl);

		// Enable toggle
		new Setting(basicGroup)
			.setName(Locals.get().settings_forceView_enable)
			.setDesc(Locals.get().settings_forceView_enableDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.forceViewMode.enabled)
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		// Description
		const desc = document.createDocumentFragment();
		desc.append(
			Locals.get().settings_forceView_descPart1,
			desc.createEl("code", { text: "obsidianUIMode" }),
			Locals.get().settings_forceView_descPart2,
			desc.createEl("code", { text: "source" }),
			Locals.get().settings_forceView_descPart3,
			desc.createEl("code", { text: "preview" }),
			Locals.get().settings_forceView_descPart4,
			desc.createEl("br"),
			Locals.get().settings_forceView_descPart5,
			desc.createEl("code", { text: "obsidianEditingMode" }),
			Locals.get().settings_forceView_descPart6,
			desc.createEl("code", { text: "live" }),
			Locals.get().settings_forceView_descPart7,
			desc.createEl("code", { text: "source" }),
			Locals.get().settings_forceView_descPart8
		);
		new Setting(basicGroup).setDesc(desc);

		// Ignore opened files
		new Setting(basicGroup)
			.setName(Locals.get().settings_forceView_ignoreOpenedFiles)
			.setDesc(Locals.get().settings_forceView_ignoreOpenedFilesDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.forceViewMode.ignoreOpenFiles)
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.ignoreOpenFiles = value;
						await this.plugin.saveSettings();
					})
			);

		// Ignore force view all
		new Setting(basicGroup)
			.setName(Locals.get().settings_forceView_ignoreForceView)
			.setDesc(Locals.get().settings_forceView_ignoreForceViewDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.forceViewMode.ignoreForceViewAll)
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.ignoreForceViewAll = value;
						await this.plugin.saveSettings();
					})
			);

		// Debounce timeout
		new Setting(basicGroup)
			.setName(Locals.get().settings_forceView_debounceTimeout)
			.setDesc(Locals.get().settings_forceView_debounceTimeoutDesc)
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.forceViewMode.debounceTimeout))
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.debounceTimeout = Number(value) || 0;
						await this.plugin.saveSettings();
					})
			);

		// ===== Folders =====
		const folderGroup = this.createSettingsGroup(containerEl, Locals.get().settings_forceView_foldersHeader);

		const folderDesc = document.createDocumentFragment();
		folderDesc.append(
			Locals.get().settings_forceView_foldersDesc1,
			folderDesc.createEl("br"),
			Locals.get().settings_forceView_foldersDesc2,
			folderDesc.createEl("br"),
			Locals.get().settings_forceView_foldersDesc3
		);
		new Setting(folderGroup).setDesc(folderDesc);

		new Setting(folderGroup).setDesc(Locals.get().settings_forceView_addNewFolder).addButton((button) => {
			button
				.setTooltip(Locals.get().settings_forceView_addAnotherFolder)
				.setButtonText("+")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.forceViewMode.folders.push({ folder: "", viewMode: "" });
					await this.plugin.saveSettings();
					this.display();
				});
		});

		const modes = [
			"default",
			"obsidianUIMode: preview",
			"obsidianUIMode: source",
			"obsidianEditingMode: live",
			"obsidianEditingMode: source",
		];

		this.plugin.settings.forceViewMode.folders.forEach((folderMode, index) => {
			const div = folderGroup.createDiv();
			div.addClass("force-view-mode-div");
			div.addClass("force-view-mode-folder");

			const s = new Setting(folderGroup)
				.addText((cb) => {
					this.decorateForceViewSearchInput(cb.inputEl);
					cb.setPlaceholder(Locals.get().settings_forceView_folderPlaceholder)
						.setValue(folderMode.folder)
						.onChange(async (newFolder) => {
							if (
								newFolder &&
								this.plugin.settings.forceViewMode.folders.some((e) => e.folder === newFolder)
							) {
								console.error(
									"ForceViewMode: This folder already has a rule",
									newFolder
								);
								return;
							}
							this.plugin.settings.forceViewMode.folders[index].folder = newFolder;
							await this.plugin.saveSettings();
						});
					// Inline folder dropdown on focus
					new FolderSuggestDropdown(this.app, cb.inputEl);
				})
				.addDropdown((cb) => {
					modes.forEach((mode) => cb.addOption(mode, mode));
					cb.setValue(folderMode.viewMode || "default").onChange(async (value) => {
						this.plugin.settings.forceViewMode.folders[index].viewMode = value;
						await this.plugin.saveSettings();
					});
				})
				.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip(Locals.get().settings_forceView_delete)
						.onClick(async () => {
							this.plugin.settings.forceViewMode.folders.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});

			s.infoEl.remove();
			div.appendChild(folderGroup.lastChild as Node);
		});

		// ===== Files =====
		const fileGroup = this.createSettingsGroup(containerEl, Locals.get().settings_forceView_filesHeader);

		const filesDesc = document.createDocumentFragment();
		filesDesc.append(
			Locals.get().settings_forceView_filesDesc1,
			filesDesc.createEl("br"),
			Locals.get().settings_forceView_filesDesc2,
			filesDesc.createEl("br"),
			Locals.get().settings_forceView_filesDesc3,
			filesDesc.createEl("br"),
			Locals.get().settings_forceView_filesDesc4
		);
		new Setting(fileGroup).setDesc(filesDesc);

		new Setting(fileGroup).setDesc(Locals.get().settings_forceView_addNewFile).addButton((button) => {
			button
				.setTooltip(Locals.get().settings_forceView_addAnotherFile)
				.setButtonText("+")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.forceViewMode.files.push({ filePattern: "", viewMode: "" });
					await this.plugin.saveSettings();
					this.display();
				});
		});

		this.plugin.settings.forceViewMode.files.forEach((file, index) => {
			const div = fileGroup.createDiv();
			div.addClass("force-view-mode-div");
			div.addClass("force-view-mode-file");

			const s = new Setting(fileGroup)
				.addText((cb) => {
					this.decorateForceViewSearchInput(cb.inputEl);
					cb.setPlaceholder(Locals.get().settings_forceView_filePlaceholder)
						.setValue(file.filePattern)
						.onChange(async (value) => {
							if (
								value &&
								this.plugin.settings.forceViewMode.files.some((e) => e.filePattern === value)
							) {
								console.error("ForceViewMode: Pattern already exists", value);
								return;
							}
							this.plugin.settings.forceViewMode.files[index].filePattern = value;
							await this.plugin.saveSettings();
						});
				})
				.addDropdown((cb) => {
					modes.forEach((mode) => cb.addOption(mode, mode));
					cb.setValue(file.viewMode || "default").onChange(async (value) => {
						this.plugin.settings.forceViewMode.files[index].viewMode = value;
						await this.plugin.saveSettings();
					});
				})
				.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip(Locals.get().settings_forceView_delete)
						.onClick(async () => {
							this.plugin.settings.forceViewMode.files.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});

			s.infoEl.remove();
			div.appendChild(fileGroup.lastChild as Node);
		});
	}

	private decorateForceViewSearchInput(inputEl: HTMLInputElement): void {
		const container = inputEl.parentElement;
		if (!container) {
			return;
		}
		container.addClass("force-view-mode-search-container");
		inputEl.addClass("force-view-mode-search-input");
		if (container.querySelector(".force-view-mode-search-icon")) {
			return;
		}
		const iconEl = container.createSpan({ cls: "force-view-mode-search-icon" });
		setIcon(iconEl, "search");
	}

	private renderCursorPositionSection(containerEl: HTMLElement): void {
		const group = this.createSettingsGroup(containerEl);

		// Enable toggle
		new Setting(group)
			.setName(Locals.get().settings_cursor_enable)
			.setDesc(Locals.get().settings_cursor_enableDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.cursorPosition.enabled)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		// Data file name
		new Setting(group)
			.setName(Locals.get().settings_cursor_dataFileName)
			.setDesc(Locals.get().settings_cursor_dataFileNameDesc)
			.addText((text) =>
				text
					.setPlaceholder(Locals.get().settings_cursor_dataFileNamePlaceholder)
					.setValue(this.plugin.settings.cursorPosition.dbFileName)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.dbFileName = value;
						await this.plugin.saveSettings();
					})
			);

		// Delay after opening
		new Setting(group)
			.setName(Locals.get().settings_cursor_delayAfterOpening)
			.setDesc(Locals.get().settings_cursor_delayAfterOpeningDesc)
			.addSlider((slider) =>
				slider
					.setLimits(0, 300, 10)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.cursorPosition.delayAfterFileOpening)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.delayAfterFileOpening = value;
						await this.plugin.saveSettings();
					})
			);

		// Delay between saving
		new Setting(group)
			.setName(Locals.get().settings_cursor_delayBetweenSaving)
			.setDesc(Locals.get().settings_cursor_delayBetweenSavingDesc)
			.addSlider((slider) =>
				slider
					.setLimits(SAFE_DB_FLUSH_INTERVAL, SAFE_DB_FLUSH_INTERVAL * 10, 100)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.cursorPosition.saveTimer)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.saveTimer = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private renderHomepageSection(containerEl: HTMLElement): void {
		const isZhLang = isZh();
		const hp = this.plugin.settings.homepage;
		const group = this.createSettingsGroup(containerEl);

		new Setting(group)
			.setName(isZhLang ? "启用主页" : "Enable Homepage")
			.setDesc(isZhLang ? "开启主页功能，可在启动时自动打开指定笔记" : "Enable homepage feature to auto-open a specified note on startup")
			.addToggle((toggle) =>
				toggle
					.setValue(hp.enabled)
					.onChange(async (value) => {
						hp.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(isZhLang ? "首页类型" : "Homepage kind")
			.setDesc(isZhLang ? "选择主页类型：指定文件或每日日记" : "Choose homepage type: a specific file or daily note")
			.addDropdown((dropdown) => {
				dropdown.addOption("file", isZhLang ? "指定文件" : "Specific file");
				dropdown.addOption("daily-note", isZhLang ? "日记" : "Daily note");
				dropdown.setValue(hp.kind);
				dropdown.onChange(async (value) => {
					hp.kind = value as any;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (hp.kind === "file") {
			new Setting(group)
				.setName(isZhLang ? "文件路径" : "File path")
				.setDesc(isZhLang ? "输入主页文件的路径（不含 .md 后缀）" : "Enter the path of the homepage file (without .md extension)")
				.addText((text) => {
					text.setPlaceholder("Home").setValue(hp.value);
					new FileSuggestDropdown(this.app, text.inputEl);
					text.onChange(async (value) => {
						hp.value = value;
						await this.plugin.saveSettings();
					});
				});
		} else {
			new Setting(group)
				.setName(isZhLang ? "日记格式" : "Daily note format")
				.setDesc(isZhLang ? "日记文件名格式（由日记插件设置决定）" : "Daily note filename format (determined by Daily Notes plugin settings)")
				.addText((text) => {
					text.inputEl.disabled = true;
					text.setValue(isZhLang ? "使用日记插件设置" : "Use Daily Notes plugin format");
				});
		}

		new Setting(group)
			.setName(isZhLang ? "启动时打开" : "Open on startup")
			.setDesc(isZhLang ? "Obsidian 启动时自动打开主页" : "Automatically open homepage when Obsidian starts")
			.addToggle((toggle) =>
				toggle
					.setValue(hp.openOnStartup)
					.onChange(async (value) => {
						hp.openOnStartup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(isZhLang ? "打开方式" : "Open mode")
			.setDesc(
				isZhLang
					? createFragment((frag) => {
						frag.createSpan({ text: "选择打开主页时的行为。假设工作区当前开着 3 个标签：" });
						frag.createEl("b", { text: "笔记A / 笔记B / 笔记C" });
						frag.createEl("br");
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "替换全部" });
						frag.createSpan({ text: " → 3 个标签全关，只剩主页" });
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "保留" });
						frag.createSpan({ text: " → 标签全保留，如果主页已在其中则跳转，否则不操作（除非当前是空标签）" });
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "替换最后一个" });
						frag.createSpan({ text: " → 变成 笔记A / 笔记B / 主页（笔记C 被替换）" });
					})
					: createFragment((frag) => {
						frag.createSpan({ text: "Choose how to open the homepage. Assuming workspace has 3 tabs open: " });
						frag.createEl("b", { text: "Note A / Note B / Note C" });
						frag.createEl("br");
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "Replace all" });
						frag.createSpan({ text: " → Close all tabs, only homepage remains" });
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "Retain" });
						frag.createSpan({ text: " → Keep all tabs, navigate if already open, otherwise do nothing (unless current tab is empty)" });
						frag.createEl("br");
						frag.createSpan({ text: "• " });
						frag.createEl("b", { text: "Replace last" });
						frag.createSpan({ text: " → Becomes Note A / Note B / Homepage (Note C replaced)" });
					})
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("replace-all", isZhLang ? "替换全部" : "Replace all");
				dropdown.addOption("replace-last", isZhLang ? "替换最后一个" : "Replace last");
				dropdown.addOption("retain", isZhLang ? "保留（已打开则跳转）" : "Retain (navigate if already open)");
				dropdown.setValue(hp.openMode);
				dropdown.onChange(async (value) => {
					hp.openMode = value as any;
					await this.plugin.saveSettings();
				});
			});

		new Setting(group)
			.setName(isZhLang ? "视图模式" : "View mode")
			.setDesc(isZhLang ? "打开主页时使用的视图模式" : "View mode when opening homepage")
			.addDropdown((dropdown) => {
				dropdown.addOption("default", isZhLang ? "默认视图" : "Default");
				dropdown.addOption("reading", isZhLang ? "阅读视图" : "Reading");
				dropdown.addOption("source", isZhLang ? "编辑视图（源码模式）" : "Source");
				dropdown.addOption("live-preview", isZhLang ? "编辑视图（实时预览）" : "Live Preview");
				dropdown.setValue(hp.viewMode);
				dropdown.onChange(async (value) => {
					hp.viewMode = value as any;
					await this.plugin.saveSettings();
				});
			});

		new Setting(group)
			.setName(isZhLang ? "离开后恢复视图" : "Revert view on leave")
			.setDesc(isZhLang ? "离开主页文件时恢复为默认视图模式" : "Revert to default view mode when leaving the homepage file")
			.addToggle((toggle) =>
				toggle
					.setValue(hp.revertView)
					.onChange(async (value) => {
						hp.revertView = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(isZhLang ? "空标签页时自动打开" : "Open when empty tab")
			.setDesc(isZhLang ? "当工作区只有空标签页时自动打开主页" : "Auto-open homepage when workspace only has empty tabs")
			.addToggle((toggle) =>
				toggle
					.setValue(hp.openWhenEmpty)
					.onChange(async (value) => {
						hp.openWhenEmpty = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(isZhLang ? "自动创建文件" : "Auto-create file")
			.setDesc(isZhLang ? "当主页文件不存在时自动创建" : "Auto-create the homepage file if it doesn't exist")
			.addToggle((toggle) =>
				toggle
					.setValue(hp.autoCreate)
					.onChange(async (value) => {
						hp.autoCreate = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private renderCalendarSection(containerEl: HTMLElement): void {
		const isZhLang = isZh();
		const group = this.createSettingsGroup(containerEl);

		// 1. Enable toggle
		new Setting(group)
			.setName(isZhLang ? "启用日历" : "Enable Calendar")
			.setDesc(isZhLang ? "在侧边栏显示日历视图" : "Show calendar view in sidebar")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.calendar.enabled)
					.onChange(async (value) => {
						this.plugin.settings.calendar.enabled = value;
						await this.plugin.saveSettings();
						if (value) {
							this.plugin.activateCalendarView();
						} else {
							this.plugin.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
						}
					})
			);

		// 2. Calendar position
		new Setting(group)
			.setName(isZhLang ? "日历位置" : "Calendar position")
			.setDesc(isZhLang ? "选择日历显示在哪个侧边栏" : "Choose which sidebar to display the calendar")
			.addDropdown((dropdown) => {
				dropdown.addOption("left", isZhLang ? "左侧边栏" : "Left sidebar");
				dropdown.addOption("right", isZhLang ? "右侧边栏" : "Right sidebar");
				dropdown.setValue(this.plugin.settings.calendar.position || "left");
				dropdown.onChange(async (value) => {
					this.plugin.settings.calendar.position = value as "left" | "right";
					await this.plugin.saveSettings();
					this.plugin.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
					if (this.plugin.settings.calendar.enabled) {
						this.plugin.activateCalendarView();
					}
				});
			});

		// 3. Confirm before create
		new Setting(group)
			.setName(isZhLang ? "创建前确认" : "Confirm before creating new note")
			.setDesc(isZhLang ? "创建日记前是否需要确认" : "Show a confirmation modal before creating a new note")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.calendar.shouldConfirmBeforeCreate)
					.onChange(async (value) => {
						this.plugin.settings.calendar.shouldConfirmBeforeCreate = value;
						await this.plugin.saveSettings();
					})
			);

		// 4. Words per dot
		new Setting(group)
			.setName(isZhLang ? "每个圆点代表字数" : "Words per dot")
			.setDesc(isZhLang ? "日历中每个圆点代表的字数" : "How many words should be represented by a single dot?")
			.addText((textfield) => {
				textfield.inputEl.type = "number";
				textfield.setPlaceholder("250");
				textfield.setValue(String(this.plugin.settings.calendar.wordsPerDot));
				textfield.onChange(async (value) => {
					this.plugin.settings.calendar.wordsPerDot = value !== "" ? Number(value) : 250;
					await this.plugin.saveSettings();
				});
			});

		// 5. Week start
		const { moment } = window;
		const localeWeekStartNum = (window as any)._bundledLocaleWeekSpec?.dow || 0;
		const localeWeekStart = moment.weekdays()[localeWeekStartNum];
		const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
		const weekdayLabels: Record<string, string> = {
			monday: moment.weekdays()[1],
			tuesday: moment.weekdays()[2],
			wednesday: moment.weekdays()[3],
			thursday: moment.weekdays()[4],
			friday: moment.weekdays()[5],
			saturday: moment.weekdays()[6],
			sunday: moment.weekdays()[0],
		};

		new Setting(group)
			.setName(isZhLang ? "星期起始日" : "Start week on")
			.setDesc(isZhLang ? "选择一周的起始日" : "Choose what day of the week to start")
			.addDropdown((dropdown) => {
				dropdown.addOption("locale", isZhLang ? `系统默认 (${localeWeekStart})` : `Locale default (${localeWeekStart})`);
				weekdays.forEach((key: string) => {
					dropdown.addOption(key, weekdayLabels[key]);
				});
				dropdown.setValue(this.plugin.settings.calendar.weekStart);
				dropdown.onChange(async (value) => {
					this.plugin.settings.calendar.weekStart = value as any;
					await this.plugin.saveSettings();
				});
			});

		// 6. Highlight today
		new Setting(group)
			.setName(isZhLang ? "今日高亮" : "Highlight today")
			.setDesc(isZhLang ? "用背景颜色和加粗文本高亮今天的日期" : "Highlight today's date with a background color and bold text")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.calendar.highlightToday !== false)
					.onChange(async (value) => {
						this.plugin.settings.calendar.highlightToday = value;
						await this.plugin.saveSettings();
					})
			);

	}
}
