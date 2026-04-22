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

	constructor(plugin: ElementsPlugin, settings: ElementCardComponentSettings) {
		this.plugin = plugin;
		this.settings = settings;
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
		const blockId = this.getBlockId(config, ctx, el);

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
		const heights = this.loadRowHeights(blockId, 1);
		this.applyGridTemplate(grid, widths, heights);
		const isSourceMode =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode?.() === "source";

		for (const card of cards) {
			const cardEl = grid.createDiv({ cls: "elementCard__card" });
			const palette = resolveElementCardCardPalette(card);
			cardEl.dataset.type = "links";
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
			this.mountResizers(shell, grid, widths, heights, blockId);
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
		if (card.linksLayout === "inline") {
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
		return container.createEl("button", {
			text: link.label,
			cls: "elementCard__link-button internal-link",
			attr: { type: "button" },
		});
	}

	private bindInternalLink(element: HTMLElement, link: ElementCardLinkItem, sourcePath: string) {
		element.dataset.href = link.url;
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

			void this.plugin.app.workspace.openLinkText(link.url, sourcePath, false);
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
			className: "contribution-graph-codeblock-edit-button",
			iconName: "gantt-chart",
			onClick: () => {
				this.plugin.openBuilderForBlock(ctx.sourcePath, startLine, endLine, content);
			},
		});
	}

	private getBlockId(
		config: ElementCardConfig,
		ctx: MarkdownPostProcessorContext,
		el: HTMLElement
	): string {
		if (config.id) {
			return config.id;
		}

		const lineStart = ctx.getSectionInfo?.(el)?.lineStart ?? 0;
		return `${ctx.sourcePath}::${lineStart}`;
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

	private getHeightsStorageKey(blockId: string): string {
		return `elementCard-heights-${blockId}`;
	}

	private loadRowHeights(blockId: string, rows: number): number[] {
		const storageKey = this.getHeightsStorageKey(blockId);
		const stored = this.plugin.app.loadLocalStorage(storageKey);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as number[];
				if (Array.isArray(parsed) && parsed.length === rows) {
					return parsed;
				}
			} catch (error) {
				console.warn("Failed to parse elementCard heights", error);
			}
		}

		return Array.from({ length: rows }, () => 100);
	}

	private saveRowHeights(blockId: string, heights: number[]) {
		this.plugin.app.saveLocalStorage(this.getHeightsStorageKey(blockId), JSON.stringify(heights));
	}

	private applyGridTemplate(grid: HTMLElement, widths: number[], heights?: number[]) {
		grid.style.gridTemplateColumns = widths.map((value) => `${value}%`).join(" ");
		if (heights && heights.length > 0) {
			grid.style.gridTemplateRows = heights.map((value) => `${value}px`).join(" ");
		}
	}

	private mountResizers(
		shell: HTMLElement,
		grid: HTMLElement,
		initialWidths: number[],
		initialHeights: number[],
		blockId: string
	) {
		if (!this.settings.showResizers) {
			return;
		}

		let widths = [...initialWidths];
		const columnResizers: HTMLElement[] = [];
		const minWidth = this.settings.minColumnWidthPercent ?? DEFAULT_ELEMENTCARD_SETTINGS.minColumnWidthPercent;

		let heights = [...initialHeights];
		const rowResizers: HTMLElement[] = [];

		const syncResizers = () => {
			let cumulativeWidth = 0;
			columnResizers.forEach((resizer, index) => {
				cumulativeWidth += widths[index];
				resizer.style.left = `calc(${cumulativeWidth}% - var(--elementCard-resizer-width, 4px) / 2)`;
			});
			
			let cumulativeHeight = 0;
			rowResizers.forEach((resizer, index) => {
				cumulativeHeight += heights[index];
				resizer.style.top = `calc(${cumulativeHeight}px - var(--elementCard-resizer-width, 4px) / 2)`;
			});
			
			this.applyGridTemplate(grid, widths, heights);
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

		// Row resizers (vertical)
		// For single row, add a resizer at the bottom to adjust the row height
		if (heights.length === 1) {
			const resizer = shell.createDiv({ cls: "elementCard__resizer elementCard__resizer-row elementCard__resizer-single" });
			resizer.dataset.index = "0";
			resizer.dataset.direction = "row";
			resizer.style.top = "100%";
			rowResizers.push(resizer);

			let startY = 0;
			let currentHeight = 0;

			const onMouseMove = (event: MouseEvent) => {
				const delta = event.clientY - startY;
				const nextHeight = currentHeight + delta;
				if (nextHeight < 50) {
					return;
				}

				heights[0] = nextHeight;
				syncResizers();
			};

			const onMouseUp = () => {
				document.body.classList.remove("cursor-row-resize");
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				this.saveRowHeights(blockId, heights);
			};

			resizer.addEventListener("mousedown", (event) => {
				startY = event.clientY;
				currentHeight = heights[0];
				document.body.classList.add("cursor-row-resize");
				document.addEventListener("mousemove", onMouseMove);
				document.addEventListener("mouseup", onMouseUp);
				event.preventDefault();
			});
		} else if (heights.length > 1) {
			for (let index = 0; index < heights.length - 1; index++) {
				const resizer = shell.createDiv({ cls: "elementCard__resizer elementCard__resizer-row" });
				resizer.dataset.index = String(index);
				resizer.dataset.direction = "row";
				rowResizers.push(resizer);

				let startY = 0;
				let topHeight = 0;
				let bottomHeight = 0;

				const onMouseMove = (event: MouseEvent) => {
					const delta = event.clientY - startY;
					const nextTop = topHeight + delta;
					const nextBottom = bottomHeight - delta;
					if (nextTop < 50 || nextBottom < 50) {
						return;
					}

					heights[index] = nextTop;
					heights[index + 1] = nextBottom;
					syncResizers();
				};

				const onMouseUp = () => {
					document.body.classList.remove("cursor-row-resize");
					document.removeEventListener("mousemove", onMouseMove);
					document.removeEventListener("mouseup", onMouseUp);
					this.saveRowHeights(blockId, heights);
				};

				resizer.addEventListener("mousedown", (event) => {
					startY = event.clientY;
					topHeight = heights[index];
					bottomHeight = heights[index + 1];
					document.body.classList.add("cursor-row-resize");
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
