import { parseYaml } from "obsidian";
import { NavBarConfig, NavBarItem } from "./navbarTypes";
import { Locals } from "./i18/messages";

export class NavBarParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NavBarParseError";
	}
}

export function parseNavBarConfig(code: string): NavBarConfig {
	const local = Locals.get();
	const trimmed = code.trim();
	if (!trimmed) {
		throw new NavBarParseError(local.navbar_error_empty);
	}

	try {
		const config = parseYaml(trimmed) as NavBarConfig | null;
		if (!config || typeof config !== "object") {
			throw new NavBarParseError(local.navbar_error_invalid_yaml);
		}

		if (!config.items || !Array.isArray(config.items) || config.items.length === 0) {
			throw new NavBarParseError(local.navbar_error_no_items);
		}

		// Filter out items without a label
		config.items = config.items.filter(
			(item): item is NavBarItem & { label: string } =>
				item && typeof item === "object" && typeof item.label === "string" && item.label.trim() !== ""
		);

		if (config.items.length === 0) {
			throw new NavBarParseError(local.navbar_error_no_items);
		}

		return config;
	} catch (error) {
		if (error instanceof NavBarParseError) {
			throw error;
		}

		const line = (error as { mark?: { line?: number } })?.mark?.line;
		if (typeof line === "number") {
			throw new NavBarParseError(local.navbar_error_yaml_failed);
		}

		throw new NavBarParseError(local.navbar_error_yaml_failed);
	}
}
