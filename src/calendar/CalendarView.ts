import type { WorkspaceLeaf} from "obsidian";
import { ItemView, Menu, Notice } from "obsidian";
import { createDailyNote, getDailyNote } from "obsidian-daily-notes-interface";
import Calendar from "./ui/Calendar.svelte";
import { activeFile, calendarSettings, dailyNotes } from "./ui/stores";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { get } from "svelte/store";
import { ConfirmCreateModal } from "./ConfirmCreateModal";

export class CalendarView extends ItemView {
  private calendar: Calendar;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "日历";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen() {
    dailyNotes.reindex();

    this.calendar = new Calendar({
      target: this.containerEl.children[1] as HTMLElement,
      props: {
        onDateClick: this.onDateClick.bind(this),
        onHoverDay: this.onHoverDay.bind(this),
        onContextMenuDay: this.onContextMenuDay.bind(this),
      },
    });

    // 让日历视图内容区为滚动条预留固定槽位，避免「滚动条出现/消失 → 可用宽度变化 → 重新缩放 → 高度变化」的反馈循环（部分系统滚动条会占用宽度）
    const contentEl = this.containerEl.children[1] as HTMLElement;
    contentEl.style.scrollbarGutter = "stable";

    this.registerEvent(
      this.app.vault.on("create", () => {
        dailyNotes.reindex();
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", () => {
        dailyNotes.reindex();
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", () => {
        dailyNotes.reindex();
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        activeFile.setFile(this.app.workspace.getActiveFile());
      })
    );

    activeFile.setFile(this.app.workspace.getActiveFile());
  }

  async onClose() {
    if (this.calendar) {
      this.calendar.$destroy();
    }
  }

  private async onDateClick(date: string, isMetaPressed: boolean) {
    const momentDate = window.moment(date);
    const dailyNotesData = get(dailyNotes);
    const file = getDailyNote(momentDate, dailyNotesData);

    if (file) {
      await this.app.workspace.getLeaf(isMetaPressed).openFile(file);
    } else {
      const settings = get(calendarSettings);
      if (settings.shouldConfirmBeforeCreate) {
        await this.tryCreateDailyNote(momentDate, isMetaPressed);
      } else {
        await this.createAndOpenDailyNote(momentDate, isMetaPressed);
      }
    }
  }

  private tryCreateDailyNote(date: moment.Moment, isMetaPressed: boolean): Promise<void> {
    const formattedDate = date.format("YYYY-MM-DD");

    return new Promise<void>((resolve) => {
      new ConfirmCreateModal(
        this.app,
        {
          title: "新建日记",
          message: `文件 ${formattedDate} 不存在。是否要创建它？`,
          confirmText: "创建",
          cancelText: "取消",
        },
        () => {
          void this.createAndOpenDailyNote(date, isMetaPressed).then(() => resolve());
        },
        () => {
          resolve();
        }
      ).open();
    });
  }

  private async createAndOpenDailyNote(date: moment.Moment, isMetaPressed: boolean): Promise<void> {
    try {
      const file = await createDailyNote(date);
      await this.app.workspace.getLeaf(isMetaPressed).openFile(file!);
      dailyNotes.reindex();
    } catch (err) {
      console.error("[Calendar] Failed to create daily note", err);
      new Notice("创建日记失败");
    }
  }

  private onHoverDay(date: string, isMetaPressed: boolean) {
    if (!isMetaPressed) return;

    const momentDate = window.moment(date);
    const dailyNotesData = get(dailyNotes);
    const file = getDailyNote(momentDate, dailyNotesData);

    if (file) {
      this.app.workspace.trigger("hover-link", {
        event: window.event as MouseEvent,
        source: VIEW_TYPE_CALENDAR,
        hoverParent: this.containerEl,
        targetEl: null,
        linktext: file.path,
      });
    }
  }

  private onContextMenuDay(date: string, mouseEvent: MouseEvent) {
    const momentDate = window.moment(date);
    const dailyNotesData = get(dailyNotes);
    const file = getDailyNote(momentDate, dailyNotesData);

    const menu = new Menu();

    if (file) {
      menu.addItem((item) => {
        item.setTitle("打开");
        item.setIcon("arrow-up-right");
        item.onClick(() => {
          void this.app.workspace.getLeaf("tab").openFile(file);
        });
      });

      menu.addItem((item) => {
        item.setTitle("在新面板中打开");
        item.setIcon("vertical-split");
        item.onClick(() => {
          void this.app.workspace.getLeaf("split").openFile(file);
        });
      });

      menu.addItem((item) => {
        item.setTitle("删除");
        item.setIcon("trash");
        item.onClick(() => {
          void (async () => {
            await this.app.vault.trash(file, true);
            dailyNotes.reindex();
          })();
        });
      });
    } else {
      menu.addItem((item) => {
        item.setTitle("新建日记");
        item.setIcon("plus");
        item.onClick(() => {
          void this.createAndOpenDailyNote(momentDate, false);
        });
      });
    }

    menu.showAtMouseEvent(mouseEvent);
  }
}
