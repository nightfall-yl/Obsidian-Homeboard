// @ts-nocheck
import type { CellStyleRule } from "../types";

export function mapBy<T, R>(
	arr: T[],
	keyMapping: (item: T) => string,
	valueMapping: (item: T) => R,
	aggregator: (a: R, b: R) => R
) {
	const map = new Map<string, R>();
	for (const item of arr) {
		const key = keyMapping(item);
		if (map.has(key)) {
			//@ts-ignore
			map.set(key, aggregator(map.get(key), valueMapping(item)));
		} else {
			map.set(key, valueMapping(item));
		}
	}
	return map;
}

export function matchCellStyleRule(value: number, rules: CellStyleRule[]): CellStyleRule | null {
	// Treat zero specially: no color rule, caller falls back to empty-cell styling.
	if (!value || value <= 0) return null;

	// First pass: strict in-range match [min, max) (matches GitHub-style step distribution).
	for (let i = 0; i < rules.length; i++) {
		if (value >= rules[i].min && value < rules[i].max) {
			return rules[i];
		}
	}
	// Fallback (handles boundary equalities like value===max of last rule,
	// or any mismatch between generated data ranges and declared rules).
	if (rules.length === 0) return null;
	if (value <= rules[0].min) return rules[0];
	return rules[rules.length - 1];
}

export function parseNumberOption(str: string): number | null {
	const trimmedStr = str.trim();

	if (trimmedStr === "") {
		return null;
	}
	const num = Number(trimmedStr);

	if (Number.isNaN(num)) {
		return null;
	}
	return num;
}
