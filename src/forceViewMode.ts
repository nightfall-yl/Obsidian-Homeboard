import type {
  WorkspaceLeaf,
  Plugin,
  TFile} from "obsidian";
import {
  MarkdownView,
  TFolder,
  debounce,
} from "obsidian";
import type { ForceViewModeSettings } from "./models";

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
      const view = leaf.view instanceof MarkdownView ? leaf.view : null;

      if (null === view) {
        if (true == this.settings.ignoreOpenFiles) {
          this.openedFiles = this.resetOpenedNotes();
        }
        return;
      }

      if (
        true == this.settings.ignoreOpenFiles &&
        view.file &&
        this.alreadyOpen(view.file)
      ) {
        this.openedFiles = this.resetOpenedNotes();
        return;
      }

      const state = leaf.getViewState();
      if (!state.state) return;

      let folderOrFileModeState: ViewState | null = null;

      const setFolderOrFileModeState = (viewMode: string): void => {
        const parts = viewMode.split(":").map((s) => s.trim());
        const key = parts[0]!;
        const mode = parts[1]!;

        if (key === "default") {
          folderOrFileModeState = null;
          return;
        } else if (!["live", "preview", "source"].includes(mode)) {
          return;
        }

        const currentState = state.state as ViewState;
        folderOrFileModeState = {
          source: currentState.source ?? false,
          mode: currentState.mode ?? "source",
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
          }
        }
      }

      // Check file rules
      for (const { filePattern, viewMode } of this.settings.files) {
        if (!filePattern || !viewMode) continue;
        if (!view.file) continue;
        if (!view.file.basename.match(filePattern)) continue;
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
      // frontmatter 索引值为 any：先收进 unknown（安全类型），再用 typeof 窄化成 string，
      // 既避免 no-unsafe-assignment，也不会触发 no-unnecessary-type-assertion。
      const uiModeRaw: unknown = fileCache?.frontmatter?.[this.OBSIDIAN_UI_MODE_KEY];
      const editingModeRaw: unknown = fileCache?.frontmatter?.[this.OBSIDIAN_EDITING_MODE_KEY];
      const fileDeclaredUIMode: string | null =
        typeof uiModeRaw === "string" ? uiModeRaw : null;
      const fileDeclaredEditingMode: string | null =
        typeof editingModeRaw === "string" ? editingModeRaw : null;

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
      const cfg = this.plugin.app.vault.config; // 内部未公开配置（见 obsidian-internals.d.ts）
      const defaultViewMode =
        typeof cfg.defaultViewMode === "string" && cfg.defaultViewMode
          ? cfg.defaultViewMode
          : "source";
      const defaultEditingModeIsLivePreview =
        cfg.livePreview === undefined ? true : cfg.livePreview === true;

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

    this.plugin.registerEvent(
      this.plugin.app.workspace.on(
        // @ts-ignore - debounce overload mismatch between handler signatures
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
    if (currFile == null) return false;
    return this.openedFiles.includes(currFile.basename);
  }

  private resetOpenedNotes(): string[] {
    const openedFiles: string[] = [];
    this.plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view instanceof MarkdownView ? leaf.view : null;
      if (null === view) return;
      if (view.file?.basename) {
        openedFiles.push(view.file.basename);
      }
    });
    return openedFiles;
  }
}
