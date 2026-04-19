import { En } from "./en";
import { Local } from "./types";
import { Zh } from "./zh";

export type AppLanguage = "zh" | "en";

function getObsidianLanguage(): string | null {
	try {
		const appLike = (window as Window & { app?: { getLanguage?: () => string } }).app;
		if (appLike && typeof appLike.getLanguage === "function") {
			const lang = appLike.getLanguage();
			if (typeof lang === "string" && lang.length > 0) {
				return lang;
			}
		}
	} catch {
		// ignore
	}
	return null;
}

function normalizeLanguage(lang: string | null | undefined): AppLanguage {
	const value = (lang ?? "").toLowerCase();
	return value.startsWith("zh") ? "zh" : "en";
}

export function getLanguage(): AppLanguage {
	const obsidianLang = getObsidianLanguage();
	if (obsidianLang) {
		return normalizeLanguage(obsidianLang);
	}
	return normalizeLanguage(navigator.language);
}

export function setLanguage(lang: AppLanguage) {
	// Keep for backward compatibility; language now follows Obsidian UI language.
	window.localStorage.setItem("language", lang);
}

export function getLocalByLanguage(lang: AppLanguage): Local {
	return lang === "zh" ? new Zh() : new En();
}

export class Locals {

	static get(): Local {
		return getLocalByLanguage(getLanguage());
	}
}

export function isZh(): boolean {
	return getLanguage() === "zh";
}

export const weekDayMapping = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const cnWeekDayMapping = ["日", "一", "二", "三", "四", "五", "六"];

export const monthMapping = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export function localizedMonthMapping(month: number) {
	if (getLanguage() === "zh") {
		return `${month + 1}月`;
	}
	return monthMapping[month];
}

export function localizedWeekDayMapping(weekday: number, maxLength?: number) {
	let localizedWeekday;
	if (getLanguage() === "zh") {
		localizedWeekday = cnWeekDayMapping[weekday];
	} else {
		localizedWeekday = weekDayMapping[weekday];
	}

	if (maxLength) {
		return localizedWeekday.substring(0, maxLength);
	} else {
		return localizedWeekday;
	}
}

export function localizedYearMonthMapping(year: number, month: number) {
	if (getLanguage() === "zh") {
		return `${year}年${month + 1}月`;
	}
	return `${monthMapping[month]} ${year}`;
}
