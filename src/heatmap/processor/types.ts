/* eslint-disable @typescript-eslint/only-throw-error */
import { isZh } from "heatmap/i18/messages";
import { DEFAULT_RULES } from "heatmap/constants";
import type { DataSource } from "heatmap/query/types";
import type {
	Contribution,
	CellStyleRule,
	HeatmapConfig,
} from "heatmap/types";
import {
	MISS_CONFIG,
	MISS_DATASOURCE_OR_DATA,
	INVALID_GRAPH_TYPE,
	MISS_DAYS_OR_RANGE_DATE,
	INVALID_DATE_FORMAT,
	INVALID_START_OF_WEEK,
} from "./bizErrors";
import { GraphProcessError } from "./graphProcessError";
import {
	getLatestMonthAbsoluteFromAndEnd,
	getLatestYearAbsoluteFromAndEnd,
	toFormattedDate,
} from "heatmap/util/dateUtils";

export class YamlGraphConfig {
	/**
	 * basic settings
	 */
	title?: string;
	graphType: string;
	dataSource: DataSource;
	dateRangeValue?: number;
	dateRangeType?: DateRangeType;
	fromDate?: string;
	toDate?: string;
	data: Contribution[];

	/**
	 * style settings
	 */
	titleStyle: Partial<CSSStyleDeclaration>;
	fillTheScreen: boolean;
	startOfWeek: number;
	enableMainContainerShadow?: boolean;
	showCellRuleIndicators: boolean;
	mainContainerStyle?: Partial<CSSStyleDeclaration>;
	cellStyle?: Partial<CSSStyleDeclaration>;
	cellStyleRules?: CellStyleRule[];

	// deprecated
	days?: number;
	query?: string;
	dateField?: string;
	dateFieldFormat?: string;

	constructor() {
		this.title = "Contributions";
		this.graphType = "default";
		this.dateRangeValue = 180;
		this.dateRangeType = "LATEST_DAYS";
		this.startOfWeek = isZh() ? 1 : 0;
		this.showCellRuleIndicators = true;
		this.titleStyle = {
			textAlign: "left",
			fontSize: "14px",
			fontWeight: "normal",
		};
		this.dataSource = {
			type: "PAGE",
			value: "",
			dateField: {},
		} as DataSource;
		this.fillTheScreen = false;
		this.enableMainContainerShadow = false;
		this.cellStyleRules = [...DEFAULT_RULES];

		// deprecated
		this.query = undefined;
		this.dateFieldFormat = undefined;
		this.dateField = undefined;
		this.days = undefined;
	}

	static toHeatmapConfig(
		config: YamlGraphConfig
	): HeatmapConfig {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { query, dateField, ...rest } = config;

		if (config.dateRangeType != "FIXED_DATE_RANGE") {
			if (config.dateRangeType == "LATEST_DAYS") {
				// Ensure days is a positive integer; otherwise default to 365.
				// When days is 0 (falsy), generateContributionData falls through
				// to generateByData() which spans ALL notes' date range —
				// causing the heatmap to show multiple years of month labels.
				// NOTE: days must come AFTER ...rest, otherwise rest.days
				// (undefined from the deprecated field) overwrites it.
				const days =
					config.dateRangeValue && config.dateRangeValue > 0
						? config.dateRangeValue
						: 365;
				return {
					...rest,
					days,
				} as HeatmapConfig;
			}

			if (config.dateRangeType == "LATEST_MONTH") {
				const { start, end } = getLatestMonthAbsoluteFromAndEnd(
					config.dateRangeValue || 0
				);
				return {
					...rest,
					days: undefined,
					fromDate: toFormattedDate(start),
					toDate: toFormattedDate(end),
				} as HeatmapConfig;
			}

			if (config.dateRangeType == "LATEST_YEAR") {
				const { start, end } = getLatestYearAbsoluteFromAndEnd(
					config.dateRangeValue || 0
				);
				return {
					...rest,
					days: undefined,
					fromDate: toFormattedDate(start),
					toDate: toFormattedDate(end),
				} as HeatmapConfig;
			}
		}
		return rest as HeatmapConfig;
	}

	static validate(config: YamlGraphConfig): void {
		if (!config) {
			throw new GraphProcessError(MISS_CONFIG());
		}
		if (!config.dataSource && !config.data) {
			throw new GraphProcessError(MISS_DATASOURCE_OR_DATA());
		}

		if (config.graphType) {
			const graphTypes = ["default", "month-track", "calendar"];
			if (!graphTypes.includes(config.graphType)) {
				throw new GraphProcessError(
					INVALID_GRAPH_TYPE(config.graphType)
				);
			}
		}

		if (!config.dateRangeValue) {
			if (!config.fromDate || !config.toDate) {
				throw new GraphProcessError(MISS_DAYS_OR_RANGE_DATE());
			}
		}

		if (config.fromDate || config.toDate) {
			// yyyy-MM-dd
			const dateReg = /^\d{4}-\d{2}-\d{2}$/;
			if (config.fromDate && !dateReg.test(config.fromDate)) {
				throw new GraphProcessError(
					INVALID_DATE_FORMAT(config.fromDate)
				);
			}

			if (config.toDate && !dateReg.test(config.toDate)) {
				throw new GraphProcessError(INVALID_DATE_FORMAT(config.toDate));
			}
		}

		if (config.startOfWeek) {
			const statOfWeeks = [0, 1, 2, 3, 4, 5, 6];
			if (typeof config.startOfWeek !== "number") {
				try {
					config.startOfWeek = parseInt(config.startOfWeek);
				} catch {
					throw new GraphProcessError(
						INVALID_START_OF_WEEK(config.startOfWeek)
					);
				}
			}
			if (!statOfWeeks.includes(config.startOfWeek)) {
				throw new GraphProcessError(
					INVALID_START_OF_WEEK(config.startOfWeek)
				);
			}
		}
	}
}

export class ValidationResult {
	valid: boolean;
	message?: string;
}

export type DateRangeType =
	| "LATEST_DAYS"
	| "LATEST_MONTH"
	| "LATEST_YEAR"
	| "FIXED_DATE_RANGE";
