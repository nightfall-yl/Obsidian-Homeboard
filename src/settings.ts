import {
  AbstractInputSuggest,
  Modal,
  PluginSettingTab,
  Setting,
  TFolder,
  TFile,
  normalizePath
} from "obsidian";
import type { App } from "obsidian";
import type AttendDashboardPlugin from "./main";
import type { StartupMode } from "./models";
import {
  DEFAULT_CALENDAR_SETTINGS,
  DEFAULT_FORCE_VIEW_MODE_SETTINGS,
  DEFAULT_CURSOR_POSITION_SETTINGS,
  DEFAULT_QUICK_CAPTURE_SETTINGS,
  DEFAULT_DIARY_SETTINGS,
  DEFAULT_COUNTDOWN_SETTINGS
} from "./models";

export class AttendSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly attendPlugin: AttendDashboardPlugin
  ) {
    super(app, attendPlugin);
  }

  display(): void {
    renderSettings(this.containerEl, this.attendPlugin);
  }
}

export class AttendSettingsModal extends Modal {
  constructor(
    app: App,
    private readonly attendPlugin: AttendDashboardPlugin
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("attend-settings-modal");
    renderSettings(this.contentEl, this.attendPlugin, () => this.close());
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

function renderSettings(
  container: HTMLElement,
  plugin: AttendDashboardPlugin,
  close?: () => void
): void {
  container.empty();

  // Defensive: ensure new settings exist (in case data.json predates migration)
  if (!plugin.data.settings.calendar) {
    plugin.data.settings.calendar = { ...DEFAULT_CALENDAR_SETTINGS };
  }
  if (!plugin.data.settings.forceViewMode) {
    plugin.data.settings.forceViewMode = { ...DEFAULT_FORCE_VIEW_MODE_SETTINGS };
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
  if (!plugin.data.settings.npdpStages) {
    plugin.data.settings.npdpStages = ["立项", "规划", "开发", "测试", "上线"];
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
    plugin.data.settings.mobileHiddenModules = ["todo", "progress", "weekly", "projects", "countdown"];
  }

  container.createEl("h2", { text: "Dashboard 设置" });
  container.createEl("p", {
    cls: "setting-item-description attend-settings-intro",
    text: "所有统计与活动记录都只保存在当前仓库，不会发送到网络。"
  });

  new Setting(container)
    .setName("问候名称")
    .setDesc("可选。留空时首页只显示时段问候。")
    .addText((text) =>
      text
        .setPlaceholder("例如 Sean")
        .setValue(plugin.data.settings.displayName)
        .onChange(async (value) => {
          plugin.data.settings.displayName = value.trim();
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("启动时打开首页")
    .setDesc("Obsidian 工作区加载完成后自动显示 Dashboard。")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.openOnStartup)
        .onChange(async (value) => {
          plugin.data.settings.openOnStartup = value;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("启动方式")
    .setDesc("替换当前标签更像默认首页；新标签会保留上次打开的笔记。")
    .addDropdown((dropdown) =>
      dropdown
        .addOption("replace-active", "替换当前标签")
        .addOption("new-tab", "在新标签打开")
        .setValue(plugin.data.settings.startupMode)
        .onChange(async (value) => {
          plugin.data.settings.startupMode = value as StartupMode;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("空白或极短阈值")
    .setDesc("字数小于或等于该值时，归入“空白或极短”。")
    .addSlider((slider) =>
      slider
        .setLimits(0, 100, 5)
        .setValue(plugin.data.settings.shortNoteWordThreshold)
        .onChange(async (value) => {
          plugin.data.settings.shortNoteWordThreshold = value;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("排除文件夹")
    .setDesc("每行一个仓库相对路径；其子目录也会被排除。")
    .addTextArea((text) => {
      text
        .setPlaceholder("模板\n归档/附件")
        .setValue(plugin.data.settings.excludedFolders.join("\n"))
        .onChange(async (value) => {
          plugin.data.settings.excludedFolders = parseExcludedFolders(value);
          await plugin.saveSettings();
        });
      text.inputEl.rows = 4;
    });

  new Setting(container)
    .setName("启用光标位置")
    .setDesc("记住每个文件的光标位置和滚动状态")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.cursorPosition.enabled)
        .onChange(async (value) => {
          plugin.data.settings.cursorPosition.enabled = value;
          await plugin.saveSettings();
        })
    );

  // ===== 主页模块（任务 / 项目）=====
  const hmHeading = container.createEl("h3", { text: "主页模块" });
  hmHeading.addClass("attend-settings-section-heading");

  new Setting(container)
    .setName("项目文件夹")
    .setDesc("存放项目与任务的根文件夹。子文件夹中带 project.md 视为项目。")
    .addText((text) => {
      text
        .setPlaceholder("Projects")
        .setValue(plugin.data.settings.projectsFolder)
        .onChange(async (value) => {
          plugin.data.settings.projectsFolder = value.trim();
          await plugin.saveSettings();
        });
      // 输入时联想库内文件夹，选中后回填相对路径（学习 Obsidian 官方「附件文件夹路径」交互）
      new ProjectFolderSuggest(plugin.app, text.inputEl, (path) => {
        plugin.data.settings.projectsFolder = path;
        void plugin.saveSettings();
      });
    });

  new Setting(container)
    .setName("TODO 扫描文件夹")
    .setDesc("可选。默认扫描整个仓库；指定后仅扫描该文件夹及子目录。")
    .addText((text) =>
      text
        .setPlaceholder("留空 = 整个仓库")
        .setValue(plugin.data.settings.todoSourceFolder)
        .onChange(async (value) => {
          plugin.data.settings.todoSourceFolder = value.trim();
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("阶段命名")
    .setDesc("用「英文逗号」分隔的阶段列表，决定项目管道与筛选。")
    .addText((text) =>
      text
        .setPlaceholder("立项,规划,开发,测试,上线")
        .setValue(plugin.data.settings.npdpStages.join(","))
        .onChange(async (value) => {
          plugin.data.settings.npdpStages = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("项目进度筛选阶段")
    .setDesc("只显示阶段序号 ≤ 该值的项目（1 = 第一个阶段）。")
    .addSlider((slider) =>
      slider
        .setLimits(1, Math.max(1, plugin.data.settings.npdpStages.length), 1)
        .setValue(
          Math.min(plugin.data.settings.npdpProgressFilter, plugin.data.settings.npdpStages.length)
        )
        .onChange(async (value) => {
          plugin.data.settings.npdpProgressFilter = value;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("快速捕获文件")
    .setDesc("快速捕获统一追加写入的单个笔记文件。输入时联想库内笔记，选中回填路径（不存在会自动创建）。")
    .addText((text) => {
      text
        .setPlaceholder("选择或输入一个笔记文件路径，例如 00 inbox/快速捕获.md")
        .setValue(plugin.data.settings.quickCapture.filePath)
        .onChange(async (value) => {
          plugin.data.settings.quickCapture.filePath = value.trim();
          await plugin.saveSettings();
        });
      // 输入时联想库内 md 笔记，选中后回填路径（与「项目文件夹」的交互一致，替换原「选择」弹窗按钮）
      new ProjectFileSuggest(plugin.app, text.inputEl, (path) => {
        plugin.data.settings.quickCapture.filePath = path;
        void plugin.saveSettings();
      });
    });

  // ===== 移动端模块显隐 =====
  const mhHeading = container.createEl("h3", { text: "移动端模块显隐" });
  mhHeading.addClass("attend-settings-section-heading");
  container.createEl("p", {
    cls: "setting-item-description",
    text: "勾选后在移动端显示该模块；未勾选的模块仅桌面端可见。快捷链接与热图始终显示。"
  });

  const moduleLabels: Record<string, string> = {
    qc: "快速捕获",
    todo: "TODO",
    progress: "工作进度",
    weekly: "本周待办 & 逾期",
    projects: "项目情况",
    countdown: "倒计时",
    recent: "最近笔记"
  };
  for (const id of Object.keys(moduleLabels)) {
    new Setting(container)
      .setName(moduleLabels[id]!)
      .addToggle((toggle) => {
        const hidden = plugin.data.settings.mobileHiddenModules;
        toggle.setValue(!hidden.includes(id));
        toggle.onChange(async (value) => {
          const arr = plugin.data.settings.mobileHiddenModules;
          const idx = arr.indexOf(id);
          if (value && idx >= 0) {
            arr.splice(idx, 1);
          } else if (!value && idx < 0) {
            arr.push(id);
          }
          await plugin.saveSettings();
        });
      });
  }

  // ===== 日历 =====
  const calHeading = container.createEl("h3", { text: "日历" });
  calHeading.addClass("attend-settings-section-heading");

  new Setting(container)
    .setName("日历位置")
    .setDesc("选择日历显示在哪个侧边栏")
    .addDropdown((dd) => {
      dd.addOption("left", "左侧边栏");
      dd.addOption("right", "右侧边栏");
      dd.setValue(plugin.data.settings.calendar.position);
      dd.onChange(async (value) => {
        plugin.data.settings.calendar.position = value as "left" | "right";
        await plugin.saveSettings();
      });
    });

  new Setting(container)
    .setName("创建前确认")
    .setDesc("创建日记前是否需要确认")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.calendar.shouldConfirmBeforeCreate)
        .onChange(async (value) => {
          plugin.data.settings.calendar.shouldConfirmBeforeCreate = value;
          await plugin.saveSettings();
        })
    );

  // ===== 强制视图 =====
  const fvHeading = container.createEl("h3", { text: "强制视图" });
  fvHeading.addClass("attend-settings-section-heading");

  new Setting(container)
    .setName("启用强制视图模式")
    .setDesc("根据 frontmatter 或文件夹/文件规则自动设置视图模式")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.forceViewMode.enabled)
        .onChange(async (value) => {
          plugin.data.settings.forceViewMode.enabled = value;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("忽略已打开的文件")
    .setDesc("不要更改已打开笔记的视图模式。")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.forceViewMode.ignoreOpenFiles)
        .onChange(async (value) => {
          plugin.data.settings.forceViewMode.ignoreOpenFiles = value;
          await plugin.saveSettings();
        })
    );

  new Setting(container)
    .setName("未在 frontmatter 中指定时忽略强制视图")
    .setDesc("不要更改从其他视图模式中打开的笔记的视图模式。")
    .addToggle((toggle) =>
      toggle
        .setValue(plugin.data.settings.forceViewMode.ignoreForceViewAll)
        .onChange(async (value) => {
          plugin.data.settings.forceViewMode.ignoreForceViewAll = value;
          await plugin.saveSettings();
        })
    );

  const forceViewModes = [
    "default",
    "obsidianUIMode: preview",
    "obsidianUIMode: source",
    "obsidianEditingMode: live",
    "obsidianEditingMode: source",
  ];

  // 文件夹规则
  new Setting(container)
    .setName("文件夹规则")
    .setDesc("为指定文件夹中的笔记设定视图模式。优先级从下到上递增。")
    .addButton((button) =>
      button
        .setButtonText("+")
        .setCta()
        .setTooltip("添加文件夹规则")
        .onClick(async () => {
          plugin.data.settings.forceViewMode.folders.push({ folder: "", viewMode: "" });
          await plugin.saveSettings();
          renderSettings(container, plugin, close);
        })
    );

  plugin.data.settings.forceViewMode.folders.forEach((folderMode, index) => {
    new Setting(container)
      .addText((text) => {
        text
          .setPlaceholder("示例：folder1/templates")
          .setValue(folderMode.folder)
          .onChange(async (newFolder) => {
            folderMode.folder = newFolder;
            await plugin.saveSettings();
          });
      })
      .addDropdown((dd) => {
        forceViewModes.forEach((mode) => dd.addOption(mode, mode));
        dd.setValue(folderMode.viewMode || "default").onChange(async (value) => {
          folderMode.viewMode = value;
          await plugin.saveSettings();
        });
      })
      .addExtraButton((btn) =>
        btn
          .setIcon("cross")
          .setTooltip("删除")
          .onClick(async () => {
            plugin.data.settings.forceViewMode.folders.splice(index, 1);
            await plugin.saveSettings();
            renderSettings(container, plugin, close);
          })
      );
  });

  // 文件规则
  new Setting(container)
    .setName("文件规则")
    .setDesc('为匹配特定正则表达式模式的文件设定视图模式。覆盖文件夹规则。')
    .addButton((button) =>
      button
        .setButtonText("+")
        .setCta()
        .setTooltip("添加文件规则")
        .onClick(async () => {
          plugin.data.settings.forceViewMode.files.push({ filePattern: "", viewMode: "" });
          await plugin.saveSettings();
          renderSettings(container, plugin, close);
        })
    );

  plugin.data.settings.forceViewMode.files.forEach((fileMode, index) => {
    new Setting(container)
      .addText((text) => {
        text
          .setPlaceholder('示例：" - All$" 或 "1900-01"')
          .setValue(fileMode.filePattern)
          .onChange(async (value) => {
            fileMode.filePattern = value;
            await plugin.saveSettings();
          });
      })
      .addDropdown((dd) => {
        forceViewModes.forEach((mode) => dd.addOption(mode, mode));
        dd.setValue(fileMode.viewMode || "default").onChange(async (value) => {
          fileMode.viewMode = value;
          await plugin.saveSettings();
        });
      })
      .addExtraButton((btn) =>
        btn
          .setIcon("cross")
          .setTooltip("删除")
          .onClick(async () => {
            plugin.data.settings.forceViewMode.files.splice(index, 1);
            await plugin.saveSettings();
            renderSettings(container, plugin, close);
          })
      );
  });

  if (close) {
    const actions = container.createDiv("attend-settings-actions");
    const done = actions.createEl("button", {
      cls: "mod-cta",
      text: "完成",
      attr: { type: "button" }
    });
    done.addEventListener("click", close);
  }
}

function parseExcludedFolders(value: string): string[] {
  return value
    .split(/\r?\n/u)
    .map((path) => normalizePath(path.trim()))
    .filter(Boolean);
}
