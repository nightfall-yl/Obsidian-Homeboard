import { App, MarkdownView, Notice, View as OView, WorkspaceLeaf } from "obsidian";
import { DEFAULT_HOMEPAGE_SETTINGS, HomepageKind, HomepageSettings, OpenMode, ViewMode } from "./types";

export class Homepage {
	app: App;
	settings: HomepageSettings;
	lastView: MarkdownView | null = null;

	constructor(app: App) {
		this.app = app;
		this.settings = { ...DEFAULT_HOMEPAGE_SETTINGS };
	}

	updateSettings(settings: HomepageSettings): void {
		this.settings = settings;
	}

	async open(alternate: boolean = false): Promise<void> {
		if (this.settings.kind === HomepageKind.DailyNote && !this.hasDailyNotesPlugin()) {
			new Notice("日记插件未启用");
			return;
		}

		const mode = alternate ? OpenMode.Retain : this.settings.openMode;
		await this.launchLeaf(mode);
	}

	private async launchLeaf(mode: OpenMode): Promise<void> {
		let leaf: WorkspaceLeaf | undefined;

		const computedValue = await this.computeValue();

		if (mode !== OpenMode.ReplaceAll) {
			const alreadyOpened = this.getOpened(computedValue);
			if (alreadyOpened.length > 0) {
				this.app.workspace.setActiveLeaf(alreadyOpened[0]);
				await this.configure(alreadyOpened[0]);
				return;
			} else if (mode === OpenMode.Retain && this.isEmptyView()) {
				mode = OpenMode.ReplaceLast;
			}
		}

		if (mode !== OpenMode.Retain) {
			this.app.workspace.getActiveViewOfType(OView)?.leaf.setPinned(false);
		}
		if (mode === OpenMode.ReplaceAll) {
			await this.detachAllLeaves();
		}

		leaf = await this.launchNote(computedValue);
		if (!leaf) return;

		await this.configure(leaf);
	}

	private async launchNote(value: string): Promise<WorkspaceLeaf | undefined> {
		let file = this.app.metadataCache.getFirstLinkpathDest(value, "/");

		if (!file) {
			if (!this.settings.autoCreate) {
				new Notice(`文件不存在: ${value}`);
				return undefined;
			}
			file = await this.app.vault.create(this.ensureMdExt(value), "");
		}

		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
		this.app.workspace.setActiveLeaf(leaf);

		return leaf;
	}

	private async configure(leaf: WorkspaceLeaf): Promise<void> {
		const view = leaf.view;

		if (!(view instanceof MarkdownView)) {
			return;
		}

		if (this.settings.revertView) {
			this.lastView = view;
		}

		if (this.settings.viewMode === ViewMode.Default) return;

		const targetMode = this.settings.viewMode;

		for (let attempt = 0; attempt < 10; attempt++) {
			await new Promise((r) => setTimeout(r, 100));
			const currentMode = view.getMode();
			const state = view.getState();

			let needSwitch = false;
			switch (targetMode) {
				case ViewMode.Reading:
					if (currentMode !== "preview") needSwitch = true;
					break;
				case ViewMode.LivePreview:
					if (currentMode !== "source" || state.source !== false) needSwitch = true;
					break;
				case ViewMode.Source:
					if (currentMode !== "source" || state.source !== true) needSwitch = true;
					break;
			}

			if (!needSwitch) return;

			switch (targetMode) {
				case ViewMode.Reading:
					state.mode = "preview";
					break;
				case ViewMode.LivePreview:
					state.mode = "source";
					state.source = false;
					break;
				case ViewMode.Source:
					state.mode = "source";
					state.source = true;
					break;
			}

			try {
				await view.leaf.setViewState({ type: "markdown", state: state });
			} catch {
				break;
			}
		}
	}

	getOpened(value: string): WorkspaceLeaf[] {
		const leaves = ["markdown", "canvas", "kanban"].flatMap((type) =>
			this.app.workspace.getLeavesOfType(type)
		);

		return leaves.filter((leaf) => {
			const name = leaf.view.getState().file as string;
			const normalized = name.endsWith(".md") ? name.slice(0, -3) : name;
			return normalized.toLowerCase() === value.toLowerCase();
		});
	}

	private async computeValue(): Promise<string> {
		if (this.settings.kind === HomepageKind.DailyNote) {
			return this.getDailyNotePath();
		}
		return this.settings.value;
	}

	private getDailyNotePath(): string {
		try {
			const dailyNotesPlugin = (this.app as any).internalPlugins?.getPluginById("daily-notes")?.instance;
			if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) return "Home";

			const moment = window.moment();
			const filePath = dailyNotesPlugin.getFilePath(moment.format(dailyNotesPlugin.settings.format));
			return filePath.replace(/\.md$/, "");
		} catch {
			return "Home";
		}
	}

	private hasDailyNotesPlugin(): boolean {
		const plugin = (this.app as any).internalPlugins?.getPluginById("daily-notes");
		return !!plugin?.enabled;
	}

	private isEmptyView(): boolean {
		return (
			this.app.workspace.getActiveViewOfType(OView)?.getViewType() ===
			"empty"
		);
	}

	private ensureMdExt(path: string): string {
		const parts = path.split("/");
		const last = parts[parts.length - 1];
		if (last.includes(".")) return path;
		return `${path}.md`;
	}

	private async detachAllLeaves(): Promise<void> {
		const layout = this.app.workspace.getLayout();

		layout.main = {
			id: "5324373015726ba8",
			type: "split",
			children: [
				{
					id: "4509724f8bf84da7",
					type: "tabs",
					children: [
						{
							id: "e7a7b303c61786dc",
							type: "leaf",
							state: {
								type: "empty",
								state: {},
								icon: "lucide-file",
								title: "New tab",
							},
						},
					],
				},
			],
			direction: "vertical",
		};
		layout.active = "e7a7b303c61786dc";

		await this.app.workspace.changeLayout(layout);
	}

	async revertViewIfNeeded(): Promise<void> {
		if (!this.lastView || this.settings.viewMode === ViewMode.Default) return;

		const view = this.lastView;
		if (!view || !view.file) return;

		const currentValue = view.file.path.replace(/\.md$/, "");
		const computedValue = await this.computeValue();

		if (currentValue.toLowerCase() === computedValue.toLowerCase()) return;

		const state = view.getState();
		const config = (this.app.vault as any).config || {};
		const mode = config.defaultViewMode || "source";
		const source =
			config.livePreview !== undefined ? !config.livePreview : false;

		if (
			view.leaf.getViewState().type === "markdown" &&
			(mode !== state.mode || source !== state.source)
		) {
			state.mode = mode;
			state.source = source;
			await view.leaf.setViewState({
				type: "markdown",
				state: state,
				active: true,
			});
		}

		this.lastView = null;
	}

	async openWhenEmpty(): Promise<void> {
		const leaf = this.app.workspace.getActiveViewOfType(OView)?.leaf;
		if (
			!leaf ||
			leaf.getViewState().type !== "empty" ||
			(leaf as any).parentSplit?.children?.length !== 1
		)
			return;

		await this.open(true);
	}
}
