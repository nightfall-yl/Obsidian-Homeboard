import {
	App,
	Modal,
	Setting,
	TextAreaComponent,
} from "obsidian";
import {
	DEFAULT_ELEMENTCARD_SETTINGS,
	ELEMENTCARD_CARD_PALETTES,
	ElementCardCardConfig,
	ElementCardCardPalettePreset,
	ElementCardComponentSettings,
	ElementCardConfig,
	ElementCardLinkItem,
	resolveElementCardCardPalette,
} from "./elementCardTypes";
import { Locals } from "./i18/messages";
import { Local } from "./i18/types";
import { stringifyElementCardConfig } from "./elementCardYaml";

function createDefaultCard(index?: number, existingCards?: ElementCardCardConfig[]): ElementCardCardConfig {
	const allKeys: ElementCardCardPalettePreset[] = ["sage", "mist", "amber", "plum", "slate"];
	const usedKeys = new Set(existingCards?.map((c) => c.palettePreset).filter(Boolean));
	const availableKeys = allKeys.filter((k) => !usedKeys.has(k));
	const keys = availableKeys.length > 0 ? availableKeys : allKeys;
	const randomKey = keys[Math.floor(Math.random() * keys.length)];
	const palette = ELEMENTCARD_CARD_PALETTES[randomKey];
	return {
		type: "links",
		title: index ? `卡片 ${index}` : undefined,
		palettePreset: randomKey,
		linksLayout: "inline",
		cardBackgroundColor: palette.background,
		cardBackgroundTransparency: 100,
		titleColor: palette.title,
		linkColor: palette.link,
		separatorColor: palette.separator,
		links: [
			{ label: "链接 1", url: "" },
			{ label: "链接 2", url: "" },
		],
	};
}

function parseLinks(text: string): ElementCardLinkItem[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [label, url] = line.split("|").map((part) => part.trim());
			return {
				label: label || url,
				url: url || label,
			};
		});
}

function stringifyLinks(links: ElementCardLinkItem[] | undefined): string {
	return (links ?? [])
		.map((item) => `${item.label} | ${item.url}`)
		.join("\n");
}

function applyPalette(card: ElementCardCardConfig, preset: ElementCardCardPalettePreset) {
	const palette = ELEMENTCARD_CARD_PALETTES[preset];
	card.palettePreset = preset;
	card.cardBackgroundColor = palette.background;
	card.cardBackgroundTransparency = 100;
	card.titleColor = palette.title;
	card.linkColor = palette.link;
	card.separatorColor = palette.separator;
}

function createPaletteSwatches(
	container: HTMLElement,
	colors: string[],
	className = "elementCard-builder-modal__palette-swatch"
) {
	const swatches = container.createDiv({
		cls: "elementCard-builder-modal__palette-swatches plugin-config-swatch-group",
	});
	colors.forEach((color) => {
		swatches.createEl("span", {
			cls: className,
			attr: { style: `background:${color}` },
		});
	});
	return swatches;
}

function getPaletteLabel(local: Local, preset: ElementCardCardPalettePreset): string {
	switch (preset) {
		case "sage":
			return local.elementCard_palette_sage;
		case "mist":
			return local.elementCard_palette_mist;
		case "amber":
			return local.elementCard_palette_amber;
		case "plum":
			return local.elementCard_palette_plum;
		case "slate":
			return local.elementCard_palette_slate;
		default:
			return local.elementCard_palette_custom;
	}
}

export class ElementCardBuilderModal extends Modal {
	private config: ElementCardConfig;
	private settings: ElementCardComponentSettings;
	private onSubmit: (config: ElementCardConfig) => void | Promise<void>;
	private saveTimer: number | null = null;
	private isSaving = false;
	private pendingSave = false;
	private closePaletteMenu: (() => void) | null = null;
	private activeTab: "basic" | "cards" = "basic";

	constructor(
		app: App,
		settings: ElementCardComponentSettings,
		onSubmit: (config: ElementCardConfig) => void | Promise<void>,
		initialConfig?: ElementCardConfig
	) {
		super(app);
		this.settings = settings;
		this.onSubmit = onSubmit;
		this.config = initialConfig ?? ElementCardBuilderModal.createInitialConfig(settings);
	}

	onOpen() {
		this.modalEl.addClass("elementCard-builder-modal-container");
		this.render();
	}

	onClose() {
		this.closePaletteMenu?.();
		this.closePaletteMenu = null;
		void this.flushSave();
	}

	static createInitialConfig(settings: ElementCardComponentSettings): ElementCardConfig {
		const local = Locals.get();
		const firstCard = createDefaultCard(1);
		const secondCard = createDefaultCard(2);
		applyPalette(secondCard, "mist");
		return {
			id: `elementCard-${Date.now()}`,
			title: local.elementCard_default_title,
			titleFontSize: 16,
			columns: settings.defaultColumns ?? DEFAULT_ELEMENTCARD_SETTINGS.defaultColumns,
			gap: settings.defaultGap ?? DEFAULT_ELEMENTCARD_SETTINGS.defaultGap,
			cards: [firstCard, secondCard],
		};
	}

	private render() {
		const { contentEl } = this;
		const local = Locals.get();
		contentEl.empty();
		contentEl.addClass("elementCard-builder-modal", "plugin-config-modal");

		const workspace = contentEl.createDiv({
			cls: "elementCard-builder-modal__workspace plugin-config-modal__workspace",
		});
		workspace.tabIndex = -1;
		const tabContainer = workspace.createDiv({
			cls: "tab-container elementCard-builder-modal__tabs plugin-config-form",
		});
		const tabTitles = tabContainer.createDiv({ cls: "tab-titles" });
		this.renderTabTitle(tabTitles, local.elementCard_tab_basic, "basic");
		this.renderTabTitle(tabTitles, local.elementCard_tab_cards, "cards");
		const divider = tabContainer.createDiv({ cls: "contribution-graph-divider elementCard-builder-modal__divider" });
		divider.createDiv();
		const tabItems = tabContainer.createDiv({ cls: "tab-items" });

		const basicTab = tabItems.createDiv({
			cls: `tab-item ${this.activeTab === "basic" ? "active" : ""}`,
		});
		const basicPane = basicTab.createDiv({ cls: "elementCard-builder-modal__editor" });
		this.renderBasicSettings(basicPane);

		const cardsTab = tabItems.createDiv({
			cls: `tab-item ${this.activeTab === "cards" ? "active" : ""}`,
		});
		const cardsPane = cardsTab.createDiv({ cls: "elementCard-builder-modal__editor" });
		this.renderCardSettings(cardsPane);

		window.setTimeout(() => {
			workspace.focus({ preventScroll: true });
		}, 0);

	}

	private renderTabTitle(
		container: HTMLElement,
		label: string,
		tab: "basic" | "cards"
	) {
		const title = container.createDiv({
			cls: `tab-item-title ${this.activeTab === tab ? "active" : ""}`,
			text: label,
		});
		title.addEventListener("click", () => {
			if (this.activeTab === tab) {
				return;
			}
			this.closePaletteMenu?.();
			this.activeTab = tab;
			this.render();
		});
	}

	private renderBasicSettings(container: HTMLElement) {
		const local = Locals.get();
		new Setting(container)
			.setName(local.elementCard_block_id)
			.setDesc(local.elementCard_block_id_desc)
			.addText((text) =>
				text.setValue(this.config.id ?? "").onChange((value) => {
					this.config.id = value.trim() || `elementCard-${Date.now()}`;
					this.refreshDerivedViews();
				})
			);

		new Setting(container)
			.setName(local.form_title)
			.addText((text) => {
				text.inputEl.addClass("elementCard-builder-modal__title-input");
				return text.setValue(this.config.title ?? "").onChange((value) => {
					this.config.title = value.trim() || undefined;
					this.refreshDerivedViews();
				});
			})
			.addText((text) => {
				text.inputEl.addClass("elementCard-builder-modal__title-size-input");
				text.setPlaceholder(local.elementCard_title_font_size_placeholder);
				return text.setValue(String(this.config.titleFontSize ?? 16)).onChange((value) => {
					this.config.titleFontSize = Number(value) || 16;
					this.refreshDerivedViews();
				});
			});

		new Setting(container)
			.setName(local.elementCard_columns)
			.addText((text) =>
				text
					.setPlaceholder("2")
					.setValue(String(this.config.columns ?? 2))
					.onChange((value) => {
						const num = Number(value);
						if (num >= 1 && num <= 4) {
							this.config.columns = num;
							this.refreshDerivedViews();
						}
					})
			);

		new Setting(container)
			.setName(local.elementCard_gap)
			.setDesc(local.elementCard_gap_desc)
			.addText((text) =>
				text.setValue(String(this.config.gap ?? 16)).onChange((value) => {
					this.config.gap = Number(value) || value || 16;
					this.refreshDerivedViews();
				})
			);
	}

	private renderCardSettings(container: HTMLElement) {
		const local = Locals.get();
		container.createEl("h3", { text: local.elementCard_cards });
		for (const [index, card] of (this.config.cards ?? []).entries()) {
			this.renderCardEditor(container, card, index);
		}

		new Setting(container)
			.setName(local.elementCard_add_card)
			.setDesc(local.elementCard_add_card_desc)
			.addButton((button) =>
				button.setButtonText(local.elementCard_add_button).onClick(() => {
					this.addCard();
				})
			);
	}

	private refreshDerivedViews() {
		this.scheduleSave();
	}

	private scheduleSave() {
		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
		}
		this.saveTimer = window.setTimeout(() => {
			void this.flushSave();
		}, 220);
	}

	private async flushSave() {
		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}

		if (this.isSaving) {
			this.pendingSave = true;
			return;
		}

		this.isSaving = true;
		try {
			await this.onSubmit(this.cloneConfig(this.config));
		} finally {
			this.isSaving = false;
			if (this.pendingSave) {
				this.pendingSave = false;
				void this.flushSave();
			}
		}
	}

	private renderCardEditor(container: HTMLElement, card: ElementCardCardConfig, index: number) {
		const local = Locals.get();
		const cardEl = container.createDiv({ cls: "elementCard-builder-modal__card" });
		cardEl.createEl("h4", { text: `${local.elementCard_card_label} ${index + 1}` });
		card.type = "links";

		new Setting(cardEl)
			.setName(local.elementCard_type)
			.setDesc(local.elementCard_type_desc)
			.addExtraButton((button) => {
				button.setIcon("arrow-up").setTooltip(local.elementCard_move_up).onClick(() => {
					this.moveCard(index, -1);
				});
			})
			.addExtraButton((button) => {
				button.setIcon("arrow-down").setTooltip(local.elementCard_move_down).onClick(() => {
					this.moveCard(index, 1);
				});
			})
			.addExtraButton((button) => {
				button.setIcon("trash").setTooltip(local.elementCard_remove).onClick(() => {
					this.removeCard(index);
				});
			});

		new Setting(cardEl)
			.setName(local.form_title)
			.addText((text) =>
				text.setValue(card.title ?? "").onChange((value) => {
					card.title = value;
					this.refreshDerivedViews();
				})
			);

		new Setting(cardEl)
			.setName(local.elementCard_palette)
			.setDesc(local.elementCard_palette_desc)
			.addButton((button) => {
				button.setClass("elementCard-builder-modal__palette-trigger");
				this.renderPaletteTrigger(button.buttonEl, card);
				button.onClick(() => {
					this.togglePaletteMenu(button.buttonEl, card);
				});
			});

		new Setting(cardEl)
			.setName(local.elementCard_background)
			.setDesc(local.elementCard_background_desc)
			.addColorPicker((picker) =>
				picker
					.setValue(card.cardBackgroundColor ?? "#ffffff")
					.onChange((value) => this.updateCardColors(card, () => {
						card.cardBackgroundColor = value;
					}))
			)
			.addText((text) =>
				text
					.setPlaceholder("100")
					.setValue(String(card.cardBackgroundTransparency ?? 100))
					.onChange((value) => {
						card.cardBackgroundTransparency = Number(value) || 100;
						this.refreshDerivedViews();
					})
			);

		new Setting(cardEl)
			.setName(local.elementCard_accent_colors)
			.setDesc(local.elementCard_accent_colors_desc)
			.addColorPicker((picker) =>
				picker
					.setValue(card.titleColor ?? "#61b94d")
					.onChange((value) => this.updateCardColors(card, () => {
						card.titleColor = value;
					}))
			)
			.addColorPicker((picker) =>
				picker
					.setValue(card.linkColor ?? "#1d86ea")
					.onChange((value) => this.updateCardColors(card, () => {
						card.linkColor = value;
					}))
			)
			.addColorPicker((picker) =>
				picker
					.setValue(card.separatorColor ?? "#77ba61")
					.onChange((value) => this.updateCardColors(card, () => {
						card.separatorColor = value;
					}))
			);

		new Setting(cardEl)
			.setName(local.elementCard_column_span)
			.setDesc(local.elementCard_column_span_desc)
			.addText((text) =>
				text.setPlaceholder("1").setValue(card.column ? String(card.column) : "").onChange((value) => {
					card.column = value ? Number(value) : undefined;
					this.refreshDerivedViews();
				})
			)
			.addText((text) =>
				text.setPlaceholder("1").setValue(card.span ? String(card.span) : "").onChange((value) => {
					card.span = value ? Number(value) : undefined;
					this.refreshDerivedViews();
				})
			);



		this.addTextareaSetting(
			cardEl,
			local.elementCard_links,
			stringifyLinks(card.links),
			(value) => {
				card.links = parseLinks(value);
			},
			local.elementCard_links_desc
		);
	}

	private addTextareaSetting(
		container: HTMLElement,
		name: string,
		value: string,
		onChange: (value: string) => void,
		desc?: string
	) {
		const setting = new Setting(container).setName(name);
		if (desc) {
			setting.setDesc(desc);
		}
		setting.addTextArea((text: TextAreaComponent) => {
			text.setValue(value).onChange((nextValue) => {
				onChange(nextValue);
				this.refreshDerivedViews();
			});
			text.inputEl.rows = 6;
			text.inputEl.addClass("elementCard-builder-modal__textarea");
		});
	}

	private addCard() {
		const index = (this.config.cards?.length ?? 0) + 1;
		this.config.cards?.push(createDefaultCard(index, this.config.cards));
		this.scheduleSave();
		this.render();
	}

	private moveCard(index: number, direction: -1 | 1) {
		const cards = this.config.cards!;
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= cards.length) {
			return;
		}
		[cards[index], cards[nextIndex]] = [cards[nextIndex], cards[index]];
		this.scheduleSave();
		this.render();
	}

	private removeCard(index: number) {
		this.config.cards!.splice(index, 1);
		const remainingCards = this.config.cards!.length;
		if (remainingCards > 0 && (this.config.columns ?? 1) > remainingCards) {
			this.config.columns = remainingCards;
		}
		this.scheduleSave();
		this.render();
	}

	private updateCardColors(card: ElementCardCardConfig, update: () => void) {
		update();
		card.palettePreset = undefined;
		this.refreshDerivedViews();
	}

	private renderPaletteTrigger(container: HTMLElement, card: ElementCardCardConfig) {
		const local = Locals.get();
		const activePreset = card.palettePreset;
		const activePalette = activePreset ? ELEMENTCARD_CARD_PALETTES[activePreset] : null;
		const resolvedPalette = resolveElementCardCardPalette(card);
		container.empty();
		const triggerRow = container.createDiv({
			cls: "elementCard-builder-modal__palette-trigger-row plugin-config-palette-trigger-row",
		});
		triggerRow.createEl("span", {
			text: activePreset
				? getPaletteLabel(local, activePreset)
				: local.elementCard_palette_custom,
			cls: "elementCard-builder-modal__palette-trigger-label plugin-config-palette-label",
		});
		createPaletteSwatches(
			triggerRow,
			activePalette
				? [activePalette.background, activePalette.title, activePalette.link, activePalette.separator]
				: [
					resolvedPalette.background,
					resolvedPalette.title,
					resolvedPalette.link,
					resolvedPalette.separator,
				],
			"elementCard-builder-modal__palette-swatch elementCard-builder-modal__palette-swatch--small"
		);
	}

	private togglePaletteMenu(triggerEl: HTMLElement, card: ElementCardCardConfig) {
		if (this.closePaletteMenu) {
			this.closePaletteMenu();
			return;
		}

		const triggerRect = triggerEl.getBoundingClientRect();
		const menuEl = this.modalEl.createDiv({
			cls: "elementCard-builder-modal__palette-menu plugin-config-palette-menu",
		});
		menuEl.style.position = "fixed";
		menuEl.style.left = `${triggerRect.left}px`;
		menuEl.style.top = `${triggerRect.bottom + 6}px`;
		menuEl.style.width = `${triggerRect.width}px`;

		const closeMenu = () => {
			menuEl.remove();
			document.removeEventListener("click", handleOutsideClick, true);
			if (this.closePaletteMenu === closeMenu) {
				this.closePaletteMenu = null;
			}
		};

		const handleOutsideClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && (triggerEl.contains(target) || menuEl.contains(target))) {
				return;
			}
			closeMenu();
		};

		this.closePaletteMenu = closeMenu;
		this.renderPaletteOptions(menuEl, card, closeMenu);
		window.setTimeout(() => {
			document.addEventListener("click", handleOutsideClick, true);
		}, 0);
	}

	private renderPaletteOptions(
		menuEl: HTMLElement,
		card: ElementCardCardConfig,
		closeMenu: () => void
	) {
		const local = Locals.get();
		(
			Object.entries(ELEMENTCARD_CARD_PALETTES) as [
				ElementCardCardPalettePreset,
				typeof ELEMENTCARD_CARD_PALETTES.sage,
			][]
		).forEach(([preset, palette]) => {
			const item = menuEl.createEl("button", {
				cls: "elementCard-builder-modal__palette-option plugin-config-palette-option",
				attr: { type: "button" },
			});
			if (card.palettePreset === preset) {
				item.addClass("is-active");
			}
			item.createEl("span", {
				text: getPaletteLabel(local, preset),
				cls: "elementCard-builder-modal__palette-option-label plugin-config-palette-label",
			});
			createPaletteSwatches(item, [
				palette.background,
				palette.title,
				palette.link,
				palette.separator,
			]);
			item.addEventListener("click", () => {
				applyPalette(card, preset);
				this.scheduleSave();
				closeMenu();
				this.render();
			});
		});
	}

	private cloneConfig(config: ElementCardConfig): ElementCardConfig {
		return JSON.parse(JSON.stringify(config)) as ElementCardConfig;
	}

	static toCodeBlock(config: ElementCardConfig): string {
		return `\`\`\`elementCard\n${stringifyElementCardConfig(config)}\n\`\`\`\n`;
	}
}
