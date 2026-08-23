import type { TFile } from "obsidian";
import { getAllDailyNotes } from "obsidian-daily-notes-interface";
import { writable } from "svelte/store";

import { defaultCalendarSettings, type ICalendarSettings } from "../settings";
import { getDateUIDFromFile } from "./utils";

function createDailyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>({});
  return {
    reindex: () => {
      try {
        const dailyNotes = getAllDailyNotes();
        store.set(dailyNotes);
        hasError = false;
      } catch (err) {
        if (!hasError) {
          console.log("[Calendar] Failed to find daily notes folder", err);
        }
        store.set({});
        hasError = true;
      }
    },
    ...store,
  };
}

export const calendarSettings = writable<ICalendarSettings>(defaultCalendarSettings);
export const dailyNotes = createDailyNotesStore();

function createSelectedFileStore() {
  const store = writable<string | null>(null);

  return {
    setFile: (file: TFile | null) => {
      const id = file ? getDateUIDFromFile(file) : null;
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();
