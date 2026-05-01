import type { Moment } from "moment";
import { ItemView, WorkspaceLeaf, Menu, Notice } from "obsidian";
import { createDailyNote, getDailyNote } from "obsidian-daily-notes-interface";
import Calendar from "./ui/Calendar.svelte";
import { activeFile, calendarSettings, dailyNotes } from "./ui/stores";
import { VIEW_TYPE_CALENDAR } from "./constants";
import { get } from "svelte/store";
import type { ICalendarSettings } from "./settings";
import { Locals } from "../i18/messages";
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
		return Locals.get().calendar_display_name;
	}

	getIcon(): string {
		return "calendar-days";
	}

	async onOpen() {
		dailyNotes.reindex();

		this.calendar = new Calendar({
			target: this.containerEl.children[1],
			props: {
				onDateClick: this.onDateClick.bind(this),
				onHoverDay: this.onHoverDay.bind(this),
				onContextMenuDay: this.onContextMenuDay.bind(this),
			},
		});

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

	private async tryCreateDailyNote(date: Moment, isMetaPressed: boolean) {
		const formattedDate = date.format("YYYY-MM-DD");
		const local = Locals.get();

		return new Promise<void>((resolve) => {
			new ConfirmCreateModal(
				this.app,
				{
					title: local.calendar_modal_title_daily,
					message: local.calendar_modal_message_daily.replace("{date}", formattedDate),
					confirmText: local.calendar_btn_create,
					cancelText: local.calendar_btn_cancel,
				},
				async () => {
					await this.createAndOpenDailyNote(date, isMetaPressed);
					resolve();
				},
				() => {
					resolve();
				}
			).open();
		});
	}

	private async createAndOpenDailyNote(date: Moment, isMetaPressed: boolean) {
		try {
			const file = await createDailyNote(date);
			await this.app.workspace.getLeaf(isMetaPressed).openFile(file);
			dailyNotes.reindex();
		} catch (err) {
			console.error("[Calendar] Failed to create daily note", err);
			new Notice(Locals.get().calendar_notice_create_daily_failed);
		}
	}

	private onHoverDay(date: string, isMetaPressed: boolean) {
		if (!isMetaPressed) return;

		const momentDate = window.moment(date);
		const dailyNotesData = get(dailyNotes);
		const file = getDailyNote(momentDate, dailyNotesData);

		if (file) {
			this.app.workspace.trigger("hover-link", {
				event: event,
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
		const local = Locals.get();

		const menu = new Menu();

		if (file) {
			menu.addItem((item) => {
				item.setTitle(local.calendar_menu_open);
				item.setIcon("arrow-up-right");
				item.onClick(() => {
					this.app.workspace.getLeaf("tab").openFile(file);
				});
			});

			menu.addItem((item) => {
				item.setTitle(local.calendar_menu_open_in_new_pane);
				item.setIcon("vertical-split");
				item.onClick(() => {
					this.app.workspace.getLeaf("split").openFile(file);
				});
			});

			menu.addItem((item) => {
				item.setTitle(local.calendar_menu_delete);
				item.setIcon("trash");
				item.onClick(async () => {
					await this.app.vault.trash(file, true);
					dailyNotes.reindex();
				});
			});
		} else {
			menu.addItem((item) => {
				item.setTitle(local.calendar_menu_create_daily);
				item.setIcon("plus");
				item.onClick(async () => {
					await this.createAndOpenDailyNote(momentDate, false);
				});
			});
		}

		menu.showAtMouseEvent(mouseEvent);
	}
}
