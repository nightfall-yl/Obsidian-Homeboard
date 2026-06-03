import { NavBarConfig, NavBarItem } from "./navbarTypes";

function needsQuotes(value: string): boolean {
	return value === "" || /[:#[\]{}|>*&!%@`'"]/.test(value) || /^\s|\s$/.test(value);
}

function formatScalar(value: unknown): string {
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	if (value == null) {
		return `""`;
	}

	const text = String(value);
	if (text === `""`) {
		return `'""'`;
	}

	if (needsQuotes(text)) {
		return JSON.stringify(text);
	}

	return text;
}

function indent(level: number): string {
	return "  ".repeat(level);
}

function pushItems(lines: string[], items: NavBarItem[], level: number) {
	lines.push(`${indent(level)}items:`);
	for (const item of items) {
		lines.push(`${indent(level + 1)}- label: ${formatScalar(item.label)}`);
		if (item.icon) {
			lines.push(`${indent(level + 2)}icon: ${formatScalar(item.icon)}`);
		}
		if (item.url !== undefined && item.url !== "") {
			lines.push(`${indent(level + 2)}url: ${formatScalar(item.url)}`);
		}
		if (item.action) {
			lines.push(`${indent(level + 2)}action: ${formatScalar(item.action)}`);
		}
	}
}

export function stringifyNavBarConfig(config: NavBarConfig): string {
	const lines: string[] = [];

	if (config.align) {
		lines.push(`align: ${formatScalar(config.align)}`);
	}
	if (config.desktopGap) {
		lines.push(`desktopGap: ${formatScalar(config.desktopGap)}`);
	}
	if (config.desktopRowGap) {
		lines.push(`desktopRowGap: ${formatScalar(config.desktopRowGap)}`);
	}
	if (config.mobileGap) {
		lines.push(`mobileGap: ${formatScalar(config.mobileGap)}`);
	}
	if (config.mobileRowGap) {
		lines.push(`mobileRowGap: ${formatScalar(config.mobileRowGap)}`);
	}

	pushItems(lines, config.items, 0);

	return lines.join("\n");
}
