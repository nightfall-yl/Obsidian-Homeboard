import {
	ElementCardCardConfig,
	ElementCardConfig,
	ElementCardLinkItem,
} from "./elementCardTypes";

function needsQuotes(value: string): boolean {
	return value === "" || /[:#[\]{}|>*&!%@`'"]/.test(value) || /^\s|\s$/.test(value);
}

function formatScalar(value: unknown): string {
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	if (value == null) {
		return '""';
	}

	const text = String(value);
	if (text === '""') {
		return "'\"\"'";
	}

	if (needsQuotes(text)) {
		return JSON.stringify(text);
	}

	return text;
}

function indent(level: number): string {
	return "  ".repeat(level);
}

function pushLinks(lines: string[], links: ElementCardLinkItem[], level: number) {
	lines.push(`${indent(level)}links:`);
	for (const link of links) {
		lines.push(`${indent(level + 1)}- label: ${formatScalar(link.label)}`);
		lines.push(`${indent(level + 2)}url: ${formatScalar(link.url)}`);
	}
}

function pushCard(lines: string[], card: ElementCardCardConfig, level: number) {
	lines.push(`${indent(level)}- type: links`);

	if (card.title) {
		lines.push(`${indent(level + 1)}title: ${formatScalar(card.title)}`);
	}
	if (card.column !== undefined) {
		lines.push(`${indent(level + 1)}column: ${formatScalar(card.column)}`);
	}
	if (card.span !== undefined) {
		lines.push(`${indent(level + 1)}span: ${formatScalar(card.span)}`);
	}
	if (card.row !== undefined) {
		lines.push(`${indent(level + 1)}row: ${formatScalar(card.row)}`);
	}
	lines.push(`${indent(level + 1)}linksLayout: ${formatScalar(card.linksLayout ?? "inline")}`);
	if (card.palettePreset) {
		lines.push(`${indent(level + 1)}palettePreset: ${formatScalar(card.palettePreset)}`);
	}
	if (card.cardBackgroundColor) {
		lines.push(`${indent(level + 1)}cardBackgroundColor: ${formatScalar(card.cardBackgroundColor)}`);
	}
	if (card.cardBackgroundTransparency !== undefined) {
		lines.push(`${indent(level + 1)}cardBackgroundTransparency: ${formatScalar(card.cardBackgroundTransparency)}`);
	}
	if (card.titleColor) {
		lines.push(`${indent(level + 1)}titleColor: ${formatScalar(card.titleColor)}`);
	}
	if (card.linkColor) {
		lines.push(`${indent(level + 1)}linkColor: ${formatScalar(card.linkColor)}`);
	}
	if (card.separatorColor) {
		lines.push(`${indent(level + 1)}separatorColor: ${formatScalar(card.separatorColor)}`);
	}

	pushLinks(lines, card.links ?? [], level + 1);
}

export function stringifyElementCardConfig(config: ElementCardConfig): string {
	const lines: string[] = [];

	if (config.id) {
		lines.push(`id: ${formatScalar(config.id)}`);
	}
	if (config.title) {
		lines.push(`title: ${formatScalar(config.title)}`);
	}
	if (config.titleFontSize !== undefined) {
		lines.push(`titleFontSize: ${formatScalar(config.titleFontSize)}`);
	}
	lines.push(`columns: ${formatScalar(config.columns ?? 2)}`);
	lines.push(`gap: ${formatScalar(config.gap ?? 16)}`);
	if (config.cardBorderColor) {
		lines.push(`cardBorderColor: ${formatScalar(config.cardBorderColor)}`);
	}
	if (config.cardBorderTransparency !== undefined) {
		lines.push(`cardBorderTransparency: ${formatScalar(config.cardBorderTransparency)}`);
	}
	if (config.resizerColor) {
		lines.push(`resizerColor: ${formatScalar(config.resizerColor)}`);
	}
	if (config.resizerTransparency !== undefined) {
		lines.push(`resizerTransparency: ${formatScalar(config.resizerTransparency)}`);
	}
	lines.push("cards:");

	for (const card of config.cards ?? []) {
		pushCard(lines, card, 1);
	}

	return lines.join("\n");
}
