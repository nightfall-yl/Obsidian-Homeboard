import { App, PluginSettingTab, Setting, setIcon, TFolder, TAbstractFile, TFile, AbstractInputSuggest } from "obsidian";
import ElementsPlugin from "./main";
import {
	ElementsSettings,
	ForceViewModeSettings,
	CursorPositionSettings,
	SAFE_DB_FLUSH_INTERVAL,
	CalendarPluginSettings,
} from "./types";
import { VIEW_TYPE_CALENDAR } from "./calendar/constants";

import { Locals } from "src/i18/messages";

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

export class ElementsSettingTab extends PluginSettingTab {
	plugin: ElementsPlugin;
	private activeSectionId: string = "homepage";

	constructor(app: App, plugin: ElementsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		// Save scroll position and active section before re-render
		const scrollTop = this.containerEl.scrollTop;
		const prevActiveSection = this.activeSectionId;

		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("element-settings-root");

		// Define navigation sections
			const sections: SettingsSection[] = [
			{ id: "homepage", label: Locals.get().settings_nav_homepage, icon: "home" },
			{ id: "calendar", label: Locals.get().settings_nav_calendar, icon: "calendar-days" },
			{ id: "forceView", label: Locals.get().settings_nav_forceView, icon: "eye" },
			{ id: "cursorPosition", label: Locals.get().settings_nav_cursorPosition, icon: "mouse-pointer" },
		];

		// Create layout: nav + content
		const navEl = containerEl.createDiv({ cls: "element-settings-nav" });
		const contentEl = containerEl.createDiv({ cls: "element-settings-content" });

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
				cls: "setting-item-heading element-settings-nav-btn",
				attr: { type: "button" },
			});
			const iconEl = button.createSpan({ cls: "element-settings-nav-icon" });
			setIcon(iconEl, section.icon);
			button.createSpan({ text: section.label });
			button.addEventListener("click", () => setActiveSection(section.id));
			navButtons.set(section.id, button);

			// Content section
			const sectionEl = contentEl.createDiv({ cls: "element-settings-section" });
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
			containerEl.createEl("div", {
				cls: "setting-item-heading element-settings-group-title",
				text: title,
			});
		}
		return containerEl.createDiv({ cls: "element-settings-group" });
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
		const t = Locals.get();
		const hp = this.plugin.settings.homepage;
		const group = this.createSettingsGroup(containerEl);

		new Setting(group)
			.setName(t.settings_homepage_enable)
			.setDesc(t.settings_homepage_enableDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(hp.enabled)
					.onChange(async (value) => {
						hp.enabled = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(t.settings_homepage_kind)
			.setDesc(t.settings_homepage_kindDesc)
			.addDropdown((dropdown) => {
				dropdown.addOption("file", t.settings_homepage_kindFile);
				dropdown.addOption("daily-note", t.settings_homepage_kindDailyNote);
				dropdown.setValue(hp.kind);
				dropdown.onChange(async (value) => {
					hp.kind = value as any;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (hp.kind === "file") {
			new Setting(group)
				.setName(t.settings_homepage_filePath)
				.setDesc(t.settings_homepage_filePathDesc)
				.addText((text) => {
					text.setPlaceholder(t.settings_homepage_filePath).setValue(hp.value);
					new FileSuggestDropdown(this.app, text.inputEl);
					text.onChange(async (value) => {
						hp.value = value;
						await this.plugin.saveSettings();
					});
				});
		} else {
			new Setting(group)
				.setName(t.settings_homepage_dailyNoteFormat)
				.setDesc(t.settings_homepage_dailyNoteFormatDesc)
				.addText((text) => {
					text.inputEl.disabled = true;
					text.setValue(t.settings_homepage_dailyNoteFormatValue);
				});
		}

		new Setting(group)
			.setName(t.settings_homepage_openOnStartup)
			.setDesc(t.settings_homepage_openOnStartupDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(hp.openOnStartup)
					.onChange(async (value) => {
						hp.openOnStartup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(t.settings_homepage_openMode)
			.setDesc(
				createFragment((frag) => {
					frag.createSpan({ text: t.settings_homepage_openModeDescIntro });
					frag.createEl("b", { text: t.settings_homepage_openModeDescExample });
					frag.createEl("br");
					frag.createEl("br");
					frag.createSpan({ text: "• " });
					frag.createEl("b", { text: t.settings_homepage_openModeReplaceAll });
					frag.createSpan({ text: ` → ${t.settings_homepage_openModeReplaceAllDesc}` });
					frag.createEl("br");
					frag.createSpan({ text: "• " });
					frag.createEl("b", { text: t.settings_homepage_openModeRetain });
					frag.createSpan({ text: ` → ${t.settings_homepage_openModeRetainDesc}` });
					frag.createEl("br");
					frag.createSpan({ text: "• " });
					frag.createEl("b", { text: t.settings_homepage_openModeReplaceLast });
					frag.createSpan({ text: ` → ${t.settings_homepage_openModeReplaceLastDesc}` });
				})
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("replace-all", t.settings_homepage_openModeReplaceAll);
				dropdown.addOption("retain", t.settings_homepage_openModeRetain);
				dropdown.addOption("replace-last", t.settings_homepage_openModeReplaceLast);
				dropdown.setValue(hp.openMode);
				dropdown.onChange(async (value) => {
					hp.openMode = value as any;
					await this.plugin.saveSettings();
				});
			});

		new Setting(group)
			.setName(t.settings_homepage_viewMode)
			.setDesc(t.settings_homepage_viewModeDesc)
			.addDropdown((dropdown) => {
				dropdown.addOption("default", t.settings_homepage_viewModeDefault);
				dropdown.addOption("reading", t.settings_homepage_viewModeReading);
				dropdown.addOption("source", t.settings_homepage_viewModeSource);
				dropdown.addOption("live-preview", t.settings_homepage_viewModeLivePreview);
				dropdown.setValue(hp.viewMode);
				dropdown.onChange(async (value) => {
					hp.viewMode = value as any;
					await this.plugin.saveSettings();
				});
			});

		new Setting(group)
			.setName(t.settings_homepage_revertView)
			.setDesc(t.settings_homepage_revertViewDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(hp.revertView)
					.onChange(async (value) => {
						hp.revertView = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(t.settings_homepage_openWhenEmpty)
			.setDesc(t.settings_homepage_openWhenEmptyDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(hp.openWhenEmpty)
					.onChange(async (value) => {
						hp.openWhenEmpty = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(group)
			.setName(t.settings_homepage_autoCreate)
			.setDesc(t.settings_homepage_autoCreateDesc)
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
		const t = Locals.get();
		const group = this.createSettingsGroup(containerEl);

		// 1. Enable toggle
		new Setting(group)
			.setName(t.settings_cal_enable)
			.setDesc(t.settings_cal_enableDesc)
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
			.setName(t.settings_cal_position)
			.setDesc(t.settings_cal_positionDesc)
			.addDropdown((dropdown) => {
				dropdown.addOption("left", t.settings_cal_left);
				dropdown.addOption("right", t.settings_cal_right);
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
			.setName(t.settings_cal_confirmCreate)
			.setDesc(t.settings_cal_confirmCreateDesc)
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
			.setName(t.settings_cal_wordsPerDot)
			.setDesc(t.settings_cal_wordsPerDotDesc)
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
			.setName(t.settings_cal_weekStart)
			.setDesc(t.settings_cal_weekStartDesc)
			.addDropdown((dropdown) => {
				dropdown.addOption("locale", `${t.settings_cal_localeDefault} (${localeWeekStart})`);
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
			.setName(t.settings_cal_highlightToday)
			.setDesc(t.settings_cal_highlightTodayDesc)
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

// ===== Navigation Section Type =====
type SettingsSection = {
	id: string;
	label: string;
	icon: string;
};
