import type { DateRangeType, YamlGraphConfig } from "./types";

export class YamlConfigReconciler {
	constructor() {}

	static reconcile(yamlConfig: YamlGraphConfig): YamlGraphConfig {
		return YamlConfigReconciler.reconcile_from_0_4_0(yamlConfig);
	}

	static reconcile_from_0_4_0(yamlConfig: YamlGraphConfig): YamlGraphConfig {
		if (!yamlConfig.dataSource) {
			// NOTE: a missing/empty legacy `query` means "no filter / ALL pages".
			// DO NOT coerce the empty case into the quoted string '""' — that is
			// the literal two-character value `""` and breaks dv.pages(...),
			// producing zero contributions and an all-grey grid.
			const legacyQuery = yamlConfig.query ?? "";
			const cleanedQuery =
				typeof legacyQuery === "string" && /^"?\s*"?$/.test(legacyQuery.trim())
					? ""
					: legacyQuery;

			yamlConfig.dataSource = {
				type: "PAGE",
				value: cleanedQuery,
				filters: [],
				dateField: {
					type: "PAGE_PROPERTY",
					value: yamlConfig.dateField,
					format: yamlConfig.dateFieldFormat,
				},
				countField: {
					type: "DEFAULT",
				},
			};
		}

		if (!yamlConfig.dateRangeType) {
			const hasLatestDays = yamlConfig.days !== undefined;
			const dateTypeValue: DateRangeType = hasLatestDays
				? "LATEST_DAYS"
				: "FIXED_DATE_RANGE";
			yamlConfig.dateRangeType = dateTypeValue;
		}

		if (!yamlConfig.dateRangeValue) {
			yamlConfig.dateRangeValue = yamlConfig.days;
		}

		yamlConfig.query = undefined;
		yamlConfig.dateField = undefined;
		yamlConfig.dateFieldFormat = undefined;
		return yamlConfig;
	}
}
