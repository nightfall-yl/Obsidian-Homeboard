import { App, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, MinimalSettings } from "./settings";
import {
  loadRules,
  unloadRules,
  updateStyle,
  setFontSize,
  removeSettings,
  removeLightScheme,
  removeDarkScheme,
} from "./styles";
import {
  updateDarkStyle,
  updateLightStyle,
  updateDarkScheme,
  updateLightScheme,
  updateTheme,
  updateSidebar,
} from "./theme";
import { registerAllCommands } from "./commands";
import type { StaticStore } from "../static-store";

/**
 * Minimal 主题设置的宿主管理器。
 * 设置统一存放在 Section2 的 `static-data.json`（经 StaticStore），
 * 与 Dashboard 主数据模型解耦，不占用 loadData()/saveData()。
 */
export class MinimalManager {
  settings: MinimalSettings = { ...DEFAULT_SETTINGS };

  constructor(
    private readonly app: App,
    private readonly plugin: Plugin,
    private readonly store: StaticStore
  ) {}

  async onload(): Promise<void> {
    await this.loadSettings();
    loadRules();
    this.setupListeners();
    this.refresh();
    registerAllCommands(this);
  }

  onunload(): void {
    const sidebarEl = document.getElementsByClassName("mod-left-split")[0];
    if (sidebarEl) sidebarEl.removeClass("theme-dark");
    const ribbonEl = document.getElementsByClassName("side-dock-ribbon")[0];
    if (ribbonEl) ribbonEl.removeClass("theme-dark");

    unloadRules();
    this.removeStyle();
    removeSettings();
    removeLightScheme();
    removeDarkScheme();
  }

  async loadSettings(): Promise<void> {
    this.settings = this.store.settings.minimal;
    await this.resetHiddenToDefaults();
  }

  /**
   * 界面已隐藏的对比度（lightStyle/darkStyle）、Layout/Typography 尺寸，
   * 以及被移除的 Features 设置项，一律固定为默认值，保证「全部默认」；
   * 命令仍可临时调整，重启后归默认。
   */
  private async resetHiddenToDefaults(): Promise<void> {
    const forced: Array<keyof MinimalSettings> = [
      "lightStyle",
      "darkStyle",
      "tableWidth",
      "iframeWidth",
      "imgWidth",
      "chartWidth",
      "mapWidth",
      "textSmall",
      "lineHeight",
      "lineWidth",
      "lineWidthWide",
      "maxWidth",
    ];
    // 被删除的 Features 项——默认开启
    const forcedTrue: Array<keyof MinimalSettings> = [
      "colorfulActiveStates",
      "colorfulHeadings",
      "trimNames",
      "bordersToggle",
      "underlineInternal",
      "underlineExternal",
      "fullWidthMedia",
    ];
    // 被删除的 Features 项——默认关闭
    const forcedFalse: Array<keyof MinimalSettings> = ["labeledNav", "colorfulFrame"];
    let changed = false;
    const settings = this.settings as Record<keyof MinimalSettings, unknown>;
    for (const key of forced) {
      if (settings[key] !== DEFAULT_SETTINGS[key]) {
        settings[key] = DEFAULT_SETTINGS[key];
        changed = true;
      }
    }
    for (const key of forcedTrue) {
      if (settings[key] !== true) {
        settings[key] = true;
        changed = true;
      }
    }
    for (const key of forcedFalse) {
      if (settings[key] !== false) {
        settings[key] = false;
        changed = true;
      }
    }
    if (changed) await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    await this.store.save();
  }

  private setupListeners(): void {
    const settingsUpdate = () => {
      // @ts-ignore Obsidian does not expose these in public typings.
      const fontSize = this.app.vault.getConfig("baseFontSize");
      this.settings.textNormal = fontSize;

      // @ts-ignore
      const folding = this.app.vault.getConfig("foldHeading") ? true : false;
      // @ts-ignore
      const lineNumbers = this.app.vault.getConfig("showLineNumber") ? true : false;
      // @ts-ignore
      const readableLineLength = this.app.vault.getConfig("readableLineLength") ? true : false;

      this.settings.folding = folding;
      this.settings.lineNumbers = lineNumbers;
      this.settings.readableLineLength = readableLineLength;

      document.body.classList.toggle("minimal-folding", folding);
      document.body.classList.toggle("minimal-line-nums", lineNumbers);
      document.body.classList.toggle("minimal-readable", readableLineLength);
      document.body.classList.toggle("minimal-readable-off", !readableLineLength);

      void this.saveSettings();
    };

    const sidebarUpdateCallback = () => updateSidebar(this.settings);

    // @ts-ignore
    this.plugin.registerEvent(this.app.vault.on("config-changed", settingsUpdate));
    // @ts-ignore
    this.plugin.registerEvent(this.app.workspace.on("css-change", sidebarUpdateCallback));

    settingsUpdate();

    this.app.workspace.onLayoutReady(() => {
      updateSidebar(this.settings);
    });
  }

  refresh(): void {
    updateStyle(this.settings);
  }

  registerCommand(id: string, name: string, callback: () => void): void {
    this.plugin.addCommand({ id, name, callback });
  }

  setFontSize(): void {
    setFontSize(this.app, this.settings.textNormal);
  }

  updateDarkStyle(): void {
    updateDarkStyle(this.app, this.settings);
  }

  updateLightStyle(): void {
    updateLightStyle(this.app, this.settings);
  }

  updateDarkScheme(): void {
    updateDarkScheme(this.settings);
  }

  updateLightScheme(): void {
    updateLightScheme(this.settings);
  }

  updateTheme(): void {
    updateTheme(this.app);
  }

  private removeStyle(): void {
    // 卸载时清理 minimal 应用在 body 上的样式类，恢复到干净状态
    document.body.removeClass(
      "minimal-light",
      "minimal-light-tonal",
      "minimal-light-contrast",
      "minimal-light-white",
      "minimal-dark",
      "minimal-dark-tonal",
      "minimal-dark-black",
      "borders-none",
      "colorful-headings",
      "colorful-frame",
      "colorful-active",
      "minimal-focus-mode",
      "links-int-on",
      "links-ext-on",
      "full-width-media",
      "img-grid",
      "minimal-status-off",
      "full-file-names",
      "labeled-nav",
      "minimal-folding",
      "table-wide",
      "table-max",
      "table-100",
      "table-default-width",
      "iframe-wide",
      "iframe-max",
      "iframe-100",
      "iframe-default-width",
      "img-wide",
      "img-max",
      "img-100",
      "img-default-width",
      "chart-wide",
      "chart-max",
      "chart-100",
      "chart-default-width",
      "map-wide",
      "map-max",
      "map-100",
      "map-default-width"
    );
    const style = document.body.style;
    style.removeProperty("--font-ui-small");
    style.removeProperty("--line-height");
    style.removeProperty("--line-width");
    style.removeProperty("--line-width-wide");
    style.removeProperty("--max-width");
  }
}