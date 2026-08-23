import { Notice, Plugin, TFile } from "obsidian";
import {
  AttendDashboardView,
  VIEW_TYPE_ATTEND_DASHBOARD
} from "./dashboard-view";
import {
  DEFAULT_DATA,
  DEFAULT_HEATMAP_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_FORCE_VIEW_MODE_SETTINGS,
  DEFAULT_CURSOR_POSITION_SETTINGS,
  DEFAULT_CALENDAR_SETTINGS,
  type AttendPluginData,
  type StartupMode
} from "./models";
import { AttendSettingTab } from "./settings";
import { StatsService } from "./stats-service";
import { ForceViewModeManager } from "./forceViewMode";
import { CursorPositionManager } from "./cursorPosition";
import { CalendarView } from "./calendar/CalendarView";
import { VIEW_TYPE_CALENDAR } from "./calendar/constants";
import { calendarSettings } from "./calendar/ui/stores";
import { defaultCalendarSettings } from "./calendar/settings";
import type { IWeekStartOption } from "obsidian-calendar-ui";

export default class AttendDashboardPlugin extends Plugin {
  data: AttendPluginData = structuredClone(DEFAULT_DATA);
  stats!: StatsService;
  forceViewModeManager!: ForceViewModeManager;
  cursorPositionManager!: CursorPositionManager;
  private saveTimer: number | null = null;
  private vaultEventsRegistered = false;

  async onload(): Promise<void> {
    await this.loadPluginData();
    this.stats = new StatsService(this.app, this);

    this.registerView(
      VIEW_TYPE_ATTEND_DASHBOARD,
      (leaf) => new AttendDashboardView(leaf, this)
    );

    this.addRibbonIcon("home", "打开 Dashboard", () => {
      void this.openDashboard("new-tab");
    });

    this.addCommand({
      id: "open-dashboard",
      name: "打开首页看板",
      callback: () => void this.openDashboard("new-tab")
    });

    this.addCommand({
      id: "open-project-board",
      name: "打开全部项目",
      callback: () => void this.openProjectBoard()
    });

    this.addCommand({
      id: "refresh-dashboard",
      name: "重新扫描首页统计",
      callback: () => {
        this.stats.invalidate();
        this.refreshDashboardViews(true);
        new Notice("Dashboard 正在重新扫描");
      }
    });

    this.addSettingTab(new AttendSettingTab(this.app, this));

    // Calendar
    this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));
    this.updateCalendarStore();
    if (this.data.settings.calendar.enabled) {
      this.addRibbonIcon("calendar-days", "打开日历", () => {
        void this.activateCalendarView();
      });
    }
    this.addCommand({
      id: "open-attend-calendar",
      name: "打开日历",
      callback: () => {
        void this.activateCalendarView();
      },
    });

    // Force View Mode
    this.forceViewModeManager = new ForceViewModeManager(this, this.data.settings.forceViewMode);
    this.forceViewModeManager.onload();

    // Cursor Position
    this.cursorPositionManager = new CursorPositionManager(this, this.data.settings.cursorPosition);
    this.cursorPositionManager.onload();

    this.app.workspace.onLayoutReady(() => {
      this.registerVaultEvents();
      if (this.data.settings.openOnStartup) {
        window.setTimeout(() => {
          void this.openDashboard(this.data.settings.startupMode);
        }, 0);
      }
    });
  }

  onunload(): void {
    this.forceViewModeManager?.onunload();
    this.cursorPositionManager?.onunload();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      void this.saveData(this.data);
    }
  }

  async openDashboard(
    mode: StartupMode = this.data.settings.startupMode
  ): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_ATTEND_DASHBOARD
    )[0];
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf =
      mode === "new-tab"
        ? this.app.workspace.getLeaf("tab")
        : this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_ATTEND_DASHBOARD,
      active: true
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  /** 打开首页看板并内嵌跳转到「全部项目」（不新开独立标签页）。 */
  async openProjectBoard(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_ATTEND_DASHBOARD
    );
    const existing = leaves[0];
    if (!existing) {
      const leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_ATTEND_DASHBOARD,
        active: true
      });
      await this.app.workspace.revealLeaf(leaf);
      // 等新面板完成 onOpen 的首次渲染后再导航，避免被后续渲染覆盖
      await new Promise((resolve) => window.setTimeout(resolve, 60));
      const view = leaf.view;
      if (view instanceof AttendDashboardView) {
        await view.navigateProjectBoard(null);
      }
      return;
    }
    await this.app.workspace.revealLeaf(existing);
    if (existing.view instanceof AttendDashboardView) {
      await existing.view.navigateProjectBoard(null);
    }
  }

  requestDataSave(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveData(this.data);
    }, 500);
  }

  async saveSettings(): Promise<void> {
    this.stats.invalidate();
    await this.saveData(this.data);
    this.refreshDashboardViews(true);
    this.forceViewModeManager?.updateSettings(this.data.settings.forceViewMode);
    this.cursorPositionManager?.updateSettings(this.data.settings.cursorPosition);
    this.updateCalendarStore();
  }

  /**
   * 仅持久化当前数据，不刷新任何 dashboard 视图。
   * 用于编辑态内的模块拖拽/删除等即时操作：DOM 顺序已是最终结果，无需整页重建，
   * 避免刷新导致编辑态丢失、用户来不及点击「完成」。
   */
  async saveLayoutSilently(): Promise<void> {
    await this.saveData(this.data);
  }

  async saveDashboardPreferences(): Promise<void> {
    await this.saveData(this.data);
    this.refreshDashboardViews();
  }

  refreshDashboardViews(force = false): void {
    if (force) this.stats.invalidate();
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_ATTEND_DASHBOARD)
      .forEach((leaf) => {
        if (leaf.view instanceof AttendDashboardView) {
          leaf.view.requestRefresh();
        }
      });
  }

  async activateCalendarView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]!);
      return;
    }
    const position = this.data.settings.calendar.position || "left";
    const leaf =
      position === "left"
        ? this.app.workspace.getLeftLeaf(false)
        : this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_CALENDAR,
        active: true,
      });
    }
    const calendarLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0];
    if (calendarLeaf) {
      this.app.workspace.revealLeaf(calendarLeaf);
    }
  }

  private updateCalendarStore(): void {
    const calSettings = this.data.settings.calendar;
    calendarSettings.set({
      ...defaultCalendarSettings,
      wordsPerDot: calSettings.wordsPerDot,
      weekStart: calSettings.weekStart as IWeekStartOption,
      shouldConfirmBeforeCreate: calSettings.shouldConfirmBeforeCreate,
      position: calSettings.position || "left",
      highlightToday: calSettings.highlightToday !== false,
    });
  }

  private async loadPluginData(): Promise<void> {
    const saved = (await this.loadData()) as Partial<AttendPluginData> | null;

    // Migrate heatmap settings from malformed values produced by earlier
    // reconciliation bugs.  Old code could persist quoted empty strings
    // (e.g. `""`, `" "`) into data.json; those silently produce zero
    // contributions when handed to `dv.pages(...)`, so the heatmap grid
    // renders but every cell stays grey.  Normalise them here so upgraded
    // users see colours without having to re-save settings manually.
    const savedHeat = saved?.settings?.heatmap;
    const migratedHeatmap = savedHeat
      ? { ...savedHeat }
      : undefined;
    if (migratedHeatmap) {
      const badEmpty = /^\s*"?\s*"?\s*$/; // matches "", " ", "  ", '""' (serialized quotes), whitespace-only
      if (
        typeof migratedHeatmap.dataSourceValue === "string" &&
        badEmpty.test(migratedHeatmap.dataSourceValue)
      ) {
        migratedHeatmap.dataSourceValue =
          DEFAULT_HEATMAP_SETTINGS.dataSourceValue;
      }
      if (
        typeof migratedHeatmap.dateFieldValue === "string" &&
        badEmpty.test(migratedHeatmap.dateFieldValue)
      ) {
        migratedHeatmap.dateFieldValue =
          DEFAULT_HEATMAP_SETTINGS.dateFieldValue;
      }
      if (
        typeof migratedHeatmap.dateFormat === "string" &&
        badEmpty.test(migratedHeatmap.dateFormat)
      ) {
        migratedHeatmap.dateFormat = DEFAULT_HEATMAP_SETTINGS.dateFormat;
      }
      if (
        typeof migratedHeatmap.countFieldValue === "string" &&
        badEmpty.test(migratedHeatmap.countFieldValue)
      ) {
        migratedHeatmap.countFieldValue =
          DEFAULT_HEATMAP_SETTINGS.countFieldValue;
      }
      if (
        typeof migratedHeatmap.excludeFolders === "string" &&
        badEmpty.test(migratedHeatmap.excludeFolders)
      ) {
        migratedHeatmap.excludeFolders =
          DEFAULT_HEATMAP_SETTINGS.excludeFolders;
      }
    }

    this.data = {
      ...structuredClone(DEFAULT_DATA),
      ...saved,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(saved?.settings ?? {}),
        heatmap: {
          ...DEFAULT_HEATMAP_SETTINGS,
          ...(migratedHeatmap ?? {})
        },
        forceViewMode: {
          ...DEFAULT_FORCE_VIEW_MODE_SETTINGS,
          ...(saved?.settings?.forceViewMode ?? {}),
          // 防抖超时已移除设置项，固定为默认值 300ms
          debounceTimeout: DEFAULT_FORCE_VIEW_MODE_SETTINGS.debounceTimeout
        },
        cursorPosition: {
          ...DEFAULT_CURSOR_POSITION_SETTINGS,
          ...(saved?.settings?.cursorPosition ?? {})
        },
        calendar: {
          ...DEFAULT_CALENDAR_SETTINGS,
          ...(saved?.settings?.calendar ?? {})
        }
      },
      activity: saved?.activity ?? {},
      linkSnapshots: saved?.linkSnapshots ?? {},
      fileWordCounts: saved?.fileWordCounts ?? {},
      trackingStartedAt: saved?.trackingStartedAt ?? null,
      linkTrackingStartedAt: saved?.linkTrackingStartedAt ?? null
    };

    // 迁移旧「快速捕捉」设置：旧版为 storagePath/namingPattern/templateFile（每日新建），
    // 新版统一追加写入 filePath 指定的单个文件。路径由用户在设置里自行选择，这里只做兼容迁移。
    const qc = this.data.settings.quickCapture as
      | (typeof this.data.settings.quickCapture & {
          storagePath?: string;
          namingPattern?: string;
          templateFile?: string;
        })
      | undefined;
    if (!qc || typeof qc.filePath !== "string" || !qc.filePath.trim()) {
      const dir = (qc?.storagePath ?? "").trim().replace(/\/+$/, "");
      // 只从旧字段继承目录；没有则留空，由用户在设置里自行选择
      this.data.settings.quickCapture = {
        filePath: dir ? `${dir}/快速捕获.md` : ""
      };
    }
  }

  private registerVaultEvents(): void {
    if (this.vaultEventsRegistered) return;
    this.vaultEventsRegistered = true;

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        void this.stats.recordFileChange(file).then(() => {
          this.refreshDashboardViews();
        });
      })
    );

    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        void this.stats.recordFileChange(file, true).then(() => {
          this.refreshDashboardViews();
        });
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        this.stats.recordDelete(file);
        this.refreshDashboardViews();
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        this.stats.recordRename(file, oldPath);
        this.refreshDashboardViews();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        this.refreshDashboardViews();
      })
    );
  }
}
