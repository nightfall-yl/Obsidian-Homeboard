import {
	App,
	MarkdownView,
	MarkdownPostProcessorContext,
} from "obsidian";
import ElementsPlugin from "./main";
import { parseElementCardConfig } from "./elementCardConfig";
import { ElementCardError } from "./elementCardError";
import {
	DEFAULT_ELEMENTCARD_SETTINGS,
	ElementCardCardConfig,
	ElementCardComponentSettings,
	ElementCardConfig,
	ElementCardLinkItem,
	resolveElementCardCardPalette,
} from "./elementCardTypes";
import { convertToRGBA } from "./colorUtils";
import { mountFloatingEditButton } from "./view/codeblock/floatingEditButton";

const DEFAULT_GAP = "2px";

export class ElementCardProcessor {
	private plugin: ElementsPlugin;
	private settings: ElementCardComponentSettings;
	private onAction: ((action: string) => void) | undefined;

	constructor(
		plugin: ElementsPlugin,
		settings: ElementCardComponentSettings,
		onAction?: (action: string) => void
	) {
		this.plugin = plugin;
		this.settings = settings;
		this.onAction = onAction;
	}

	render(
		code: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		_app: App
	) {
			try {
				const config = this.parseConfig(code);
				this.renderElementCard(config, code, el, ctx);
		} catch (error) {
			if (error instanceof ElementCardError) {
				this.renderErrorTips(el, error.summary, error.recommends);
				return;
			}

			console.error(error);
			this.renderErrorTips(el, "ElementCard 解析失败", [
				"请检查 YAML 格式、缩进和 cards 配置",
			]);
		}
	}

	private parseConfig(code: string): ElementCardConfig {
		return parseElementCardConfig(code);
	}

	private renderElementCard(
		config: ElementCardConfig,
		code: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		el.empty();

		const wrapper = el.createDiv({ cls: "elementCard" });
		const sectionInfo = ctx.getSectionInfo?.(el);
		const columns = this.normalizeColumns(config.columns);
		const gap = this.normalizeGap(config.gap);
		const blockId = this.getBlockId(config, ctx, code);

		wrapper.style.setProperty("--elementCard-columns", String(columns));
		wrapper.style.setProperty("--elementCard-gap", gap);
		wrapper.style.setProperty(
			"--elementCard-card-border-color",
			convertToRGBA(
				config.cardBorderColor ?? this.settings.cardBorderColor,
				config.cardBorderTransparency ?? this.settings.cardBorderTransparency
			)
		);
		wrapper.style.setProperty(
			"--elementCard-resizer-color",
			this.settings.showResizers
				? convertToRGBA(
						config.resizerColor ?? this.settings.resizerColor,
						config.resizerTransparency ?? this.settings.resizerTransparency
				  )
				: "transparent"
		);
		this.renderEditButton(wrapper, ctx, sectionInfo?.lineStart, sectionInfo?.lineEnd, code);

		if (config.title) {
			const titleEl = wrapper.createEl("h2", {
				cls: "elementCard__title",
				text: config.title,
			});
			titleEl.style.fontSize = `${this.normalizeTitleFontSize(config.titleFontSize)}px`;
		} else {
			wrapper.addClass("elementCard--toolbar-only");
		}

		const shell = wrapper.createDiv({ cls: "elementCard__shell" });
		const grid = shell.createDiv({ cls: "elementCard__grid" });
		const cards = config.cards ?? [];
		const widths = this.loadColumnWidths(blockId, columns);
		this.applyGridTemplate(grid, widths);
		const isSourceMode =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode?.() === "source";

		for (const card of cards) {
			const cardEl = grid.createDiv({ cls: "elementCard__card" });
			const palette = resolveElementCardCardPalette(card);
			cardEl.dataset.type = "links";
			if (card.palettePreset) {
				cardEl.dataset.palettePreset = card.palettePreset;
			}
			cardEl.style.gridColumn = `span ${this.normalizeSpan(card.span, columns)}`;
			cardEl.style.background = convertToRGBA(
				palette.background,
				card.cardBackgroundTransparency ?? 100
			);
			cardEl.style.setProperty("--elementCard-card-title-color", palette.title);
			cardEl.style.setProperty("--elementCard-card-link-color", palette.link);
			cardEl.style.setProperty("--elementCard-card-separator-color", palette.separator);

			const column = card.column;
			if (typeof column === "number" && column > 0 && column <= columns) {
				cardEl.style.gridColumnStart = String(card.column);
			}

			if (card.linksLayout) {
				cardEl.dataset.linksLayout = card.linksLayout;
			} else {
				cardEl.dataset.linksLayout = "inline";
			}

			if (card.title) {
				cardEl.createEl("h3", {
					cls: "elementCard__card-title",
					text: card.title,
				});
			}

			const body = cardEl.createDiv({ cls: "elementCard__card-body" });
			this.renderLinksCard(body, card, ctx.sourcePath);
		}

		if (isSourceMode) {
			this.mountResizers(shell, grid, widths, blockId);
		}
	}

	private normalizeColumns(columns?: number): number {
		if (!columns || Number.isNaN(columns)) {
			return this.settings.defaultColumns ?? DEFAULT_ELEMENTCARD_SETTINGS.defaultColumns;
		}

		return Math.max(1, Math.min(4, Math.floor(columns)));
	}

	private normalizeSpan(span: number | undefined, columns: number): number {
		if (!span || Number.isNaN(span)) {
			return 1;
		}

		return Math.max(1, Math.min(columns, Math.floor(span)));
	}

	private normalizeGap(gap?: string | number): string {
		if (typeof gap === "number") {
			return `${gap}px`;
		}

		if (typeof gap === "string" && gap.trim()) {
			return gap;
		}

		return DEFAULT_GAP;
	}

	private normalizeTitleFontSize(fontSize?: number): number {
		if (!fontSize || Number.isNaN(fontSize)) {
			return 16;
		}

		return Math.max(12, Math.min(48, Math.floor(fontSize)));
	}

	private renderLinksCard(container: HTMLElement, card: ElementCardCardConfig, sourcePath: string) {
		const links = card.links ?? [];
		if (card.linksLayout === "inline" || card.linksLayout === "justify") {
			const nav = container.createDiv({ cls: "elementCard__links-inline" });
			links.forEach((link, index) => {
				const button = this.createLinkButton(nav, link);
				this.bindInternalLink(button, link, sourcePath);
				if (index < links.length - 1) {
					nav.createEl("span", {
						cls: "elementCard__links-inline-separator",
						text: "|",
					});
				}
			});
			return;
		}

		const list = container.createEl("ul", { cls: "elementCard__links" });
		for (const link of links) {
			const item = list.createEl("li");
			const button = this.createLinkButton(item, link);
			this.bindInternalLink(button, link, sourcePath);
		}
	}

	private createLinkButton(container: HTMLElement, link: ElementCardLinkItem) {
		const cls = link.action
			? "elementCard__link-button elementCard__link-button--action internal-link"
			: "elementCard__link-button internal-link";
		return container.createEl("button", {
			text: link.label,
			cls,
			attr: { type: "button" },
		});
	}

	private bindInternalLink(element: HTMLElement, link: ElementCardLinkItem, sourcePath: string) {
		if (link.action) {
			element.dataset.action = link.action;
			element.setAttribute("aria-label", link.label);

			let lastHandledAt = 0;
			const handleAction = (event: Event) => {
				event.preventDefault();
				event.stopPropagation();

				const now = Date.now();
				if (now - lastHandledAt < 250) return;
				lastHandledAt = now;

				this.onAction?.(link.action!);
			};

			element.addEventListener("click", handleAction);
			element.addEventListener("pointerup", handleAction);
			element.addEventListener("touchend", handleAction, { passive: false });
			return;
		}

		element.dataset.href = link.url ?? "";
		element.setAttribute("aria-label", link.label);

		let lastHandledAt = 0;
		const openLink = (event: Event) => {
			event.preventDefault();
			event.stopPropagation();

			const now = Date.now();
			if (now - lastHandledAt < 250) {
				return;
			}
			lastHandledAt = now;

			void this.plugin.app.workspace.openLinkText(link.url ?? "", sourcePath, false);
		};

		element.addEventListener("click", openLink);
		element.addEventListener("pointerup", openLink);
		element.addEventListener("touchend", openLink, { passive: false });
	}

	private renderEditButton(
		container: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		startLine: number | undefined,
		endLine: number | undefined,
		content: string
	) {
		if (startLine === undefined || endLine === undefined) {
			return;
		}

		const codeblockDom =
			container.parentElement?.parentElement ?? container.parentElement ?? container;
		mountFloatingEditButton({
			app: this.plugin.app,
			codeblockDom,
			className: "heatmap-codeblock-edit-button",
			iconName: "gantt-chart",
			onClick: () => {
				this.plugin.openBuilderForBlock(ctx.sourcePath, startLine, endLine, content);
			},
		});
	}

	private getBlockId(
		config: ElementCardConfig,
		ctx: MarkdownPostProcessorContext,
		code: string
	): string {
		if (config.id) {
			return config.id;
		}

		// 使用文档路径和代码内容的哈希值作为稳定标识符
		// 这样可以确保在编辑模式和预览模式下保持一致
		const codeHash = this.generateCodeHash(ctx.sourcePath, code);
		const blockId = `${ctx.sourcePath}::${codeHash}`;
		return blockId;
	}

	private generateCodeHash(sourcePath: string, code: string): string {
		// 使用文档路径和代码内容生成哈希值
		const combinedString = `${sourcePath}${code}`;
		let hash = 0;
		for (let i = 0; i < combinedString.length; i++) {
			const char = combinedString.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString();
	}

	private generateConfigHash(config: ElementCardConfig): string {
		// 移除不稳定的属性，只使用影响布局的关键属性
		const { id, ...stableConfig } = config;
		const configString = JSON.stringify(stableConfig);
		let hash = 0;
		for (let i = 0; i < configString.length; i++) {
			const char = configString.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString();
	}

	private getWidthsStorageKey(blockId: string): string {
		return `elementCard-widths-${blockId}`;
	}

	private loadColumnWidths(blockId: string, columns: number): number[] {
		const storageKey = this.getWidthsStorageKey(blockId);
		const stored = this.plugin.app.loadLocalStorage(storageKey);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as number[];
				if (Array.isArray(parsed) && parsed.length === columns) {
					const sum = parsed.reduce((acc, value) => acc + value, 0);
					if (sum > 0) {
						return parsed;
					}
				}
			} catch (error) {
				console.warn("Failed to parse elementCard widths", error);
			}
		}

		return Array.from({ length: columns }, () => 100 / columns);
	}

	private saveColumnWidths(blockId: string, widths: number[]) {
		this.plugin.app.saveLocalStorage(this.getWidthsStorageKey(blockId), JSON.stringify(widths));
	}

	private applyGridTemplate(grid: HTMLElement, widths: number[]) {
		grid.style.gridTemplateColumns = widths.map((value) => `${value}fr`).join(" ");
		grid.style.gridTemplateRows = "auto";
	}

	private mountResizers(
		shell: HTMLElement,
		grid: HTMLElement,
		initialWidths: number[],
		blockId: string
	) {
		if (!this.settings.showResizers) {
			return;
		}

		let widths = [...initialWidths];
		const columnResizers: HTMLElement[] = [];
		const minWidth = this.settings.minColumnWidthPercent ?? DEFAULT_ELEMENTCARD_SETTINGS.minColumnWidthPercent;

		const syncResizers = () => {
			this.applyGridTemplate(grid, widths);
			requestAnimationFrame(() => {
				const shellRect = shell.getBoundingClientRect();
				if (shellRect.width === 0) return;
				const cards = grid.querySelectorAll<HTMLElement>(":scope > .elementCard__card");
				columnResizers.forEach((resizer, index) => {
					const card = cards[index];
					if (card) {
						const cardRight = card.getBoundingClientRect().right - shellRect.left;
						resizer.style.left = `${cardRight}px`;
					}
				});
			});
		};

		// Column resizers (horizontal)
		if (widths.length > 1) {
			for (let index = 0; index < widths.length - 1; index++) {
				const resizer = shell.createDiv({ cls: "elementCard__resizer" });
				resizer.dataset.index = String(index);
				resizer.dataset.direction = "column";
				columnResizers.push(resizer);

				let startX = 0;
				let leftWidth = 0;
				let rightWidth = 0;

				const onMouseMove = (event: MouseEvent) => {
					const shellWidth = shell.getBoundingClientRect().width;
					if (shellWidth <= 0) {
						return;
					}

					const deltaPercent = ((event.clientX - startX) / shellWidth) * 100;
					const nextLeft = leftWidth + deltaPercent;
					const nextRight = rightWidth - deltaPercent;
					if (nextLeft < minWidth || nextRight < minWidth) {
						return;
					}

					widths[index] = nextLeft;
					widths[index + 1] = nextRight;
					syncResizers();
				};

				const onMouseUp = () => {
					document.body.classList.remove("cursor-col-resize");
					document.removeEventListener("mousemove", onMouseMove);
					document.removeEventListener("mouseup", onMouseUp);
					this.saveColumnWidths(blockId, widths);
				};

				resizer.addEventListener("mousedown", (event) => {
					startX = event.clientX;
					leftWidth = widths[index];
					rightWidth = widths[index + 1];
					document.body.classList.add("cursor-col-resize");
					document.addEventListener("mousemove", onMouseMove);
					document.addEventListener("mouseup", onMouseUp);
					event.preventDefault();
				});
			}
		}

		syncResizers();
	}

	private renderErrorTips(container: HTMLElement, summary: string, recommends?: string[]) {
		container.empty();
		const errDiv = container.createDiv({ cls: "elementCard-render-error-container" });
		errDiv.createEl("p", {
			text: summary,
			cls: "summary",
		});
		recommends?.forEach((recommend) => {
			errDiv.createEl("pre", {
				text: recommend,
				cls: "recommend",
			});
		});
	}
}
