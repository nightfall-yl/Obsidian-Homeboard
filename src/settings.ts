import { App, PluginSettingTab, Setting, setIcon, getLanguage, TFolder } from "obsidian";
import HomepageComponentPlugin from "./main";
import {
	DEFAULT_HOMEPAGE_SETTINGS,
	HomepageComponentSettings,
	ForceViewModeSettings,
	CursorPositionSettings,
	SAFE_DB_FLUSH_INTERVAL,
} from "./homepageTypes";
import { convertToRGBA } from "./colorUtils";

export function applyHomepageStyles(settings: HomepageComponentSettings) {
	const rootStyle = document.documentElement.style;
	rootStyle.setProperty("--homepage-card-padding", `${settings.cardPadding}px`);
	rootStyle.setProperty("--homepage-card-radius", `${settings.cardBorderRadius}px`);
	rootStyle.setProperty(
		"--homepage-card-border-color",
		convertToRGBA(settings.cardBorderColor, settings.cardBorderTransparency)
	);
	rootStyle.setProperty("--homepage-resizer-width", `${settings.resizerWidth}px`);
	rootStyle.setProperty(
		"--homepage-resizer-color",
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

// ===== i18n for Force View Mode =====
type ForceViewLocaleKey =
	| "enable"
	| "enableDesc"
	| "descPart1"
	| "descPart2"
	| "descPart3"
	| "descPart4"
	| "descPart5"
	| "descPart6"
	| "descPart7"
	| "descPart8"
	| "ignoreOpenedFiles"
	| "ignoreOpenedFilesDesc"
	| "ignoreForceView"
	| "ignoreForceViewDesc"
	| "debounceTimeout"
	| "debounceTimeoutDesc"
	| "foldersHeader"
	| "foldersDesc1"
	| "foldersDesc2"
	| "foldersDesc3"
	| "addNewFolder"
	| "addAnotherFolder"
	| "folderPlaceholder"
	| "delete"
	| "filesHeader"
	| "filesDesc1"
	| "filesDesc2"
	| "filesDesc3"
	| "filesDesc4"
	| "addNewFile"
	| "addAnotherFile"
	| "filePlaceholder";

const forceViewEn: Record<ForceViewLocaleKey, string> = {
	enable: "Enable Force View Mode",
	enableDesc: "Automatically set view mode based on frontmatter or folder/file rules",
	descPart1: "Changing the view mode can be done through the key ",
	descPart2: ", which can have the value ",
	descPart3: " or ",
	descPart4: ".",
	descPart5: "Changing the editing mode happens by declaring the key ",
	descPart6: "; it takes ",
	descPart7: " or ",
	descPart8: " as value.",
	ignoreOpenedFiles: "Ignore opened files",
	ignoreOpenedFilesDesc: "Never change the view mode on a note which was already open.",
	ignoreForceView: "Ignore force view when not in frontmatter",
	ignoreForceViewDesc: "Never change the view mode on a note that was opened from another one in a certain view mode",
	debounceTimeout: "Debounce timeout in milliseconds",
	debounceTimeoutDesc:
		'Debounce timeout is the time in milliseconds after which the view mode is set. Set "0" to disable debouncing (default value is "300"). If you experience issues with the plugin, try increasing this value.',
	foldersHeader: "Folders",
	foldersDesc1: "Specify a view mode for notes in a given folder.",
	foldersDesc2:
		"Note that this will force the view mode on all the notes in the folder, even if they have a different view mode set in their frontmatter.",
	foldersDesc3:
		"Precedence is from bottom (highest) to top (lowest), so if you have child folders specified, make sure to put them below their parent folder.",
	addNewFolder: "Add new folder",
	addAnotherFolder: "Add another folder to the list",
	folderPlaceholder: "Example: folder1/templates",
	delete: "Delete",
	filesHeader: "Files",
	filesDesc1:
		'Specify a view mode for notes with specific patterns (regular expression; example " - All$" for all notes ending with " - All" or "1900-01" for all daily notes starting with "1900-01"',
	filesDesc2:
		"Note that this will force the view mode, even if it have a different view mode set in its frontmatter.",
	filesDesc3: "Precedence is from bottom (highest) to top (lowest).",
	filesDesc4:
		"Notice that configuring a file pattern will override the folder configuration for the same file.",
	addNewFile: "Add new file",
	addAnotherFile: "Add another file to the list",
	filePlaceholder: 'Example: " - All$" or "1900-01")',
};

const forceViewZhCN: Record<ForceViewLocaleKey, string> = {
	enable: "启用强制视图模式",
	enableDesc: "根据 frontmatter 或文件夹/文件规则自动设置视图模式",
	descPart1: "可以通过键 ",
	descPart2: " 来更改视图模式，其值可以是 ",
	descPart3: " 或 ",
	descPart4: "。",
	descPart5: "通过声明键 ",
	descPart6: " 来更改编辑模式；其值可以是 ",
	descPart7: " 或 ",
	descPart8: "。",
	ignoreOpenedFiles: "忽略已打开的文件",
	ignoreOpenedFilesDesc: "不要更改已打开笔记的视图模式。",
	ignoreForceView: "未在 frontmatter 中指定时忽略强制视图",
	ignoreForceViewDesc: "不要更改从其他视图模式中打开的笔记的视图模式。",
	debounceTimeout: "防抖超时（毫秒）",
	debounceTimeoutDesc:
		'防抖超时是指设置视图模式之前的等待时间（毫秒）。设为 "0" 可禁用防抖（默认值为 "300"）。如果遇到问题，请尝试增大此值。',
	foldersHeader: "文件夹",
	foldersDesc1: "为指定文件夹中的笔记设定视图模式。",
	foldersDesc2:
		"注意：这将强制该文件夹中所有笔记使用指定的视图模式，即使笔记的 frontmatter 中设置了不同的视图模式。",
	foldersDesc3: "优先级从下到上递增（最下面的优先级最高），因此如果指定了子文件夹，请确保将其放在父文件夹下方。",
	addNewFolder: "添加新文件夹",
	addAnotherFolder: "添加另一个文件夹到列表",
	folderPlaceholder: "示例：folder1/templates",
	delete: "删除",
	filesHeader: "文件",
	filesDesc1:
		"为匹配特定模式（正则表达式）的笔记设定视图模式，例如 \" - All$\" 匹配所有以 \" - All\" 结尾的笔记，\"1900-01\" 匹配以 \"1900-01\" 开头的日记。",
	filesDesc2: "注意：这将强制使用指定的视图模式，即使笔记的 frontmatter 中设置了不同的视图模式。",
	filesDesc3: "优先级从下到上递增（最下面的优先级最高）。",
	filesDesc4: "请注意，文件模式的配置将覆盖同一文件的文件夹配置。",
	addNewFile: "添加新文件",
	addAnotherFile: "添加另一个文件到列表",
	filePlaceholder: "示例：\" - All$\" 或 \"1900-01\")",
};

// ===== i18n for Cursor Position =====
type CursorLocaleKey =
	| "enable"
	| "enableDesc"
	| "dataFileName"
	| "dataFileNameDesc"
	| "dataFileNamePlaceholder"
	| "delayAfterOpening"
	| "delayAfterOpeningDesc"
	| "delayBetweenSaving"
	| "delayBetweenSavingDesc";

const cursorEn: Record<CursorLocaleKey, string> = {
	enable: "Enable Remember Cursor Position",
	enableDesc: "Remember and restore cursor position and scroll position for each file",
	dataFileName: "Data file name",
	dataFileNameDesc: "Save positions to this file",
	dataFileNamePlaceholder: "Example: cursor-positions.json",
	delayAfterOpening: "Delay after opening a new note",
	delayAfterOpeningDesc:
		"This plugin shouldn't scroll if you used a link to the note header like [link](note.md#header). " +
		"If it did, then increase the delay until everything works. If you are not using links to page sections, " +
		"set the delay to zero (slider to the left). Slider values: 0-300 ms (default value: 100 ms).",
	delayBetweenSaving: "Delay between saving the cursor position to file",
	delayBetweenSavingDesc:
		"Useful for multi-device users. If you don't want to wait until closing Obsidian to the cursor position been saved.",
};

const cursorZhCN: Record<CursorLocaleKey, string> = {
	enable: "启用记住光标位置",
	enableDesc: "记住并恢复每个文件的光标位置和滚动位置",
	dataFileName: "数据文件名",
	dataFileNameDesc: "将位置信息保存到此文件",
	dataFileNamePlaceholder: "例如：cursor-positions.json",
	delayAfterOpening: "打开新笔记后的延迟",
	delayAfterOpeningDesc:
		"如果你使用了指向笔记标题的链接（如 [链接](笔记.md#标题)），本插件不应滚动页面。" +
		"如果出现此问题，请增加延迟时间。如果你不使用指向页面内章节的链接，可将延迟设为零（滑块调至最左）。" +
		"滑块范围：0-300 毫秒（默认值：100 毫秒）。",
	delayBetweenSaving: "光标位置保存到文件的间隔",
	delayBetweenSavingDesc:
		"适用于多设备用户。如果你不想等到关闭 Obsidian 才保存光标位置，可以缩短此间隔。",
};

function getLocale(): string {
	const lang = getLanguage();
	return lang || "en";
}

function isZh(): boolean {
	const locale = getLocale();
	return locale.startsWith("zh");
}

function tForceView(key: ForceViewLocaleKey): string {
	return isZh() ? forceViewZhCN[key] : forceViewEn[key];
}

function tCursor(key: CursorLocaleKey): string {
	return isZh() ? cursorZhCN[key] : cursorEn[key];
}

export class FolderSuggestDropdown {
	private containerEl: HTMLElement;
	private dropdownEl: HTMLDivElement | null = null;
	private listEl: HTMLDivElement | null = null;
	private inputEl: HTMLInputElement;
	private allFolders: TFolder[];
	private onSelect: (path: string) => void;
	private activeIndex = -1;
	private readonly handleOutsideClick = (event: MouseEvent) => {
		const target = event.target as Node | null;
		if (!target) {
			return;
		}
		if (this.dropdownEl?.contains(target) || this.inputEl.contains(target)) {
			return;
		}
		this.hide();
	};

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		onSelect: (path: string) => void
	) {
		this.inputEl = inputEl;
		this.containerEl = inputEl.closest(".setting-item") || inputEl.parentElement!;
		this.allFolders = app.vault.getAllLoadedFiles().filter((f) => f instanceof TFolder) as TFolder[];
		this.onSelect = onSelect;

		this.inputEl.addEventListener("focus", () => {
			if (!this.dropdownEl) this.show();
			this.renderItems(this.inputEl.value);
		});
		this.inputEl.addEventListener("input", () => {
			if (!this.dropdownEl) this.show();
			this.renderItems(this.inputEl.value);
		});
		this.inputEl.addEventListener("keydown", (evt) => this.onKeydown(evt, this.listEl || undefined));
	}

	private highlightItem(items: NodeListOf<Element>) {
		items.forEach((el, i) => el.toggleClass("is-active", i === this.activeIndex));
		if (this.activeIndex >= 0) {
			(items[this.activeIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
		}
	}

	show() {
		this.hide();

		if (this.allFolders.length === 0) return;
		const host = this.inputEl.parentElement ?? this.containerEl;
		this.dropdownEl = host.createDiv({
			cls: "folder-suggest-dropdown folder-suggest-dropdown--inline",
		});
		this.listEl = this.dropdownEl.createDiv({ cls: "folder-suggest-list" });
		this.renderItems(this.inputEl.value);
		document.addEventListener("mousedown", this.handleOutsideClick, true);
	}

	private renderItems(query: string) {
		if (!this.listEl) {
			return;
		}
		this.listEl.empty();
		const q = query.toLowerCase();
		const filtered = q
			? this.allFolders.filter((f) => f.path.toLowerCase().includes(q))
			: this.allFolders;
		this.activeIndex = -1;
		if (filtered.length === 0) {
			this.listEl.createDiv({ cls: "folder-suggest-empty", text: "无匹配文件夹" });
			return;
		}
		filtered.forEach((folder) => {
			const item = this.listEl!.createDiv({ cls: "suggest-item" });
			item.createDiv({ cls: "suggest-icon" }).innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
			item.createDiv({ cls: "suggest-text", text: folder.path });
			item.addEventListener("mousedown", (evt) => {
				evt.preventDefault();
				this.inputEl.value = folder.path;
				this.onSelect(folder.path);
				this.hide();
			});
		});
	}

	private onKeydown(evt: KeyboardEvent, listEl?: HTMLElement) {
		const items = listEl?.querySelectorAll(".suggest-item");
		if (!items || !items.length) return;
		if (evt.key === "ArrowDown") {
			evt.preventDefault();
			evt.stopPropagation();
			this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
			this.highlightItem(items);
		} else if (evt.key === "ArrowUp") {
			evt.preventDefault();
			evt.stopPropagation();
			this.activeIndex = Math.max(this.activeIndex - 1, 0);
			this.highlightItem(items);
		} else if (evt.key === "Enter" && this.activeIndex >= 0) {
			evt.preventDefault();
			evt.stopPropagation();
			(items[this.activeIndex] as HTMLElement).click();
		} else if (evt.key === "Escape") {
			evt.stopPropagation();
			this.hide();
		}
	}

	hide() {
		if (this.dropdownEl) {
			this.dropdownEl.remove();
			this.dropdownEl = null;
			this.listEl = null;
		}
		document.removeEventListener("mousedown", this.handleOutsideClick, true);
		this.activeIndex = -1;
	}

	destroy() {
		this.hide();
	}
}

export class HomepageSettingTab extends PluginSettingTab {
	plugin: HomepageComponentPlugin;

	constructor(app: App, plugin: HomepageComponentPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		// Save scroll position before re-render (fixes mobile jump-to-top)
		const scrollTop = this.containerEl.scrollTop;

		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("homeboard-settings-root");

		// Define navigation sections
		const sections: SettingsSection[] = [
			{ id: "forceView", label: "Force View Mode", labelZh: "视图模式", icon: "eye" },
			{ id: "cursorPosition", label: "Cursor Position", labelZh: "光标位置", icon: "mouse-pointer" },
		];

		// Create layout: nav + content
		const navEl = containerEl.createDiv({ cls: "homeboard-settings-nav" });
		const contentEl = containerEl.createDiv({ cls: "homeboard-settings-content" });

		const sectionEls = new Map<string, HTMLElement>();
		const navButtons = new Map<string, HTMLButtonElement>();

		const setActiveSection = (sectionId: string) => {
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
				cls: "homeboard-settings-nav-btn",
				attr: { type: "button" },
			});
			const iconEl = button.createSpan({ cls: "homeboard-settings-nav-icon" });
			setIcon(iconEl, section.icon);
			button.createSpan({ text: isZh() ? section.labelZh : section.label });
			button.addEventListener("click", () => setActiveSection(section.id));
			navButtons.set(section.id, button);

			// Content section
			const sectionEl = contentEl.createDiv({ cls: "homeboard-settings-section" });
			sectionEls.set(section.id, sectionEl);

			// Set first section as active
			if (index === 0) {
				sectionEl.addClass("is-active");
				button.addClass("is-active");
			}

			// Render section content
			if (section.id === "forceView") {
				this.renderForceViewModeSection(sectionEl);
			} else if (section.id === "cursorPosition") {
				this.renderCursorPositionSection(sectionEl);
			}
		});

		// Restore scroll position after re-render (fixes mobile jump-to-top)
		requestAnimationFrame(() => {
			this.containerEl.scrollTop = scrollTop;
		});
	}

	private renderForceViewModeSection(containerEl: HTMLElement): void {
		// Enable toggle
		new Setting(containerEl)
			.setName(tForceView("enable"))
			.setDesc(tForceView("enableDesc"))
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
			tForceView("descPart1"),
			desc.createEl("code", { text: "obsidianUIMode" }),
			tForceView("descPart2"),
			desc.createEl("code", { text: "source" }),
			tForceView("descPart3"),
			desc.createEl("code", { text: "preview" }),
			tForceView("descPart4"),
			desc.createEl("br"),
			tForceView("descPart5"),
			desc.createEl("code", { text: "obsidianEditingMode" }),
			tForceView("descPart6"),
			desc.createEl("code", { text: "live" }),
			tForceView("descPart7"),
			desc.createEl("code", { text: "source" }),
			tForceView("descPart8")
		);
		new Setting(containerEl).setDesc(desc);

		// Ignore opened files
		new Setting(containerEl)
			.setName(tForceView("ignoreOpenedFiles"))
			.setDesc(tForceView("ignoreOpenedFilesDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.forceViewMode.ignoreOpenFiles)
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.ignoreOpenFiles = value;
						await this.plugin.saveSettings();
					})
			);

		// Ignore force view all
		new Setting(containerEl)
			.setName(tForceView("ignoreForceView"))
			.setDesc(tForceView("ignoreForceViewDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.forceViewMode.ignoreForceViewAll)
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.ignoreForceViewAll = value;
						await this.plugin.saveSettings();
					})
			);

		// Debounce timeout
		new Setting(containerEl)
			.setName(tForceView("debounceTimeout"))
			.setDesc(tForceView("debounceTimeoutDesc"))
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.forceViewMode.debounceTimeout))
					.onChange(async (value) => {
						this.plugin.settings.forceViewMode.debounceTimeout = Number(value) || 0;
						await this.plugin.saveSettings();
					})
			);

		// ===== Folders =====
		containerEl.createEl("h2", { text: tForceView("foldersHeader") });

		const folderDesc = document.createDocumentFragment();
		folderDesc.append(
			tForceView("foldersDesc1"),
			folderDesc.createEl("br"),
			tForceView("foldersDesc2"),
			folderDesc.createEl("br"),
			tForceView("foldersDesc3")
		);
		new Setting(containerEl).setDesc(folderDesc);

		new Setting(containerEl).setDesc(tForceView("addNewFolder")).addButton((button) => {
			button
				.setTooltip(tForceView("addAnotherFolder"))
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
			const div = containerEl.createDiv();
			div.addClass("force-view-mode-div");
			div.addClass("force-view-mode-folder");

			const s = new Setting(containerEl)
				.addText((cb) => {
					this.decorateForceViewSearchInput(cb.inputEl);
					cb.setPlaceholder(tForceView("folderPlaceholder"))
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
					new FolderSuggestDropdown(this.app, cb.inputEl, (path) => {
						cb.setValue(path);
						this.plugin.settings.forceViewMode.folders[index].folder = path;
						this.plugin.saveSettings();
					});
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
						.setTooltip(tForceView("delete"))
						.onClick(async () => {
							this.plugin.settings.forceViewMode.folders.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});

			s.infoEl.remove();
			div.appendChild(containerEl.lastChild as Node);
		});

		// ===== Files =====
		containerEl.createEl("h2", { text: tForceView("filesHeader") });

		const filesDesc = document.createDocumentFragment();
		filesDesc.append(
			tForceView("filesDesc1"),
			filesDesc.createEl("br"),
			tForceView("filesDesc2"),
			filesDesc.createEl("br"),
			tForceView("filesDesc3"),
			filesDesc.createEl("br"),
			tForceView("filesDesc4")
		);
		new Setting(containerEl).setDesc(filesDesc);

		new Setting(containerEl).setDesc(tForceView("addNewFile")).addButton((button) => {
			button
				.setTooltip(tForceView("addAnotherFile"))
				.setButtonText("+")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.forceViewMode.files.push({ filePattern: "", viewMode: "" });
					await this.plugin.saveSettings();
					this.display();
				});
		});

		this.plugin.settings.forceViewMode.files.forEach((file, index) => {
			const div = containerEl.createDiv();
			div.addClass("force-view-mode-div");
			div.addClass("force-view-mode-file");

			const s = new Setting(containerEl)
				.addText((cb) => {
					this.decorateForceViewSearchInput(cb.inputEl);
					cb.setPlaceholder(tForceView("filePlaceholder"))
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
						.setTooltip(tForceView("delete"))
						.onClick(async () => {
							this.plugin.settings.forceViewMode.files.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});

			s.infoEl.remove();
			div.appendChild(containerEl.lastChild as Node);
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
		// Enable toggle
		new Setting(containerEl)
			.setName(tCursor("enable"))
			.setDesc(tCursor("enableDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.cursorPosition.enabled)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		// Data file name
		new Setting(containerEl)
			.setName(tCursor("dataFileName"))
			.setDesc(tCursor("dataFileNameDesc"))
			.addText((text) =>
				text
					.setPlaceholder(tCursor("dataFileNamePlaceholder"))
					.setValue(this.plugin.settings.cursorPosition.dbFileName)
					.onChange(async (value) => {
						this.plugin.settings.cursorPosition.dbFileName = value;
						await this.plugin.saveSettings();
					})
			);

		// Delay after opening
		new Setting(containerEl)
			.setName(tCursor("delayAfterOpening"))
			.setDesc(tCursor("delayAfterOpeningDesc"))
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
		new Setting(containerEl)
			.setName(tCursor("delayBetweenSaving"))
			.setDesc(tCursor("delayBetweenSavingDesc"))
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
}
