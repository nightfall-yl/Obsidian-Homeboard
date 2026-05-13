export enum HomepageKind {
	File = "file",
	DailyNote = "daily-note",
}

export enum OpenMode {
	ReplaceAll = "replace-all",
	ReplaceLast = "replace-last",
	Retain = "retain",
}

export enum ViewMode {
	Default = "default",
	Reading = "reading",
	Source = "source",
	LivePreview = "live-preview",
}

export interface HomepageSettings {
	enabled: boolean;
	kind: HomepageKind;
	value: string;
	openOnStartup: boolean;
	openMode: OpenMode;
	viewMode: ViewMode;
	revertView: boolean;
	openWhenEmpty: boolean;
	autoCreate: boolean;
	pinInFileExplorer: boolean;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
	enabled: true,
	kind: HomepageKind.File,
	value: "Home",
	openOnStartup: true,
	openMode: OpenMode.ReplaceAll,
	viewMode: ViewMode.Default,
	revertView: true,
	openWhenEmpty: false,
	autoCreate: false,
	pinInFileExplorer: false,
};
