import { DEFAULT_WORDS_PER_DOT } from "./constants";
import type { IWeekStartOption } from "obsidian-calendar-ui";

export type CalendarPosition = "left" | "right";

export interface ICalendarSettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;
  position: CalendarPosition;
  highlightToday: boolean;
}

export const defaultCalendarSettings: ICalendarSettings = {
  shouldConfirmBeforeCreate: true,
  weekStart: "locale",
  wordsPerDot: DEFAULT_WORDS_PER_DOT,
  position: "left",
  highlightToday: true,
};
