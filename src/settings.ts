import {
  AbstractInputSuggest,
  Modal,
  PluginSettingTab,
  SettingGroup,
  TFolder,
  TFile,
  normalizePath,
  setIcon,
} from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import type AstraDashboardPlugin from "./main";
import type { StartupMode } from "./models";
import {
  DEFAULT_CALENDAR_SETTINGS,
  DEFAULT_CURSOR_POSITION_SETTINGS,
  DEFAULT_QUICK_CAPTURE_SETTINGS,
  DEFAULT_DIARY_SETTINGS,
  DEFAULT_COUNTDOWN_SETTINGS,
  DEFAULT_DAILY_PHRASE_SETTINGS
} from "./models";
import { lightSchemeOptions, darkSchemeOptions } from "./minimal/schemes";

export class AstraSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly astraPlugin: AstraDashboardPlugin
  ) {
    super(app, astraPlugin);
  }

  display(): void {
    renderSettings(this.containerEl, this.astraPlugin);
  }

  /**
   * 声明式设置 API（Obsidian 1.13+）：
   * 本插件设置页为命令式构建（见下方 renderSettings），返回空数组以保持
   * Obsidian 继续调用 display() 走命令式渲染，避免声明式接管整页设置。
   * 该空实现仅为显式声明“已采纳声明式接口”，供设置搜索/校验器识别。
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [];
  }

  getControlValue(): unknown {
    return undefined;
  }

  setControlValue(_key: string, _value: unknown): void | Promise<void> {}
}

export class AstraSettingsModal extends Modal {
  constructor(
    app: App,
    private readonly astraPlugin: AstraDashboardPlugin
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("astra-settings-modal");
    renderSettings(this.contentEl, this.astraPlugin);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/**
 * 「项目文件夹」输入框的文件夹联想（学习 Obsidian 官方「文件与链接 → 附件文件夹路径」的
 * FolderSuggest：输入时按路径前缀联想库内文件夹，选中后回填相对路径）。
 */
class ProjectFolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private readonly onApply: (path: string) => void
  ) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFolder[] {
    const lower = query.trim().toLowerCase();
    const folders: TFolder[] = [];
    const limit = this.limit || 100;
    for (const file of this.app.vault.getAllLoadedFiles()) {
      if (!(file instanceof TFolder)) continue;
      if (folders.length >= limit) break;
      // 根目录不列为建议
      if (file.path === "/") continue;
      // 空查询列出全部文件夹；否则按「任一段路径包含」联想
      if (!lower || file.path.toLowerCase().includes(lower)) folders.push(file);
    }
    return folders;
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  selectSuggestion(folder: TFolder, _evt: MouseEvent | KeyboardEvent): void {
    this.setValue(folder.path);
    this.close();
    this.onApply(folder.path);
  }
}

/**
 * 「快速捕获文件」输入框的文件联想（与「项目文件夹」的 FolderSuggest 同一交互，面向库内 md 笔记）。
 */
class ProjectFileSuggest extends AbstractInputSuggest<TFile> {
  constructor(
    app: App,
    inputEl: HTMLInputElement,
    private readonly onApply: (path: string) => void
  ) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFile[] {
    const lower = query.trim().toLowerCase();
    const files: TFile[] = [];
    const limit = this.limit || 100;
    for (const file of this.app.vault.getAllLoadedFiles()) {
      if (!(file instanceof TFile) || file.extension !== "md") continue;
      if (files.length >= limit) break;
      if (!lower || file.path.toLowerCase().includes(lower)) files.push(file);
    }
    return files;
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  selectSuggestion(file: TFile, _evt: MouseEvent | KeyboardEvent): void {
    this.setValue(file.path);
    this.close();
    this.onApply(file.path);
  }
}

type SettingsSection = {
  id: string;
  label: string;
  icon: string;
};

function renderSettings(
  container: HTMLElement,
  plugin: AstraDashboardPlugin
): void {
  container.empty();
  container.addClass("astra-settings-root");

  // Defensive: ensure new settings exist (in case data.json predates migration)
  if (!plugin.data.settings.calendar) {
    plugin.data.settings.calendar = { ...DEFAULT_CALENDAR_SETTINGS };
  }
  if (!plugin.data.settings.cursorPosition) {
    plugin.data.settings.cursorPosition = { ...DEFAULT_CURSOR_POSITION_SETTINGS };
  }
  if (!plugin.data.settings.quickCapture) {
    plugin.data.settings.quickCapture = { ...DEFAULT_QUICK_CAPTURE_SETTINGS };
  } else {
    // 迁移旧字段：旧版按「文件夹 + 命名模板」每日新建笔记；新版改为追加写入指定文件
    const qc = plugin.data.settings.quickCapture as typeof plugin.data.settings.quickCapture & {
      storagePath?: string;
      namingPattern?: string;
      templateFile?: string;
    };
    if (typeof qc.filePath !== "string" || !qc.filePath.trim()) {
      const dir = (qc.storagePath ?? "").trim().replace(/\/+$/, "");
      // 只从旧字段继承目录；没有则留空，由用户在设置里自行选择
      qc.filePath = dir ? `${dir}/快速捕获.md` : "";
      delete qc.storagePath;
      delete qc.namingPattern;
      delete qc.templateFile;
    }
  }
  if (!plugin.data.settings.diary) {
    plugin.data.settings.diary = { ...DEFAULT_DIARY_SETTINGS };
  }
  if (!plugin.data.settings.countdown) {
    plugin.data.settings.countdown = { ...DEFAULT_COUNTDOWN_SETTINGS };
  }
  if (!plugin.data.settings.dailyPhrase) {
    plugin.data.settings.dailyPhrase = { ...DEFAULT_DAILY_PHRASE_SETTINGS };
  }
  if (!plugin.data.settings.npdpStages) {
    plugin.data.settings.npdpStages = ["Charter", "PDCP", "TR", "ADCP", "COR"];
  }
  if (typeof plugin.data.settings.projectsFolder !== "string") {
    plugin.data.settings.projectsFolder = "Projects";
  }
  // Defensive: ensure project-board (gantt/list) settings exist for older data.json
  if (typeof plugin.data.settings.currentPoView !== "string") {
    plugin.data.settings.currentPoView = "gantt";
  }
  if (typeof plugin.data.settings.poGanttScale !== "string") {
    plugin.data.settings.poGanttScale = "week";
  }
  if (!Array.isArray(plugin.data.settings.poGanttStatusFilter)) {
    plugin.data.settings.poGanttStatusFilter = [];
  }
  if (!Array.isArray(plugin.data.settings.poProjectOrder)) {
    plugin.data.settings.poProjectOrder = [];
  }
  if (!Array.isArray(plugin.data.settings.poTaskOrder)) {
    plugin.data.settings.poTaskOrder = [];
  }
  if (!Array.isArray(plugin.data.settings.mobileHiddenModules)) {
    plugin.data.settings.mobileHiddenModules = ["todo", "weekly", "projects", "countdown"];
  }
  // 对齐当前默认：本应默认在移动端显示、且用户仍在主页保留的模块，
  // 不应残留在 mobileHiddenModules（旧数据/手动误隐藏会导致移动端整卡消失，如每日口语）。
  // 仅清理「默认可见且仍在 homeModuleOrder」的模块，不动用户真正想隐藏的 todo/progress 等。
  {
    const mobileVisibleByDefault = ["qc", "dailyPhrase", "recent"];
    const order = plugin.data.settings.homeModuleOrder ?? [];
    plugin.data.settings.mobileHiddenModules = plugin.data.settings.mobileHiddenModules.filter(
      (id) => !(mobileVisibleByDefault.includes(id) && order.includes(id))
    );
  }

  const sections: SettingsSection[] = [
    {
      id: "dashboard",
      label: "Astra",
      icon: "layout-dashboard",
    },
    {
      id: "markdown",
      label: "Markdown +",
      icon: "file-text",
    },
  ];

  const navEl = container.createDiv({ cls: "astra-settings-nav" });
  const contentEl = container.createDiv({ cls: "astra-settings-content" });
  const sectionEls = new Map<string, HTMLElement>();
  const navButtons = new Map<string, HTMLButtonElement>();

  const setActiveSection = (sectionId: string) => {
    sectionEls.forEach((sectionEl, id) => {
      sectionEl.toggleClass("is-active", id === sectionId);
    });
    navButtons.forEach((button, id) => {
      button.toggleClass("is-active", id === sectionId);
    });
  };

  sections.forEach((section, index) => {
    const button = navEl.createEl("button", {
      cls: "astra-settings-nav-btn",
      attr: { type: "button" },
    });
    const iconEl = button.createSpan({ cls: "astra-settings-nav-icon" });
    setIcon(iconEl, section.icon);
    button.createSpan({ text: section.label });
    button.addEventListener("click", () => setActiveSection(section.id));
    navButtons.set(section.id, button);

    const sectionEl = contentEl.createDiv({ cls: "astra-settings-section" });
    sectionEls.set(section.id, sectionEl);
    if (index === 0) {
      sectionEl.addClass("is-active");
      button.addClass("is-active");
    }
  });

  // ===================== Dashboard =====================
  const dashboardEl = sectionEls.get("dashboard")!;

  // ── 通用 ──
  const generalGroup = new SettingGroup(dashboardEl).setHeading("通用");

  generalGroup.addSetting((setting) => {
    setting
      .setName("问候名称")
      .setDesc("可选。留空时首页只显示时段问候。")
      .addText((text) =>
        text
          .setPlaceholder("例如 Sean")
          .setValue(plugin.data.settings.displayName)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.displayName = value.trim();
              await plugin.saveSettings();
            })();
          })
      );
  });

  generalGroup.addSetting((setting) => {
    setting
      .setName("启动时打开首页")
      .setDesc("Obsidian 工作区加载完成后自动显示 Astra。")
      .addToggle((toggle) =>
        toggle
          .setValue(plugin.data.settings.openOnStartup)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.openOnStartup = value;
              await plugin.saveSettings();
            })();
          })
      );
  });

  generalGroup.addSetting((setting) => {
    setting
      .setName("启动方式")
      .setDesc("替换当前标签更像默认首页；新标签会保留上次打开的笔记。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("replace-active", "替换当前标签")
          .addOption("new-tab", "在新标签打开")
          .setValue(plugin.data.settings.startupMode)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.startupMode = value as StartupMode;
              await plugin.saveSettings();
            })();
          })
      );
  });

  generalGroup.addSetting((setting) => {
    setting
      .setName("空白或极短阈值")
      .setDesc("字数小于或等于该值时，归入“空白或极短”。")
      .addSlider((slider) =>
        slider
          .setLimits(0, 100, 5)
          .setValue(plugin.data.settings.shortNoteWordThreshold)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.shortNoteWordThreshold = value;
              await plugin.saveSettings();
            })();
          })
      );
  });

  generalGroup.addSetting((setting) => {
    setting
      .setName("排除文件夹")
      .setDesc("每行一个仓库相对路径；其子目录也会被排除。")
      .addTextArea((text) => {
        text
          .setPlaceholder("模板\n归档/附件")
          .setValue(plugin.data.settings.excludedFolders.join("\n"))
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.excludedFolders = parseExcludedFolders(value);
              await plugin.saveSettings();
            })();
          });
        text.inputEl.rows = 4;
      });
  });

  // ── 主页模块 ──
  const modulesGroup = new SettingGroup(dashboardEl).setHeading("主页模块");

  modulesGroup.addSetting((setting) => {
    setting
      .setName("项目文件夹")
      .setDesc("存放项目与任务的根文件夹。子文件夹中带 project.md 视为项目。")
      .addText((text) => {
        text
          .setPlaceholder("Projects")
          .setValue(plugin.data.settings.projectsFolder)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.projectsFolder = value.trim();
              await plugin.saveSettings();
            })();
          });
        // 输入时联想库内文件夹，选中后回填相对路径（学习 Obsidian 官方「附件文件夹路径」交互）
        new ProjectFolderSuggest(plugin.app, text.inputEl, (path) => {
          plugin.data.settings.projectsFolder = path;
          void plugin.saveSettings();
        });
      });
  });

  modulesGroup.addSetting((setting) => {
    setting
      .setName("TODO 扫描文件夹")
      .setDesc("可选。默认扫描整个仓库；指定后仅扫描该文件夹及子目录。")
      .addText((text) =>
        text
          .setPlaceholder("留空 = 整个仓库")
          .setValue(plugin.data.settings.todoSourceFolder)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.todoSourceFolder = value.trim();
              await plugin.saveSettings();
            })();
          })
      );
  });

  modulesGroup.addSetting((setting) => {
    setting
      .setName("阶段命名")
      .setDesc("用「英文逗号」分隔的阶段列表，决定项目管道与筛选。")
      .addText((text) =>
        text
          .setPlaceholder("Charter,PDCP,TR,ADCP,COR")
          .setValue(plugin.data.settings.npdpStages.join(","))
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.npdpStages = value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              await plugin.saveSettings();
            })();
          })
      );
  });

  modulesGroup.addSetting((setting) => {
    setting
      .setName("项目进度筛选阶段")
      .setDesc("只显示阶段序号 ≤ 该值的项目（1 = 第一个阶段）。")
      .addSlider((slider) =>
        slider
          .setLimits(1, Math.max(1, plugin.data.settings.npdpStages.length), 1)
          .setValue(
            Math.min(plugin.data.settings.npdpProgressFilter, plugin.data.settings.npdpStages.length)
          )
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.npdpProgressFilter = value;
              await plugin.saveSettings();
            })();
          })
      );
  });

  modulesGroup.addSetting((setting) => {
    setting
      .setName("快速捕获文件")
      .setDesc("快速捕获统一追加写入的单个笔记文件。输入时联想库内笔记，选中回填路径（不存在会自动创建）。")
      .addText((text) => {
        text
          .setPlaceholder("选择或输入一个笔记文件路径，例如 00 inbox/快速捕获.md")
          .setValue(plugin.data.settings.quickCapture.filePath)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.quickCapture.filePath = value.trim();
              await plugin.saveSettings();
            })();
          });
        // 输入时联想库内 md 笔记，选中后回填路径（与「项目文件夹」的交互一致，替换原「选择」弹窗按钮）
        new ProjectFileSuggest(plugin.app, text.inputEl, (path) => {
          plugin.data.settings.quickCapture.filePath = path;
          void plugin.saveSettings();
        });
      });
  });

  modulesGroup.addSetting((setting) => {
    setting
      .setName("每日口语来源")
      .setDesc("每日口语 .md 文件（按 ## 分条 + en:/zh:/scene: 字段解析）。输入时联想库内笔记，选中回填路径。")
      .addText((text) => {
        text
          .setPlaceholder("选择或输入一个笔记文件路径，例如 00 inbox/每日口语.md")
          .setValue(plugin.data.settings.dailyPhrase.filePath)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.dailyPhrase.filePath = value.trim();
              await plugin.saveSettings();
            })();
          });
        new ProjectFileSuggest(plugin.app, text.inputEl, (path) => {
          plugin.data.settings.dailyPhrase.filePath = path;
          void plugin.saveSettings();
        });
      });
  });

  // ── 移动端模块显隐 ──
  const mobileGroup = new SettingGroup(dashboardEl).setHeading("移动端模块显隐");
  mobileGroup.addSetting((setting) => {
    setting.setDesc("勾选后在移动端显示该模块；未勾选的模块仅桌面端可见。快捷链接与热图始终显示。");
  });

  const moduleLabels: Record<string, string> = {
    qc: "快速捕获",
    dailyPhrase: "每日口语",
    todo: "TODO",
    weekly: "任务进展",
    projects: "项目情况",
    countdown: "倒计时",
    recent: "最近笔记"
  };
  for (const id of Object.keys(moduleLabels)) {
    mobileGroup.addSetting((setting) => {
      setting
        .setName(moduleLabels[id]!)
        .addToggle((toggle) => {
          const hidden = plugin.data.settings.mobileHiddenModules;
          toggle.setValue(!hidden.includes(id));
          toggle.onChange((value) => {
            void (async () => {
              const arr = plugin.data.settings.mobileHiddenModules;
              const idx = arr.indexOf(id);
              if (value && idx >= 0) {
                arr.splice(idx, 1);
              } else if (!value && idx < 0) {
                arr.push(id);
              }
              await plugin.saveSettings();
            })();
          });
        });
    });
  }

  // ── 日历 ──
  const calendarGroup = new SettingGroup(dashboardEl).setHeading("日历");

  calendarGroup.addSetting((setting) => {
    setting
      .setName("日历位置")
      .setDesc("选择日历显示在哪个侧边栏")
      .addDropdown((dd) => {
        dd.addOption("left", "左侧边栏");
        dd.addOption("right", "右侧边栏");
        dd.setValue(plugin.data.settings.calendar.position);
        dd.onChange((value) => {
          void (async () => {
            plugin.data.settings.calendar.position = value as "left" | "right";
            await plugin.saveSettings();
          })();
        });
      });
  });

  calendarGroup.addSetting((setting) => {
    setting
      .setName("创建前确认")
      .setDesc("创建日记前是否需要确认")
      .addToggle((toggle) =>
        toggle
          .setValue(plugin.data.settings.calendar.shouldConfirmBeforeCreate)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.calendar.shouldConfirmBeforeCreate = value;
              await plugin.saveSettings();
            })();
          })
      );
  });

  // ===================== Markdown + =====================
  const markdownEl = sectionEls.get("markdown")!;

  // ── Minimal 主题（移植自 obsidian-minimal-settings，独立 JSON 存储） ──
  renderMinimalSettings(markdownEl, plugin);

  // ── 视图模式（存储于 Section2 的 static-data.json，经 StaticStore） ──
  const store = plugin.section2Store;
  const fv = store.settings.forceViewMode;
  const forceViewGroup = new SettingGroup(markdownEl).setHeading("视图模式");

  forceViewGroup.addSetting((setting) => {
    setting
      .setName("启用强制视图模式")
      .setDesc("根据 frontmatter 或文件夹/文件规则自动设置视图模式")
      .addToggle((toggle) =>
        toggle
          .setValue(fv.enabled)
          .onChange((value) => {
            void (async () => {
              fv.enabled = value;
              await store.save();
            })();
          })
      );
  });

  forceViewGroup.addSetting((setting) => {
    setting
      .setName("忽略已打开的文件")
      .setDesc("不要更改已打开笔记的视图模式。")
      .addToggle((toggle) =>
        toggle
          .setValue(fv.ignoreOpenFiles)
          .onChange((value) => {
            void (async () => {
              fv.ignoreOpenFiles = value;
              await store.save();
            })();
          })
      );
  });

  forceViewGroup.addSetting((setting) => {
    setting
      .setName("未在 frontmatter 中指定时忽略强制视图")
      .setDesc("不要更改从其他视图模式中打开的笔记的视图模式。")
      .addToggle((toggle) =>
        toggle
          .setValue(fv.ignoreForceViewAll)
          .onChange((value) => {
            void (async () => {
              fv.ignoreForceViewAll = value;
              await store.save();
            })();
          })
      );
  });

  forceViewGroup.addSetting((setting) => {
    setting
      .setName("启用光标位置")
      .setDesc("记住每个文件的光标位置和滚动状态")
      .addToggle((toggle) =>
        toggle
          .setValue(plugin.data.settings.cursorPosition.enabled)
          .onChange((value) => {
            void (async () => {
              plugin.data.settings.cursorPosition.enabled = value;
              await plugin.saveSettings();
            })();
          })
      );
  });

  const forceViewModes = [
    "default",
    "obsidianUIMode: preview",
    "obsidianUIMode: source",
    "obsidianEditingMode: live",
    "obsidianEditingMode: source",
  ];

  // 文件夹规则
  forceViewGroup.addSetting((setting) => {
    setting
      .setName("文件夹规则")
      .setDesc("为指定文件夹中的笔记设定视图模式。优先级从下到上递增。")
      .addButton((button) =>
        button
          .setButtonText("+")
          .setCta()
          .setTooltip("添加文件夹规则")
          .onClick(() => {
            void (async () => {
              fv.folders.push({ folder: "", viewMode: "" });
              await store.save();
              renderSettings(container, plugin);
            })();
          })
      );
  });

  fv.folders.forEach((folderMode, index) => {
    forceViewGroup.addSetting((setting) => {
      setting
        .addText((text) => {
          text
            .setPlaceholder("示例：folder1/templates")
            .setValue(folderMode.folder)
            .onChange((newFolder) => {
              void (async () => {
                folderMode.folder = newFolder;
                await store.save();
              })();
            });
        })
        .addDropdown((dd) => {
          forceViewModes.forEach((mode) => {
          dd.addOption(mode, mode);
        });
          dd.setValue(folderMode.viewMode || "default").onChange((value) => {
            void (async () => {
              folderMode.viewMode = value;
              await store.save();
            })();
          });
        })
        .addExtraButton((btn) =>
          btn
            .setIcon("cross")
            .setTooltip("删除")
            .onClick(() => {
              void (async () => {
                fv.folders.splice(index, 1);
                await store.save();
                renderSettings(container, plugin);
              })();
            })
        );
    });
  });

  // 文件规则
  forceViewGroup.addSetting((setting) => {
    setting
      .setName("文件规则")
      .setDesc('为匹配特定正则表达式模式的文件设定视图模式。覆盖文件夹规则。')
      .addButton((button) =>
        button
          .setButtonText("+")
          .setCta()
          .setTooltip("添加文件规则")
          .onClick(() => {
            void (async () => {
              fv.files.push({ filePattern: "", viewMode: "" });
              await store.save();
              renderSettings(container, plugin);
            })();
          })
      );
  });

  fv.files.forEach((fileMode, index) => {
    forceViewGroup.addSetting((setting) => {
      setting
        .addText((text) => {
          text
            .setPlaceholder('示例：" - All$" 或 "1900-01"')
            .setValue(fileMode.filePattern)
            .onChange((value) => {
              void (async () => {
                fileMode.filePattern = value;
                await store.save();
              })();
            });
        })
        .addDropdown((dd) => {
          forceViewModes.forEach((mode) => {
          dd.addOption(mode, mode);
        });
          dd.setValue(fileMode.viewMode || "default").onChange((value) => {
            void (async () => {
              fileMode.viewMode = value;
              await store.save();
            })();
          });
        })
        .addExtraButton((btn) =>
          btn
            .setIcon("cross")
            .setTooltip("删除")
            .onClick(() => {
              void (async () => {
                fv.files.splice(index, 1);
                await store.save();
                renderSettings(container, plugin);
              })();
            })
        );
    });
  });

  // ── Linter（移植自 obsidian-linter，独立 JSON 存储） ──
  renderLinterSettings(markdownEl, plugin);

}

function parseExcludedFolders(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((path) => normalizePath(path.trim()))
    .filter(Boolean);
}

/* ============================ Minimal 主题 ============================ */

type MinimalStringKey =
  | "lightScheme"
  | "lightStyle"
  | "darkScheme"
  | "darkStyle"
  | "tableWidth"
  | "imgWidth"
  | "iframeWidth"
  | "mapWidth"
  | "chartWidth";
function renderMinimalSettings(
  container: HTMLElement,
  plugin: AstraDashboardPlugin
): void {
  const manager = plugin.minimalManager;
  if (!manager) return;

  const applyFor = (key: MinimalStringKey) => {
    switch (key) {
      case "lightScheme":
        return manager.updateLightScheme();
      case "lightStyle":
        return manager.updateLightStyle();
      case "darkScheme":
        return manager.updateDarkScheme();
      case "darkStyle":
        return manager.updateDarkStyle();
      default:
        return manager.refresh();
    }
  };

  const save = async () => {
    await manager.saveSettings();
  };

  // ── Color scheme ──
  const colorGroup = new SettingGroup(container).setHeading("Minimal 主题");
  colorGroup.addSetting((setting) => {
    setting
      .setName("浅色模式配色")
      .setDesc("浅色模式的预设配色。")
      .addDropdown((dd) => {
        lightSchemeOptions.forEach(({ value, label }) => {
          dd.addOption(value, label);
        });
        dd.setValue(manager.settings.lightScheme);
        dd.onChange((value) => {
          void (async () => {
            manager.settings.lightScheme = value;
            await save();
            applyFor("lightScheme");
          })();
        });
      });
  });
  colorGroup.addSetting((setting) => {
    setting
      .setName("深色模式配色")
      .setDesc("深色模式的预设配色。")
      .addDropdown((dd) => {
        darkSchemeOptions.forEach(({ value, label }) => {
          dd.addOption(value, label);
        });
        dd.setValue(manager.settings.darkScheme);
        dd.onChange((value) => {
          void (async () => {
            manager.settings.darkScheme = value;
            await save();
            applyFor("darkScheme");
          })();
        });
      });
  });

  colorGroup.addSetting((setting) => {
    setting
      .setName("图片网格")
      .setDesc("将连续的图片排成多列。要在图片之间换行，可添加一个空行。")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.imgGrid)
          .onChange((value) => {
            void (async () => {
              manager.settings.imgGrid = value;
              await save();
              manager.refresh();
            })();
          })
      );
  });
  colorGroup.addSetting((setting) => {
    setting
      .setName("极简状态栏")
      .setDesc("关闭以使用全宽状态栏。")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.minimalStatus)
          .onChange((value) => {
            void (async () => {
              manager.settings.minimalStatus = value;
              await save();
              manager.refresh();
            })();
          })
      );
  });
  colorGroup.addSetting((setting) => {
    setting
      .setName("专注模式")
      .setDesc("隐藏标签栏与状态栏，悬停显示。可通过热键切换。")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.focusMode)
          .onChange((value) => {
            void (async () => {
              manager.settings.focusMode = value;
              await save();
              manager.refresh();
            })();
          })
      );
  });
}

/* ============================ Linter ============================ */

function renderLinterSettings(
  container: HTMLElement,
  plugin: AstraDashboardPlugin
): void {
  const manager = plugin.linterManager;
  if (!manager) return;

  const save = async () => {
    await manager.saveSettings();
  };

  const linterGroup = new SettingGroup(container).setHeading("Linter Lite");

  linterGroup.addSetting((setting) => {
    setting
      .setName("保存时格式化文件")
      .setDesc(
        (() => {
          const frag = createFragment();
          frag.append("保存时对当前文件执行格式化（按 ");
          const k1 = createEl("code");
          k1.textContent = "Cmd/Ctrl+S";
          frag.append(k1);
          frag.append("，或在使用 vim 键位时执行 ");
          const k2 = createEl("code");
          k2.textContent = ":w";
          frag.append(k2);
          frag.append("）。");
          return frag;
        })()
      )
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.lintOnSave)
          .onChange((value) => {
            void (async () => {
              manager.settings.lintOnSave = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("忽略文件夹")
      .setDesc("对全部文件或保存时格式化的忽略文件夹。")
      .addTextArea((text) => {
        text
          .setPlaceholder("模板\n归档/附件")
          .setValue(manager.settings.foldersToIgnore.join("\n"))
          .onChange((value) => {
            void (async () => {
              manager.settings.foldersToIgnore = value
                .split(/\r?\n/u)
                .map((p) => normalizePath(p.trim()))
                .filter(Boolean);
              await save();
            })();
          });
        text.inputEl.rows = 4;
      });
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("YAML 时间戳")
      .setDesc("在 YAML frontmatter 中维护文件最后编辑的日期。日期取自文件元数据。")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.yamlTimestamp.enabled)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.enabled = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("创建日期")
      .setDesc("写入文件创建日期")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.yamlTimestamp.dateCreated)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateCreated = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("创建日期键名")
      .setDesc("用于创建日期的 YAML 键名")
      .addText((text) =>
        text
          .setPlaceholder("date created")
          .setValue(manager.settings.yamlTimestamp.dateCreatedKey)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateCreatedKey = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("创建日期来源")
      .setDesc("如果 frontmatter 中已有创建日期值，指定从哪里获取该值。")
      .addDropdown((dd) =>
        dd
          .addOption("file system", "文件系统")
          .addOption("frontmatter", "YAML frontmatter")
          .setValue(manager.settings.yamlTimestamp.dateCreatedSourceOfTruth)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateCreatedSourceOfTruth = value as
                | "file system"
                | "frontmatter";
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("修改日期")
      .setDesc("写入文件最后修改的日期")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.yamlTimestamp.dateModified)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateModified = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("修改日期键名")
      .setDesc("用于修改日期的 YAML 键名")
      .addText((text) =>
        text
          .setPlaceholder("date modified")
          .setValue(manager.settings.yamlTimestamp.dateModifiedKey)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateModifiedKey = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("修改日期来源")
      .setDesc("如果 frontmatter 中已有修改日期，指定决定何时更新它的方式。")
      .addDropdown((dd) =>
        dd
          .addOption("file system", "文件系统")
          .addOption("user or Linter edits", "在 Obsidian 中的更改")
          .setValue(manager.settings.yamlTimestamp.dateModifiedSourceOfTruth)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.dateModifiedSourceOfTruth = value as
                | "file system"
                | "user or Linter edits";
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("格式")
      .setDesc(
        (() => {
          const frag = createFragment();
          frag.append("使用的 Moment 日期格式（参见 ");
          const a = createEl("a");
          a.href =
            "https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/";
          a.textContent = "Moment 格式选项";
          a.target = "_blank";
          a.rel = "noopener";
          frag.append(a);
          frag.append("）。");
          return frag;
        })()
      )
      .addText((text) =>
        text
          .setPlaceholder("YYYY-MM-DD")
          .setValue(manager.settings.yamlTimestamp.format)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.format = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("本地时间转换为 UTC")
      .setDesc("保存日期时使用 UTC 时间而非本地时间")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.yamlTimestamp.convertToUTC)
          .onChange((value) => {
            void (async () => {
              manager.settings.yamlTimestamp.convertToUTC = value;
              await save();
            })();
          })
      );
  });

  linterGroup.addSetting((setting) => {
    setting
      .setName("内容行之间的换行")
      .setDesc("确保在段落、引用块和列表项中，内容延续到下一行的行末添加指定的换行标记。")
      .addToggle((toggle) =>
        toggle
          .setValue(manager.settings.twoSpaces.enabled)
          .onChange((value) => {
            void (async () => {
              manager.settings.twoSpaces.enabled = value;
              await save();
            })();
          })
      );
  });
}