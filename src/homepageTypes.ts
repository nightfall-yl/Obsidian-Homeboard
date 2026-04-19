export type HomepageCardType = "links";
export type HomepageCardPalettePreset =
	| "sage"
	| "mist"
	| "amber"
	| "plum"
	| "slate";

export interface HomepageCardPalette {
	label: string;
	background: string;
	title: string;
	link: string;
	separator: string;
}

export interface HomepageLinkItem {
	label: string;
	url: string;
}

export interface HomepageCardConfig {
	type?: HomepageCardType;
	title?: string;
	column?: number;
	span?: number;
	linksLayout?: "stack" | "inline";
	palettePreset?: HomepageCardPalettePreset;
	cardBackgroundColor?: string;
	cardBackgroundTransparency?: number;
	titleColor?: string;
	linkColor?: string;
	separatorColor?: string;
	links?: HomepageLinkItem[];
}

export interface HomepageConfig {
	id?: string;
	title?: string;
	titleFontSize?: number;
	columns?: number;
	gap?: string | number;
	cardBorderColor?: string;
	cardBorderTransparency?: number;
	resizerColor?: string;
	resizerTransparency?: number;
	cards?: HomepageCardConfig[];
}

// ===== Force View Mode Settings =====
export interface ForceViewModeSettings {
	enabled: boolean;
	debounceTimeout: number;
	ignoreOpenFiles: boolean;
	ignoreForceViewAll: boolean;
	folders: { folder: string; viewMode: string }[];
	files: { filePattern: string; viewMode: string }[];
}

export const DEFAULT_FORCE_VIEW_MODE_SETTINGS: ForceViewModeSettings = {
	enabled: true,
	debounceTimeout: 300,
	ignoreOpenFiles: false,
	ignoreForceViewAll: false,
	folders: [{ folder: "", viewMode: "" }],
	files: [{ filePattern: "", viewMode: "" }],
};

// ===== Remember Cursor Position Settings =====
export interface CursorPositionSettings {
	enabled: boolean;
	dbFileName: string;
	delayAfterFileOpening: number;
	saveTimer: number;
}

export const SAFE_DB_FLUSH_INTERVAL = 5000;

export const DEFAULT_CURSOR_POSITION_SETTINGS: CursorPositionSettings = {
	enabled: true,
	dbFileName: ".obsidian/plugins/obsidian-homeboard/cursor-positions.json",
	delayAfterFileOpening: 100,
	saveTimer: SAFE_DB_FLUSH_INTERVAL,
};

// ===== Homepage Component Settings =====
export interface HomepageComponentSettings {
	defaultColumns: number;
	defaultGap: number;
	cardPadding: number;
	cardBorderRadius: number;
	cardBorderColor: string;
	cardBorderTransparency: number;
	showResizers: boolean;
	resizerWidth: number;
	resizerColor: string;
	resizerTransparency: number;
	minColumnWidthPercent: number;
	// Integrated plugin settings
	forceViewMode: ForceViewModeSettings;
	cursorPosition: CursorPositionSettings;
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageComponentSettings = {
	defaultColumns: 2,
	defaultGap: 2,
	cardPadding: 16,
	cardBorderRadius: 16,
	cardBorderColor: "#d0d7de",
	cardBorderTransparency: 100,
	showResizers: true,
	resizerWidth: 4,
	resizerColor: "#c0cad5",
	resizerTransparency: 100,
	minColumnWidthPercent: 15,
	forceViewMode: DEFAULT_FORCE_VIEW_MODE_SETTINGS,
	cursorPosition: DEFAULT_CURSOR_POSITION_SETTINGS,
};

export const HOMEPAGE_CARD_PALETTES: Record<HomepageCardPalettePreset, HomepageCardPalette> = {
	sage: {
		label: "苔绿晨雾",
		background: "#edf4ea",
		title: "#3d7f31",
		link: "#2f6d25",
		separator: "#8fb986",
	},
	mist: {
		label: "雾蓝纸页",
		background: "#eaf3fb",
		title: "#2f6fa8",
		link: "#245c90",
		separator: "#98b6d0",
	},
	amber: {
		label: "琥珀米纸",
		background: "#fbf3df",
		title: "#9b6a18",
		link: "#7b5311",
		separator: "#d9ba7a",
	},
	plum: {
		label: "梅紫晚霞",
		background: "#f4eaf2",
		title: "#7d3c6d",
		link: "#653057",
		separator: "#c59ec0",
	},
	slate: {
		label: "石墨冷灰",
		background: "#eef1f4",
		title: "#465361",
		link: "#36424f",
		separator: "#aeb7bf",
	},
};

export function resolveHomepageCardPalette(card: HomepageCardConfig) {
	const presetPalette = card.palettePreset
		? HOMEPAGE_CARD_PALETTES[card.palettePreset]
		: null;

	return {
		background: presetPalette?.background ?? card.cardBackgroundColor ?? "#ffffff",
		title: presetPalette?.title ?? card.titleColor ?? "#61b94d",
		link: presetPalette?.link ?? card.linkColor ?? "#1d86ea",
		separator: presetPalette?.separator ?? card.separatorColor ?? "#77ba61",
	};
}
