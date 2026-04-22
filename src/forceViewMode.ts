import {
	WorkspaceLeaf,
	Plugin,
	MarkdownView,
	App,
	TFile,
	TFolder,
	debounce,
} from "obsidian";
import { ForceViewModeSettings } from "./elementCardTypes";

interface ViewState {
	source?: boolean;
	mode?: string;
	[key: string]: unknown;
}

export class ForceViewModeManager {
	private plugin: Plugin;
	private settings: ForceViewModeSettings;
	private openedFiles: string[] = [];

	OBSIDIAN_UI_MODE_KEY = "obsidianUIMode";
	OBSIDIAN_EDITING_MODE_KEY = "obsidianEditingMode";

	constructor(plugin: Plugin, settings: ForceViewModeSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	updateSettings(settings: ForceViewModeSettings) {
		this.settings = settings;
	}

	onload() {
		if (!this.settings.enabled) return;

		this.openedFiles = this.resetOpenedNotes();

		const readViewModeFromFrontmatterAndToggle = async (leaf: WorkspaceLeaf) => {
			let view = leaf.view instanceof MarkdownView ? leaf.view : null;

			if (null === view) {
				if (true == this.settings.ignoreOpenFiles) {
					this.openedFiles = this.resetOpenedNotes();
				}
				return;
			}

			// if setting is true, nothing to do if this was an open note
			if (
				true == this.settings.ignoreOpenFiles &&
				view.file &&
				this.alreadyOpen(view.file)
			) {
				this.openedFiles = this.resetOpenedNotes();
				return;
			}

			let state = leaf.getViewState();
			if (!state.state) return;

			// check if in a declared folder or file
			let folderOrFileModeState: ViewState | null = null;

			const setFolderOrFileModeState = (viewMode: string): void => {
				const [key, mode] = viewMode.split(":").map((s) => s.trim());

				if (key === "default") {
					folderOrFileModeState = null;
					return;
				} else if (!["live", "preview", "source"].includes(mode)) {
					return;
				}

				const currentState = state.state as ViewState;
				folderOrFileModeState = { 
					source: currentState.source ?? false, 
					mode: currentState.mode ?? "source" 
				};
				folderOrFileModeState.mode = mode;

				switch (key) {
					case this.OBSIDIAN_EDITING_MODE_KEY: {
						if (mode == "live") {
							folderOrFileModeState.source = false;
							folderOrFileModeState.mode = "source";
						} else {
							folderOrFileModeState.source = true;
						}
						break;
					}
					case this.OBSIDIAN_UI_MODE_KEY:
						folderOrFileModeState.source = false;
						break;
				}
			};

			// Check folder rules
			for (const folderMode of this.settings.folders) {
				if (folderMode.folder !== "" && folderMode.viewMode && view.file) {
					const folder = this.plugin.app.vault.getAbstractFileByPath(folderMode.folder);
					if (folder instanceof TFolder && view.file.parent) {
						if (
							view.file.parent === folder ||
							view.file.parent.path.startsWith(folder.path)
						) {
							setFolderOrFileModeState(folderMode.viewMode);
						}
					} else {
						console.warn(`ForceViewMode: Folder ${folderMode.folder} does not exist or is not a folder.`);
					}
				}
			}

			// Check file rules
			for (const { filePattern, viewMode } of this.settings.files) {
				if (!filePattern || !viewMode) {
					continue;
				}
				if (!view.file) {
					continue;
				}
				if (!view.file.basename.match(filePattern)) {
					continue;
				}
				setFolderOrFileModeState(viewMode);
			}

			if (folderOrFileModeState) {
				const currentState = state.state as ViewState;
				const targetMode = (folderOrFileModeState as ViewState).mode;
				const targetSource = (folderOrFileModeState as ViewState).source;
				if (
					currentState.mode !== targetMode ||
					currentState.source !== targetSource
				) {
					const newState = { ...state };
					const newStateState: ViewState = { ...currentState };
					if (targetMode !== undefined) {
						newStateState.mode = targetMode;
					}
					if (targetSource !== undefined) {
						newStateState.source = targetSource;
					}
					newState.state = newStateState;
					await leaf.setViewState(newState);
				}
				return;
			}

			// Get frontmatter data
			if (!view.file) return;
			
			const fileCache = this.plugin.app.metadataCache.getFileCache(view.file);
			const fileDeclaredUIMode =
				fileCache !== null && fileCache.frontmatter
					? fileCache.frontmatter[this.OBSIDIAN_UI_MODE_KEY]
					: null;
			const fileDeclaredEditingMode =
				fileCache !== null && fileCache.frontmatter
					? fileCache.frontmatter[this.OBSIDIAN_EDITING_MODE_KEY]
					: null;

			if (fileDeclaredUIMode) {
				if (
					["source", "preview", "live"].includes(fileDeclaredUIMode) &&
					view.getMode() !== fileDeclaredUIMode
				) {
					state.state.mode = fileDeclaredUIMode;
				}
			}

			if (fileDeclaredEditingMode) {
				const shouldBeSourceMode = fileDeclaredEditingMode == "source";
				if (["source", "live"].includes(fileDeclaredEditingMode)) {
					state.state.source = shouldBeSourceMode;
				}
			}

			if (fileDeclaredUIMode || fileDeclaredEditingMode) {
				await leaf.setViewState(state);
				if (true == this.settings.ignoreOpenFiles) {
					this.openedFiles = this.resetOpenedNotes();
				}
				return;
			}

			// Default behavior
			// @ts-ignore - accessing internal vault config
			const defaultViewMode = this.plugin.app.vault.config?.defaultViewMode
				? // @ts-ignore
				  this.plugin.app.vault.config.defaultViewMode
				: "source";
			// @ts-ignore
			const defaultEditingModeIsLivePreview =
				// @ts-ignore
				this.plugin.app.vault.config?.livePreview === undefined
					? true
					: // @ts-ignore
					  this.plugin.app.vault.config.livePreview;

			if (!this.settings.ignoreForceViewAll) {
				const newState = leaf.getViewState();
				if (newState.state) {
					if (view.getMode() !== defaultViewMode) {
						newState.state.mode = defaultViewMode;
					}
					newState.state.source = defaultEditingModeIsLivePreview ? false : true;
					await leaf.setViewState(newState);
				}
				this.openedFiles = this.resetOpenedNotes();
			}
		};

		// Register event
		this.plugin.registerEvent(
			this.plugin.app.workspace.on(
				"active-leaf-change",
				this.settings.debounceTimeout === 0
					? readViewModeFromFrontmatterAndToggle
					: debounce(readViewModeFromFrontmatterAndToggle, this.settings.debounceTimeout)
			)
		);
	}

	onunload() {
		this.openedFiles = [];
	}

	private alreadyOpen(currFile: TFile): boolean {
		const leavesWithSameNote: string[] = [];
		if (currFile == null) {
			return false;
		}
		this.openedFiles.forEach((openedFile: string) => {
			if (openedFile == currFile.basename) {
				leavesWithSameNote.push(openedFile);
			}
		});
		return leavesWithSameNote.length != 0;
	}

	private resetOpenedNotes(): string[] {
		let openedFiles: string[] = [];
		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			let view = leaf.view instanceof MarkdownView ? leaf.view : null;
			if (null === view) {
				return;
			}
			// @ts-ignore - accessing file property
			if (leaf.view?.file?.basename) {
				// @ts-ignore
				openedFiles.push(leaf.view.file.basename);
			}
		});
		return openedFiles;
	}
}
