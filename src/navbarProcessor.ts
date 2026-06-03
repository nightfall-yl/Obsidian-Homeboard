import {
	MarkdownPostProcessorContext,
	MarkdownView,
	setIcon,
} from "obsidian";
import ElementsPlugin from "./main";
import { parseNavBarConfig, NavBarParseError } from "./navbarConfig";
import { NavBarConfig, NavBarItem } from "./navbarTypes";

export class NavBarProcessor {
	private plugin: ElementsPlugin;

	constructor(plugin: ElementsPlugin) {
		this.plugin = plugin;
	}

	render(code: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		try {
			const config = parseNavBarConfig(code);
			this.renderNavBar(config, el, ctx);
		} catch (error) {
			if (error instanceof NavBarParseError) {
				this.renderError(el, error.message);
				return;
			}
			console.error(error);
			this.renderError(el, "navbar 解析失败");
		}
	}

	private renderNavBar(config: NavBarConfig, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// ✅ 保存 Obsidian 原生编辑按钮，渲染后重新挂载到 navbar 外层容器（参照 heatmap renderErrorTips）
		const nativeEditButton =
			el.querySelector<HTMLElement>(".edit-block-button") ??
			el.parentElement?.querySelector<HTMLElement>(".edit-block-button");

		el.empty();

		if (nativeEditButton) {
			el.appendChild(nativeEditButton);
		}

		const nav = el.createDiv({ cls: ["navbar", config.align === "justify" ? "navbar--justify" : "navbar--center"] });

		// 导航项列表
		const list = nav.createDiv({ cls: "navbar__items" });

		// Apply gap — default 1.5rem, responsive via desktop/mobile config
		const applyGap = () => {
			const isMobile = window.innerWidth < 768;
			const colGap = isMobile
				? (config.mobileGap ?? "1.5rem")
				: (config.desktopGap ?? "1.5rem");
			const rowGap = isMobile
				? (config.mobileRowGap ?? "0.5rem")
				: (config.desktopRowGap ?? "0.5rem");
			list.style.columnGap = colGap;
			list.style.rowGap = rowGap;
		};
		applyGap();
		const ro = new ResizeObserver(applyGap);
		ro.observe(nav);
		// ResizeObserver auto-disconnects when element is removed & GC'd
		const activePath = this.getActiveFilePath();

		for (const item of config.items) {
			const itemEl = this.createNavItem(list, item, ctx.sourcePath, activePath);
			this.bindItemEvents(itemEl, item, ctx.sourcePath);
		}
	}

	private createNavItem(
		container: HTMLElement,
		item: NavBarItem,
		sourcePath: string,
		activePath: string | null
	): HTMLElement {
		const hasLink = !!(item.url || item.action);
		const isActive = activePath && item.url
			? this.isItemActive(item.url, activePath)
			: false;

		const el = container.createDiv({
			cls: [
				"navbar__item",
				!hasLink ? "navbar__item--static" : "",
				isActive ? "navbar__item--active" : "",
			],
		});

		if (item.icon) {
			const iconWrap = el.createDiv({ cls: "navbar__item-icon" });
			setIcon(iconWrap, item.icon);
		}

		el.createSpan({ cls: "navbar__item-label", text: item.label });

		if (item.url) {
			el.dataset.href = item.url;
		}
		if (item.action) {
			el.dataset.action = item.action;
		}

		return el;
	}

	private bindItemEvents(el: HTMLElement, item: NavBarItem, sourcePath: string) {
		let lastHandledAt = 0;

		const dedup = (handler: (event: Event) => void) => (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			const now = Date.now();
			if (now - lastHandledAt < 300) return;
			lastHandledAt = now;
			handler(event);
		};

		if (item.action) {
			const handleAction = dedup(() => {
				(this.plugin.app as any).commands.executeCommandById(item.action!);
			});

			el.addEventListener("touchend", handleAction, { passive: false });
			el.addEventListener("click", handleAction);
			return;
		}

		if (item.url) {
			const handleNavigation = dedup(() => {
				void this.plugin.app.workspace.openLinkText(item.url!, sourcePath, false);
			});

			el.addEventListener("touchend", handleNavigation, { passive: false });
			el.addEventListener("click", handleNavigation);
		}
	}

	private getActiveFilePath(): string | null {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		return view?.file?.path ?? null;
	}

	private isItemActive(url: string, activePath: string): boolean {
		const normalizedUrl = url.replace(/\.md$/, "");
		const normalizedPath = activePath.replace(/\.md$/, "");
		return normalizedUrl === normalizedPath || normalizedPath.endsWith("/" + normalizedUrl);
	}

	private renderError(container: HTMLElement, message: string) {
		container.empty();

		const errDiv = container.createDiv({ cls: "navbar-render-error" });
		errDiv.createEl("p", { text: message });
	}
}
