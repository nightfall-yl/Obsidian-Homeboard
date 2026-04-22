import { parseYaml } from "obsidian";
import { ElementCardError } from "./elementCardError";
import { ElementCardConfig, ElementCardLinkItem } from "./elementCardTypes";
import { Locals } from "./i18/messages";

function parseShortcutLinks(line: string): ElementCardLinkItem[] {
	const links: ElementCardLinkItem[] = [];
	const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\)/g;

	for (const match of line.matchAll(pattern)) {
		if (match[1]) {
			const target = match[1].trim();
			const label = (match[2] || match[1]).trim();
			links.push({
				label,
				url: target,
			});
			continue;
		}

		if (match[3] && match[4]) {
			links.push({
				label: match[3].trim(),
				url: match[4].trim(),
			});
		}
	}

	return links;
}

function parseShortcutElementCardConfig(code: string): ElementCardConfig | null {
	const rawLines = code
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (!rawLines.some((line) => line === "===")) {
		return null;
	}

	let id: string | undefined;
	if (rawLines[0]?.startsWith("id:")) {
		id = rawLines.shift()?.slice(3).trim();
	}

	const sections = rawLines
		.join("\n")
		.split(/\n===\n/)
		.map((chunk) => chunk.split("\n").map((line) => line.trim()).filter(Boolean))
		.filter((chunk) => chunk.length >= 2);

	if (sections.length === 0) {
		return null;
	}

	return {
		id,
		columns: sections.length,
		gap: 0,
		cards: sections.map((section) => ({
			type: "links" as const,
			title: section[0],
			span: 1,
			linksLayout: "inline" as const,
			links: parseShortcutLinks(section.slice(1).join(" ")),
		})),
	};
}

export function parseElementCardConfig(code: string): ElementCardConfig {
	const local = Locals.get();
	if (!code.trim()) {
		throw new ElementCardError({
				summary: local.elementCard_error_empty,
			recommends: [local.elementCard_error_empty_recommend],
		});
	}

	try {
		const shortcutConfig = parseShortcutElementCardConfig(code);
		if (shortcutConfig) {
			return shortcutConfig;
		}

		const config = parseYaml(code) as ElementCardConfig | null;
		if (!config || typeof config !== "object") {
			throw new ElementCardError({
				summary: local.elementCard_error_invalid_yaml_object,
			});
		}

		if (!config.cards || !Array.isArray(config.cards) || config.cards.length === 0) {
			throw new ElementCardError({
				summary: local.elementCard_error_card_required,
				recommends: [local.elementCard_error_card_required_recommend],
			});
		}

		return config;
	} catch (error) {
		if (error instanceof ElementCardError) {
			throw error;
		}

		const line = (error as { mark?: { line?: number } })?.mark?.line;
		if (typeof line === "number") {
			throw new ElementCardError({
				summary: local.elementCard_error_yaml_failed_at_line.replace("{line}", String(line + 1)),
			});
		}

		throw new ElementCardError({
			summary: local.elementCard_error_yaml_failed,
		});
	}
}
