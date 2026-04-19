import { App, Plugin, TAbstractFile, Editor, TFile, MarkdownView } from "obsidian";
import { CursorPositionSettings, SAFE_DB_FLUSH_INTERVAL } from "./homepageTypes";

interface EphemeralState {
	cursor?: {
		from: {
			ch: number;
			line: number;
		};
		to: {
			ch: number;
			line: number;
		};
	};
	scroll?: number;
}

export class CursorPositionManager {
	private plugin: Plugin;
	private settings: CursorPositionSettings;
	private db: { [file_path: string]: EphemeralState } = {};
	private lastSavedDb: { [file_path: string]: EphemeralState } = {};
	private lastEphemeralState: EphemeralState = {};
	private lastLoadedFileName: string = "";
	private loadedLeafIdList: string[] = [];
	private loadingFile = false;

	constructor(plugin: Plugin, settings: CursorPositionSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	updateSettings(settings: CursorPositionSettings) {
		this.settings = settings;
	}

	async onload() {
		if (!this.settings.enabled) return;

		try {
			this.db = await this.readDb();
			this.lastSavedDb = await this.readDb();
		} catch (e) {
			console.error("Remember Cursor Position plugin can't read database: " + e);
			this.db = {};
			this.lastSavedDb = {};
		}

		// Register events
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-open", (file) => this.restoreEphemeralState(file || undefined))
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("quit", () => {
				this.writeDb(this.db);
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => this.renameFile(file, oldPath))
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => this.deleteFile(file))
		);

		// Check ephemeral state changed every 100ms
		this.plugin.registerInterval(
			window.setInterval(() => this.checkEphemeralStateChanged(), 100)
		);

		// Write db periodically
		this.plugin.registerInterval(
			window.setInterval(() => this.writeDb(this.db), this.settings.saveTimer)
		);

		this.restoreEphemeralState();
	}

	onunload() {
		this.writeDb(this.db);
	}

	private renameFile(file: TAbstractFile, oldPath: string) {
		let newName = file.path;
		let oldName = oldPath;
		this.db[newName] = this.db[oldName];
		delete this.db[oldName];
	}

	private deleteFile(file: TAbstractFile) {
		let fileName = file.path;
		delete this.db[fileName];
	}

	private checkEphemeralStateChanged() {
		if (!this.settings.enabled) return;

		let fileName = this.plugin.app.workspace.getActiveFile()?.path;

		// waiting for load new file
		if (!fileName || !this.lastLoadedFileName || fileName != this.lastLoadedFileName || this.loadingFile)
			return;

		let st = this.getEphemeralState();

		if (!this.lastEphemeralState) this.lastEphemeralState = st;

		if (!isNaN(st.scroll!) && !this.isEphemeralStatesEquals(st, this.lastEphemeralState)) {
			this.saveEphemeralState(st);
			this.lastEphemeralState = st;
		}
	}

	private isEphemeralStatesEquals(state1: EphemeralState, state2: EphemeralState): boolean {
		if (state1.cursor && !state2.cursor) return false;
		if (!state1.cursor && state2.cursor) return false;

		if (state1.cursor && state2.cursor) {
			if (state1.cursor.from.ch != state2.cursor.from.ch) return false;
			if (state1.cursor.from.line != state2.cursor.from.line) return false;
			if (state1.cursor.to.ch != state2.cursor.to.ch) return false;
			if (state1.cursor.to.line != state2.cursor.to.line) return false;
		}

		if (state1.scroll && !state2.scroll) return false;
		if (!state1.scroll && state2.scroll) return false;
		if (state1.scroll && state1.scroll != state2.scroll) return false;

		return true;
	}

	private async saveEphemeralState(st: EphemeralState) {
		let fileName = this.plugin.app.workspace.getActiveFile()?.path;
		if (fileName && fileName == this.lastLoadedFileName) {
			this.db[fileName] = st;
		}
	}

	private async restoreEphemeralState(file?: TFile) {
		if (!this.settings.enabled) return;

		let fileName = this.plugin.app.workspace.getActiveFile()?.path;

		if (fileName && this.loadingFile && this.lastLoadedFileName == fileName) return;

		let activeLeaf = this.plugin.app.workspace.getMostRecentLeaf();
		// @ts-ignore no-official-API
		if (activeLeaf && this.loadedLeafIdList.includes(activeLeaf.id + ":" + activeLeaf.getViewState().state.file))
			return;

		this.loadedLeafIdList = [];
		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type === "markdown") {
				// @ts-ignore no-official-API
				this.loadedLeafIdList.push(leaf.id + ":" + leaf.getViewState().state.file);
			}
		});

		this.loadingFile = true;

		if (this.lastLoadedFileName != fileName) {
			this.lastEphemeralState = {};
			this.lastLoadedFileName = fileName || "";

			let st: EphemeralState | undefined;

			if (fileName) {
				st = this.db[fileName];
				if (st) {
					// waiting for load note
					await this.delay(this.settings.delayAfterFileOpening);

					// Don't scroll when a link scrolls and highlights text
					let containsFlashingSpan = this.plugin.app.workspace.containerEl.querySelector(".is-flashing");

					if (!containsFlashingSpan) {
						await this.delay(10);
						this.setEphemeralState(st);
					}
				}
			}
			this.lastEphemeralState = st || {};
		}

		this.loadingFile = false;
	}

	private async readDb(): Promise<{ [file_path: string]: EphemeralState }> {
		let db: { [file_path: string]: EphemeralState } = {};

		if (await this.plugin.app.vault.adapter.exists(this.settings.dbFileName)) {
			let data = await this.plugin.app.vault.adapter.read(this.settings.dbFileName);
			db = JSON.parse(data);
		}

		return db;
	}

	private async writeDb(db: { [file_path: string]: EphemeralState }) {
		if (!this.settings.enabled) return;

		// create folder for db file if not exist
		let newParentFolder = this.settings.dbFileName.substring(
			0,
			this.settings.dbFileName.lastIndexOf("/")
		);
		if (newParentFolder && !(await this.plugin.app.vault.adapter.exists(newParentFolder))) {
			this.plugin.app.vault.adapter.mkdir(newParentFolder);
		}

		if (JSON.stringify(this.db) !== JSON.stringify(this.lastSavedDb)) {
			this.plugin.app.vault.adapter.write(this.settings.dbFileName, JSON.stringify(db));
			this.lastSavedDb = JSON.parse(JSON.stringify(db));
		}
	}

	private getEphemeralState(): EphemeralState {
		let state: EphemeralState = {};
		state.scroll = Number(
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.currentMode?.getScroll()?.toFixed(4)
		);

		let editor = this.getEditor();
		if (editor) {
			let from = editor.getCursor("anchor");
			let to = editor.getCursor("head");
			if (from && to) {
				state.cursor = {
					from: {
						ch: from.ch,
						line: from.line,
					},
					to: {
						ch: to.ch,
						line: to.line,
					},
				};
			}
		}

		return state;
	}

	private setEphemeralState(state: EphemeralState) {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

		if (state.cursor) {
			let editor = this.getEditor();
			if (editor) {
				editor.setSelection(state.cursor.from, state.cursor.to);
			}
		}

		if (view && state.scroll) {
			view.setEphemeralState(state);
		}
	}

	private getEditor(): Editor | undefined {
		return this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
	}

	private async delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
