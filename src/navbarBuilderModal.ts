import { App, FuzzySuggestModal, Modal, Notice, Platform, Setting, SettingGroup, setIcon } from "obsidian";
import { NavBarConfig, NavBarAlign, NavBarItem } from "./navbarTypes";
import { stringifyNavBarConfig } from "./navbarYaml";
import { Locals } from "./i18/messages";

class CommandSuggestModal extends FuzzySuggestModal<{ id: string; name: string }> {
	private onSelect: (commandId: string) => void;

	constructor(app: App, onSelect: (commandId: string) => void) {
		super(app);
		this.onSelect = onSelect;
		this.setPlaceholder("搜索命令...");
	}

	getItems(): { id: string; name: string }[] {
		const commands = (this.app as any).commands?.commands || {};
		return Object.entries(commands)
			.map(([id, cmd]: [string, any]) => ({ id, name: cmd?.name ?? id }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	getItemText(item: { id: string; name: string }): string {
		return item.name;
	}

	onChooseItem(item: { id: string; name: string }): void {
		this.onSelect(item.id);
	}
}

const LUCIDE_ICON_NAMES: readonly string[] = [
	"home", "folder", "file-text", "layout-grid", "layout-list", "menu", "sidebar",
	"arrow-left", "arrow-right", "arrow-up", "arrow-down", "chevron-left", "chevron-right",
	"chevron-up", "chevron-down", "more-horizontal", "more-vertical",
	"plus", "minus", "x", "check", "search", "filter", "settings", "edit-3", "trash-2",
	"copy", "clipboard", "save", "refresh-cw", "download", "upload", "share-2", "link",
	"mail", "send", "message-square", "bell", "at-sign", "hash", "rss",
	"image", "film", "music", "mic", "camera", "play", "pause", "volume-2",
	"book-open", "book-marked", "bookmark", "tag", "tags", "archive", "database",
	"calendar", "clock", "timer", "globe", "map-pin", "compass",
	"user", "users", "heart", "star", "thumbs-up", "thumbs-down", "eye", "eye-off",
	"code", "terminal", "git-branch", "git-commit", "git-pull-request", "bug",
	"package", "wrench", "zap", "cpu", "hard-drive", "cloud", "server",
	"info", "alert-circle", "alert-triangle", "help-circle", "loader-2",
	"toggle-left", "toggle-right", "lock", "unlock", "key", "shield",
	"sun", "moon", "cloud-sun", "cloud-rain", "sparkles", "flame", "feather",
	"coffee", "gift", "trophy", "rocket", "target", "lightbulb", "palette",
];

class IconSuggestModal extends FuzzySuggestModal<string> {
	private onSelect: (iconName: string) => void;

	constructor(app: App, onSelect: (iconName: string) => void) {
		super(app);
		this.onSelect = onSelect;
		this.setPlaceholder("搜索图标...");
	}

	getItems(): string[] {
		return [...LUCIDE_ICON_NAMES];
	}

	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(value: any, el: HTMLElement): void {
		super.renderSuggestion(value, el);
		const iconEl = document.createElement("span");
		iconEl.style.marginRight = "8px";
		iconEl.style.display = "inline-flex";
		iconEl.style.verticalAlign = "middle";
		setIcon(iconEl, value.item);
		el.prepend(iconEl);
	}

	onChooseItem(item: string): void {
		this.onSelect(item);
	}
}

export class NavBarBuilderModal extends Modal {
	private config: NavBarConfig;
	private onSubmit: (config: NavBarConfig) => void | Promise<void>;

	constructor(
		app: App,
		onSubmit: (config: NavBarConfig) => void | Promise<void>,
		initialConfig?: NavBarConfig
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.config = initialConfig ?? NavBarBuilderModal.createInitialConfig();
	}

	onOpen() {
		this.modalEl.addClass("navbar-builder-modal-container");
		this.render();
	}

	onClose() {
	}

	static createInitialConfig(): NavBarConfig {
		return {
			items: [
				{ label: "首页", icon: "home", url: "Home" },
				{ label: "项目", icon: "folder", url: "项目" },
			],
		};
	}

	private render() {
		const { contentEl } = this;
		const local = Locals.get();
		contentEl.empty();
		contentEl.addClass("navbar-builder-modal");

		new SettingGroup(contentEl)
			.setHeading(local.navbar_align_desc)
			.addSetting((setting) =>
				setting
					.setName(local.navbar_align_desc)
					.addDropdown((dropdown) =>
						dropdown
							.addOption("center", local.navbar_align_center)
							.addOption("justify", local.navbar_align_justify)
							.setValue(this.config.align ?? "center")
							.onChange((value: string) => {
								this.config.align = value as NavBarAlign;
							})
					)
			)
			.addSetting((setting) => {
				const value = parseFloat(this.config.desktopGap ?? "1.5") || 1.5;
				const clampedValue = Math.round(Math.max(0.1, Math.min(2.5, value)) * 100) / 100;
				this.config.desktopGap = clampedValue + "rem";
				return setting
					.setName(local.navbar_desktop_gap_label)
					.setDesc(`${local.navbar_desktop_gap_desc}: ${clampedValue}rem`)
					.addSlider((slider) =>
						slider
							.setLimits(0.1, 2.5, 0.05)
							.setValue(clampedValue)
							.setDynamicTooltip()
							.onChange((v) => {
								const rounded = Math.round(v * 100) / 100;
								this.config.desktopGap = rounded + "rem";
								const descEl = slider.sliderEl.parentElement?.querySelector(".setting-item-description");
								if (descEl) descEl.textContent = `${local.navbar_desktop_gap_desc}: ${rounded}rem`;
							})
					);
			})
			.addSetting((setting) => {
				const value = parseFloat(this.config.mobileGap ?? "1.5") || 1.5;
				const clampedValue = Math.round(Math.max(0.1, Math.min(2.5, value)) * 100) / 100;
				this.config.mobileGap = clampedValue + "rem";
				return setting
					.setName(local.navbar_mobile_gap_label)
					.setDesc(`${local.navbar_mobile_gap_desc}: ${clampedValue}rem`)
					.addSlider((slider) =>
						slider
							.setLimits(0.1, 2.5, 0.05)
							.setValue(clampedValue)
							.setDynamicTooltip()
							.onChange((v) => {
								const rounded = Math.round(v * 100) / 100;
								this.config.mobileGap = rounded + "rem";
								const descEl = slider.sliderEl.parentElement?.querySelector(".setting-item-description");
								if (descEl) descEl.textContent = `${local.navbar_mobile_gap_desc}: ${rounded}rem`;
							})
					);
			})
			.addSetting((setting) => {
				const value = parseFloat(this.config.desktopRowGap ?? "0.5") || 0.5;
				const clampedValue = Math.round(Math.max(0, Math.min(2.5, value)) * 100) / 100;
				this.config.desktopRowGap = clampedValue + "rem";
				return setting
					.setName(local.navbar_desktop_row_gap_label)
					.setDesc(`${local.navbar_desktop_row_gap_desc}: ${clampedValue}rem`)
					.addSlider((slider) =>
						slider
							.setLimits(0, 2.5, 0.05)
							.setValue(clampedValue)
							.setDynamicTooltip()
							.onChange((v) => {
								const rounded = Math.round(v * 100) / 100;
								this.config.desktopRowGap = rounded + "rem";
								const descEl = slider.sliderEl.parentElement?.querySelector(".setting-item-description");
								if (descEl) descEl.textContent = `${local.navbar_desktop_row_gap_desc}: ${rounded}rem`;
							})
					);
			})
			.addSetting((setting) => {
				const value = parseFloat(this.config.mobileRowGap ?? "0.5") || 0.5;
				const clampedValue = Math.round(Math.max(0, Math.min(2.5, value)) * 100) / 100;
				this.config.mobileRowGap = clampedValue + "rem";
				return setting
					.setName(local.navbar_mobile_row_gap_label)
					.setDesc(`${local.navbar_mobile_row_gap_desc}: ${clampedValue}rem`)
					.addSlider((slider) =>
						slider
							.setLimits(0, 2.5, 0.05)
							.setValue(clampedValue)
							.setDynamicTooltip()
							.onChange((v) => {
								const rounded = Math.round(v * 100) / 100;
								this.config.mobileRowGap = rounded + "rem";
								const descEl = slider.sliderEl.parentElement?.querySelector(".setting-item-description");
								if (descEl) descEl.textContent = `${local.navbar_mobile_row_gap_desc}: ${rounded}rem`;
							})
					);
			});

		const itemsGroup = new SettingGroup(contentEl)
			.setHeading(local.navbar_items_heading);

		for (const [index, item] of this.config.items.entries()) {
			this.renderItemEditor(itemsGroup, item, index);
		}

		new Setting(contentEl)
			.setName(local.navbar_add_item)
			.addButton((button) =>
				button.setButtonText("新增").onClick(() => {
					this.config.items.push({ label: "新链接", url: "" });
					this.render();
				})
			);

		const footerEl = contentEl.createDiv({ cls: "navbar-builder-modal__footer" });

		const cancelBtn = footerEl.createEl("button", {
			text: local.cancel,
			cls: "navbar-builder-modal__footer-btn navbar-builder-modal__footer-btn--cancel",
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
		});

		const confirmBtn = footerEl.createEl("button", {
			text: local.confirm,
			cls: "navbar-builder-modal__footer-btn navbar-builder-modal__footer-btn--confirm",
		});
		confirmBtn.addEventListener("click", () => {
			void this.onSubmit(JSON.parse(JSON.stringify(this.config)));
			this.close();
		});

		if (Platform.isMobile || window.innerWidth <= 768) {
			this.injectMobileSettingGroupStyles(contentEl);
		}
	}

	private injectMobileSettingGroupStyles(container: HTMLElement) {
		const styleEl = container.createEl("style", {
			text: `
/* Mobile SettingGroup - 按 ui-patterns.md §10.2 + §10.9 G 规范 */
.theme-light .navbar-builder-modal .setting-group .setting-items {
	background-color: #ffffff !important;
}
.theme-dark .navbar-builder-modal .setting-group .setting-items {
	background-color: var(--background-primary-alt) !important;
}
.navbar-builder-modal .setting-group .setting-items {
	padding: var(--size-4-5, 20px) !important;
	border-radius: var(--radius-l, 12px) !important;
	margin-bottom: 0 !important;
}
.navbar-builder-modal .setting-group {
	gap: var(--size-4-2, 8px) !important;
}
.navbar-builder-modal .setting-group + .setting-group {
	margin-top: var(--size-4-6, 24px) !important;
}
`,
		});
		styleEl.setAttribute("data-mobile-setting-group", "");
	}

	private renderItemEditor(group: SettingGroup, item: NavBarItem, index: number) {
		const local = Locals.get();

		group.addSetting((setting) => {
			setting.setName(`${local.navbar_items_heading} ${index + 1}`);
			if (index > 0) {
				setting.addButton((btn) => {
					setIcon(btn.buttonEl, "arrow-up");
					btn.onClick(() => {
						[this.config.items[index], this.config.items[index - 1]] =
							[this.config.items[index - 1], this.config.items[index]];
						this.render();
					});
				});
			}
			if (index < this.config.items.length - 1) {
				setting.addButton((btn) => {
					setIcon(btn.buttonEl, "arrow-down");
					btn.onClick(() => {
						[this.config.items[index], this.config.items[index + 1]] =
							[this.config.items[index + 1], this.config.items[index]];
						this.render();
					});
				});
			}
			setting.addButton((btn) => {
				setIcon(btn.buttonEl, "trash");
				btn.onClick(() => {
					this.config.items.splice(index, 1);
					this.render();
				});
			});
		});

		group.addSetting((setting) =>
			setting.setName(local.navbar_item_label)
				.addText((text) =>
					text.setValue(item.label).onChange((value) => {
						item.label = value;
					})
				)
		);

		group.addSetting((setting) =>
			setting.setName(local.navbar_item_icon_label)
				.setDesc(local.navbar_item_icon_desc)
				.addText((text) =>
					text.setPlaceholder("可选")
						.setValue(item.icon ?? "")
						.onChange((value) => {
							item.icon = value.trim() || undefined;
						})
				)
				.addButton((button) =>
					button.setButtonText(local.navbar_item_select_icon).onClick(() => {
						const suggestModal = new IconSuggestModal(this.app, (iconName: string) => {
							item.icon = iconName;
							this.render();
						});
						suggestModal.open();
					})
				)
		);

		group.addSetting((setting) =>
			setting.setName(local.navbar_item_url_label)
				.setDesc(local.navbar_item_url_desc)
				.addText((text) =>
					text.setPlaceholder("可选")
						.setValue(item.url ?? "")
						.onChange((value) => {
							item.url = value.trim() || undefined;
						})
				)
		);

		group.addSetting((setting) =>
			setting.setName(local.navbar_item_action_label)
				.setDesc(local.navbar_item_action_desc)
				.addText((text) =>
					text.setPlaceholder("可选")
						.setValue(item.action ?? "")
						.onChange((value) => {
							item.action = value.trim() || undefined;
						})
				)
				.addButton((button) =>
					button.setButtonText(local.navbar_item_select_command).onClick(() => {
						const suggestModal = new CommandSuggestModal(this.app, (commandId: string) => {
							item.action = commandId;
							this.render();
						});
						suggestModal.open();
					})
				)
		);
	}

	static toCodeBlock(config: NavBarConfig): string {
		return "```navbar\n" + stringifyNavBarConfig(config) + "\n```\n";
	}

	static toCodeBlockInner(config: NavBarConfig): string {
		return stringifyNavBarConfig(config);
	}
}
