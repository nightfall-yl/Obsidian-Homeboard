import { App, Modal, Platform, MarkdownView, parseYaml, stringifyYaml, Notice, Setting, SettingGroup } from "obsidian";
import { YamlGraphConfig, DateRangeType } from "src/processor/types";
import { YamlConfigReconciler } from "src/processor/yamlConfigReconciler";
import { Locals, isZh } from "src/i18/messages";
import { getGraphOptions, getStartOfWeekOptions, getCellShapes, getDateTypeOptions, getDataSourceTypes, countFieldTypes, dateFieldTypes } from "./options";
import { getThemes, getThemeSwatches, matchThemeByRules } from "./GraphTheme";
import { CellStyleRule } from "src/types";
import { DataSourceType } from "src/query/types";

export class HeatmapCreateModal extends Modal {
	private config: YamlGraphConfig;
	private onSave?: (content: string) => void;
	private activeTab: number = 0;
	private ignoreLanguagePrefix: boolean = false;

	constructor(app: App, originalConfigContent?: string, onSave?: (content: string) => void) {
		super(app);
		this.onSave = onSave;

		let yamlConfig: YamlGraphConfig = new YamlGraphConfig();
		if (originalConfigContent && originalConfigContent.trim() !== "") {
			try {
				yamlConfig = parseYaml(originalConfigContent) as YamlGraphConfig;
				if (!yamlConfig) yamlConfig = new YamlGraphConfig();
			} catch {
				yamlConfig = new YamlGraphConfig();
			}
		} else {
			const selectionConfig = this.parseFromSelection();
			if (selectionConfig) {
				yamlConfig = selectionConfig;
				this.ignoreLanguagePrefix = true;
			}
		}

		if (!yamlConfig) {
			yamlConfig = new YamlGraphConfig();
		}

		yamlConfig = YamlConfigReconciler.reconcile(yamlConfig);
		this.config = yamlConfig;
	}

	onOpen() {
		this.modalEl.addClass("heatmap-modal-container");
		this.render();
	}

	onClose() {
		this.contentEl.empty();
	}

	private render() {
		const { contentEl } = this;
		const local = Locals.get();
		contentEl.empty();
		contentEl.addClass("heatmap-setting-modal");
		contentEl.toggleClass("is-mobile", Platform.isMobile);

		const navEl = contentEl.createDiv({ cls: "heatmap-setting-nav" });
		const tabs = [
			{ label: local.form_basic_settings, id: "basic" },
			{ label: local.form_style_settings, id: "style" },
		];
		tabs.forEach((tab, i) => {
			const btn = navEl.createEl("button", {
				cls: "setting-item-heading heatmap-setting-nav-btn",
				text: tab.label,
			});
			btn.toggleClass("is-active", i === this.activeTab);
			btn.addEventListener("click", () => {
				this.activeTab = i;
				this.render();
			});
		});

		const content = contentEl.createDiv({ cls: "heatmap-setting-content" });
		if (this.activeTab === 0) {
			this.renderBasicTab(content);
		} else {
			this.renderStyleTab(content);
		}

		const footerEl = contentEl.createDiv({ cls: "heatmap-modal-footer" });
		const cancelBtn = footerEl.createEl("button", {
			text: local.cancel,
			cls: "heatmap-modal-footer__btn heatmap-modal-footer__btn--cancel",
		});
		cancelBtn.addEventListener("click", () => this.close());

		const confirmBtn = footerEl.createEl("button", {
			text: local.confirm,
			cls: "heatmap-modal-footer__btn heatmap-modal-footer__btn--confirm",
		});
		confirmBtn.addEventListener("click", () => {
			this.doSave();
		});

	}

	private doSave() {
		try {
			const yamlStr = stringifyYaml(this.config);
			if (this.onSave) {
				this.onSave(yamlStr);
			} else {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!markdownView) {
					new Notice(Locals.get().notice_heatmap_no_markdown_view);
					return;
				}
				const editor = markdownView.editor;
				this.close();

				if (this.ignoreLanguagePrefix) {
					editor.replaceSelection(yamlStr);
				} else {
					const codeblock = `\`\`\`heatmap\n${yamlStr}\n\`\`\`\n`;
					editor.replaceSelection(codeblock);
				}
			}
			this.close();
		} catch (e) {
			new Notice("保存配置失败: " + (e as Error).message);
		}
	}

	private parseFromSelection(): YamlGraphConfig | null {
		try {
			const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!markdownView) return null;
			const editor = markdownView.editor;
			const selection = editor.getSelection();
			if (selection && selection.trim() !== "") {
				return parseYaml(selection) as YamlGraphConfig;
			}
			return null;
		} catch {
			return null;
		}
	}

	private renderBasicTab(container: HTMLElement) {
		const local = Locals.get();
		const graphOptions = getGraphOptions();
		const dateTypeOptions = getDateTypeOptions();

		new SettingGroup(container)
			.setHeading(local.form_title)
			.addSetting((s) => s
				.setName(local.form_title)
				.addText((text) => text
					.setPlaceholder(local.form_title_placeholder)
					.setValue(this.config.title ?? "")
					.onChange((v) => { this.config.title = v; })
				)
			)
			.addSetting((s) => s
				.setName(local.form_title_font_size_label)
				.addSlider((slider) => slider
					.setLimits(1, 128, 1)
					.setValue(this.parsePxNumber(this.config.titleStyle?.fontSize, 14))
					.setDynamicTooltip()
					.onChange((v) => {
						this.config.titleStyle = { ...this.config.titleStyle, fontSize: v + "px" };
					})
				)
			)
			.addSetting((s) => s
				.setName(local.form_title_align_label)
				.addDropdown((dd) => dd
					.addOption("left", "Left")
					.addOption("center", "Center")
					.addOption("right", "Right")
					.setValue(this.config.titleStyle?.textAlign ?? "left")
					.onChange((v) => {
						this.config.titleStyle = { ...this.config.titleStyle, textAlign: v as CanvasTextAlign };
					})
				)
			);

		const basicGroup = new SettingGroup(container)
			.setHeading(local.form_graph_type)
			.addSetting((s) => s
				.setName(local.form_graph_type)
				.addDropdown((dd) => {
					graphOptions.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(this.config.graphType ?? "default");
					dd.onChange((v) => { this.config.graphType = v; });
				})
			)
			.addSetting((s) => s
				.setName(local.form_date_range)
				.addDropdown((dd) => {
					dateTypeOptions.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(this.config.dateRangeType ?? "LATEST_DAYS");
					dd.onChange((v) => {
						this.config.dateRangeType = v as DateRangeType;
						if (v !== "FIXED_DATE_RANGE") {
							this.config.fromDate = undefined;
							this.config.toDate = undefined;
						} else {
							this.config.dateRangeValue = undefined;
						}
						this.render();
					});
				})
			);

		if (this.config.dateRangeType !== "FIXED_DATE_RANGE") {
			basicGroup
				.addSetting((s) => s
					.setName(local.form_date_range_input_placeholder)
					.addText((text) => text
						.setPlaceholder("180")
						.setValue(String(this.config.dateRangeValue ?? ""))
						.onChange((v) => { this.config.dateRangeValue = parseInt(v) || undefined; })
					)
			);
		} else {
			basicGroup
				.addSetting((s) => s
					.setName(local.form_date_range_start_date)
					.addText((text) => text
						.setPlaceholder("2023-01-01")
						.setValue(this.config.fromDate ?? "")
						.onChange((v) => { this.config.fromDate = v; })
					)
				)
				.addSetting((s) => s
					.setName(local.form_date_range_fixed_date)
					.addText((text) => text
						.setPlaceholder("2023-12-31")
						.setValue(this.config.toDate ?? "")
						.onChange((v) => { this.config.toDate = v; })
					)
			);
		}

		this.renderDataSourceSettings(container);
	}

	private renderDataSourceSettings(container: HTMLElement) {
		const local = Locals.get();
		const ds = this.config.dataSource;
		const dsTypes = getDataSourceTypes();

		const dataSourceGroup = new SettingGroup(container)
			.setHeading(local.form_datasource_type_page)
			.addSetting((s) => s
				.setName(local.form_data_source_value)
				.addDropdown((dd) => {
					dsTypes.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(ds.type ?? "PAGE");
					dd.onChange((v) => {
						this.config.dataSource = { ...this.config.dataSource, type: v as DataSourceType };
						this.render();
					});
				})
			);

		if (ds.type !== "ALL_TASK") {
			dataSourceGroup
				.addSetting((s) => s
					.setName(local.form_query_placeholder)
					.addText((text) => text
						.setValue(ds.value ?? "")
						.onChange((v) => { this.config.dataSource = { ...this.config.dataSource, value: v }; })
					)
			);
		}

		const dft = dateFieldTypes(ds.type);
		dataSourceGroup
			.addSetting((s) => s
				.setName(local.form_date_field)
				.addDropdown((dd) => {
					dft.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(ds.dateField?.type ?? "FILE_CTIME");
					dd.onChange((v) => {
						this.config.dataSource = {
							...this.config.dataSource,
							dateField: { ...this.config.dataSource.dateField, type: v as any }
						};
						this.render();
					});
				})
			);

		if (ds.dateField?.type === "PAGE_PROPERTY" || ds.dateField?.type === "TASK_PROPERTY") {
			dataSourceGroup
				.addSetting((s) => s
					.setName(local.form_date_field_placeholder)
					.addText((text) => text
						.setValue(ds.dateField?.value ?? "")
						.onChange((v) => {
							this.config.dataSource = {
								...this.config.dataSource,
								dateField: { type: ds.dateField?.type ?? "FILE_CTIME", ...this.config.dataSource.dateField, value: v }
							};
						})
					)
			);
		}

		dataSourceGroup
			.addSetting((s) => s
				.setName(local.form_date_field_format)
				.addDropdown((dd) => {
					dd.addOption("smart_detect", local.form_date_field_format_type_smart);
					dd.addOption("manual", local.form_date_field_format_type_manual);
					dd.setValue(ds.dateField?.format ? "manual" : "smart_detect");
					dd.onChange((v) => {
						if (v === "smart_detect") {
							this.config.dataSource = {
								...this.config.dataSource,
								dateField: { type: ds.dateField?.type ?? "FILE_CTIME", ...this.config.dataSource.dateField, format: undefined }
							};
						}
						this.render();
					});
				})
			);

		if (ds.dateField?.format !== undefined) {
			dataSourceGroup
				.addSetting((s) => s
					.setName(local.form_date_field_format_placeholder)
					.addText((text) => text
						.setValue(ds.dateField?.format ?? "")
						.onChange((v) => {
							this.config.dataSource = {
								...this.config.dataSource,
								dateField: { type: ds.dateField?.type ?? "FILE_CTIME", ...this.config.dataSource.dateField, format: v }
							};
						})
					)
			);
		}

		const cft = countFieldTypes(ds.type);
		dataSourceGroup
			.addSetting((s) => s
				.setName(local.form_count_field_count_field_label)
				.addDropdown((dd) => {
					cft.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(ds.countField?.type ?? "DEFAULT");
					dd.onChange((v) => {
						this.config.dataSource = {
							...this.config.dataSource,
							countField: { ...this.config.dataSource.countField, type: v as any }
						};
						this.render();
					});
				})
			);

		if (ds.countField?.type === "PAGE_PROPERTY" || ds.countField?.type === "TASK_PROPERTY") {
			dataSourceGroup
				.addSetting((s) => s
					.setName(local.form_count_field_count_field_input_placeholder)
					.addText((text) => text
						.setValue(ds.countField?.value ?? "")
						.onChange((v) => {
							this.config.dataSource = {
								...this.config.dataSource,
								countField: { type: ds.countField?.type ?? "DEFAULT", ...this.config.dataSource.countField, value: v }
							};
						})
					)
			);
		}
	}

	private renderStyleTab(container: HTMLElement) {
		const local = Locals.get();
		const themes = getThemes(local);
		const cellShapes = getCellShapes();

		new SettingGroup(container)
			.setHeading(local.form_theme)
			.addSetting((s) => s
				.setName(local.form_theme)
				.addDropdown((dd) => {
					themes.forEach(t => dd.addOption(t.name, t.label));
					const activeTheme = matchThemeByRules(this.config.cellStyleRules ?? [], themes);
					dd.setValue(activeTheme?.name ?? "default");
					dd.onChange((v) => {
						const theme = themes.find(t => t.name === v);
						if (theme) this.config.cellStyleRules = theme.rules;
					});
				})
			);

		const styleGroup = new SettingGroup(container)
			.setHeading(local.form_style_settings)
			.addSetting((s) => s
				.setName(local.form_fill_the_screen_label)
				.addToggle((t) => t
					.setValue(this.config.fillTheScreen ?? false)
					.onChange((v) => { this.config.fillTheScreen = v; })
				)
			);

		if (this.config.graphType !== "month-track") {
			const weekOpts = getStartOfWeekOptions();
			styleGroup.addSetting((s) => s
				.setName(local.form_start_of_week)
				.addDropdown((dd) => {
					weekOpts.forEach(opt => dd.addOption(opt.value, opt.label));
					dd.setValue(String(this.config.startOfWeek ?? (isZh() ? 1 : 0)));
					dd.onChange((v) => { this.config.startOfWeek = parseInt(v); });
				})
			);
		}

		styleGroup
			.addSetting((s) => s
				.setName(local.form_enable_main_container_shadow)
				.addToggle((t) => t
					.setValue(this.config.enableMainContainerShadow ?? false)
					.onChange((v) => { this.config.enableMainContainerShadow = v; })
				)
			)
			.addSetting((s) => s
				.setName(local.form_show_cell_indicators)
				.addToggle((t) => t
					.setValue(this.config.showCellRuleIndicators ?? true)
					.onChange((v) => { this.config.showCellRuleIndicators = v; })
				)
			)
			.addSetting((s) => s
				.setName(local.form_cell_shape)
				.addDropdown((dd) => {
					cellShapes.forEach(opt => dd.addOption(opt.value || "default", opt.label));
					const current = this.config.cellStyle?.borderRadius ?? "";
					dd.setValue(current || "default");
					dd.onChange((v) => {
						this.config.cellStyle = {
							...this.config.cellStyle,
							borderRadius: v === "default" ? undefined : v
						};
					});
				})
			)
			.addSetting((s) => s
				.setName(local.form_cell_min_width)
				.addSlider((slider) => slider
					.setLimits(4, 64, 1)
					.setValue(this.parsePxNumber(this.config.cellStyle?.minWidth, 8))
					.setDynamicTooltip()
					.onChange((v) => {
						this.config.cellStyle = { ...this.config.cellStyle, minWidth: v + "px" };
					})
				)
			)
			.addSetting((s) => s
				.setName(local.form_cell_min_height)
				.addSlider((slider) => slider
					.setLimits(4, 64, 1)
					.setValue(this.parsePxNumber(this.config.cellStyle?.minHeight, 8))
					.setDynamicTooltip()
					.onChange((v) => {
						this.config.cellStyle = { ...this.config.cellStyle, minHeight: v + "px" };
					})
				)
			);
	}

	private parsePxNumber(value: string | undefined, defaultValue: number): number {
		if (!value) return defaultValue;
		const num = parseInt(value.replace(/[^0-9]/g, ""));
		return isNaN(num) ? defaultValue : num;
	}
}
