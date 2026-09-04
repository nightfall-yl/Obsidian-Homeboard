/**
 * Section2「Markdown+」设置的统一存储。
 * 视图模式(forceViewMode)、Minimal 主题、Linter Lite 三个功能共用插件目录下的
 * `static-data.json`，与 Dashboard 主 data.json 解耦，避免带动 activity 等
 * 重量级缓存整体序列化。三个功能写入触发场景不同，但均为轻量小对象，整文件重写成本可忽略。
 */
import type { Plugin} from "obsidian";
import { normalizePath } from "obsidian";
import type { ForceViewModeSettings } from "./models";
import { DEFAULT_FORCE_VIEW_MODE_SETTINGS } from "./models";
import {
  DEFAULT_SETTINGS as MINIMAL_DEFAULT,
  type MinimalSettings,
} from "./minimal/settings";
import {
  DEFAULT_SETTINGS as LINTER_DEFAULT,
  type LinterSettings,
} from "./linter/settings";

/** Section2 设置文件名（三个功能共用）。 */
export const STATIC_DATA_FILE = "static-data.json";

/** 旧版独立文件名（仅用于一次性迁移读取，迁移成功后不再写回）。 */
const LEGACY_MINIMAL_FILE = "minimal-settings.json";
const LEGACY_LINTER_FILE = "linter-settings.json";

export interface StaticSettings {
  forceViewMode: ForceViewModeSettings;
  minimal: MinimalSettings;
  linter: LinterSettings;
}

/**
 * 统一读写 `static-data.json`。`settings` 是内存中的权威对象，
 * 三个 manager（forceView / minimal / linter）各自持有对对应子块的引用，
 * 任何修改后调用 `save()` 落盘。
 */
export class StaticStore {
  settings: StaticSettings = {
    forceViewMode: { ...DEFAULT_FORCE_VIEW_MODE_SETTINGS },
    minimal: { ...MINIMAL_DEFAULT },
    linter: structuredClone(LINTER_DEFAULT),
  };

  constructor(private readonly plugin: Plugin) {}

  /**
   * 统一用 normalizePath 拼接插件目录路径（manifest.dir 不含尾部斜杠），
   * 避免目录名与文件名粘连、把文件写到错误的层级。
   */
  private pathInPluginDir(fileName: string): string {
    return normalizePath([this.plugin.manifest.dir, fileName].filter(Boolean).join("/"));
  }

  private settingsPath(): string {
    return this.pathInPluginDir(STATIC_DATA_FILE);
  }

  /**
   * 从 static-data.json 读取并按默认值补全缺块。
   * 注意：首次迁移见 `migrateFromLegacy()`，由 main 在插件加载时调用。
   */
  async load(): Promise<void> {
    const adapter = this.plugin.app.vault.adapter;
    let persisted: Partial<StaticSettings> | null = null;
    // 优先读正确位置；否则回退读早期「路径粘连」bug 产生的错位文件。
    const candidates = Array.from(
      new Set([this.settingsPath(), normalizePath([this.plugin.manifest.dir, STATIC_DATA_FILE].join(""))])
    );
    for (const path of candidates) {
      try {
        if (await adapter.exists(path)) {
          persisted = JSON.parse(
            (await adapter.read(path))
          ) as Partial<StaticSettings>;
          break;
        }
      } catch {
        persisted = null;
      }
    }

    this.settings.forceViewMode = {
      ...DEFAULT_FORCE_VIEW_MODE_SETTINGS,
      ...(persisted?.forceViewMode ?? {}),
    };
    this.settings.minimal = {
      ...MINIMAL_DEFAULT,
      ...(persisted?.minimal ?? {}),
    };
    this.settings.linter = {
      ...LINTER_DEFAULT,
      ...(persisted?.linter ?? {}),
      yamlTimestamp: {
        ...LINTER_DEFAULT.yamlTimestamp,
        ...(persisted?.linter?.yamlTimestamp ?? {}),
      },
    };
  }

  /**
   * 一次性迁移：当 static-data.json 尚不存在时，把旧版
   * minimal-settings.json / linter-settings.json 内容并入并写回新文件。
   * forceViewMode 的历史值不在旧独立文件中，由 main 从旧主 data.json 迁移。
   */
  async migrateFromLegacy(): Promise<void> {
    const adapter = this.plugin.app.vault.adapter;
    // 兼容读取旧文件：既检查正确位置（插件目录下），也检查早期「路径粘连」bug
    // 产生的错位文件（.obsidian/plugins/astral-trekminimal-settings.json 等）。
    const candidatePaths = (fileName: string): string[] => {
      const correct = this.pathInPluginDir(fileName);
      const misplaced = normalizePath([this.plugin.manifest.dir, fileName].join(""));
      return Array.from(new Set([correct, misplaced]));
    };

    let migrated = false;
    for (const minPath of candidatePaths(LEGACY_MINIMAL_FILE)) {
      try {
        if (await adapter.exists(minPath)) {
          const legacy = JSON.parse(
            (await adapter.read(minPath))
          ) as Partial<MinimalSettings>;
          this.settings.minimal = { ...MINIMAL_DEFAULT, ...legacy };
          migrated = true;
          break;
        }
      } catch {
        // 旧文件损坏则忽略，走默认值
      }
    }
    for (const linterPath of candidatePaths(LEGACY_LINTER_FILE)) {
      try {
        if (await adapter.exists(linterPath)) {
          const legacy = JSON.parse(
            (await adapter.read(linterPath))
          ) as Partial<LinterSettings>;
          this.settings.linter = {
            ...LINTER_DEFAULT,
            ...legacy,
            yamlTimestamp: {
              ...LINTER_DEFAULT.yamlTimestamp,
              ...(legacy.yamlTimestamp ?? {}),
            },
          };
          migrated = true;
          break;
        }
      } catch {
        // 旧文件损坏则忽略，走默认值
      }
    }
    if (migrated) await this.save();
  }

  async save(): Promise<void> {
    const adapter = this.plugin.app.vault.adapter;
    await adapter.write(
      this.settingsPath(),
      JSON.stringify(this.settings, null, 2)
    );
  }
}