// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/no-floating-promises */
import type { App} from "obsidian";
import { Platform } from "obsidian";
import type { DataviewApi, DataArray, Literal } from "obsidian-dataview";
import { GraphProcessError } from "heatmap/processor/graphProcessError";
import type {
	CountFieldType,
	DataSource,
	DateFieldType,
	PropertySource} from "./types";
import {
	Data
} from "./types";
import { DateTime } from "luxon";
import type { Contribution, ContributionItem } from "heatmap/types";
import { isLuxonDateTime } from "heatmap/util/dateTimeUtils";
import { parseNumberOption } from "heatmap/util/utils";
import { dataviewDataFilterChain } from "./filter/dataviewDataFilter";

// Lazy-load dataview API.
// Primary path: grab the public API directly from app.plugins.plugins["dataview"] (how Obsidian plugins actually expose APIs).
// Fallback: try `require("obsidian-dataview").getAPI(app)` (works only in envs where dataview registers itself into the resolver).
// Cached on first success: the same API object for the lifetime of this module.
let _cachedDvApi: unknown | undefined;
function getDataviewApi(app: App): DataviewApi | null {
	if (_cachedDvApi !== undefined) return (_cachedDvApi ?? null) as DataviewApi | null;

	let api: any = null;

	// 1) app.plugins.plugins["dataview"] — Obsidian's standard cross-plugin exposure
	try {
		const plugins: any = (app as any).plugins;
		if (plugins?.plugins) {
			const dvPlugin: any =
				plugins.plugins["dataview"] ?? plugins.plugins["obsidian-dataview"];
			if (dvPlugin) {
				if (dvPlugin.api) {
					api = dvPlugin.api;
				} else if (typeof dvPlugin.getAPI === "function") {
					api = dvPlugin.getAPI(app);
				}
			}
		}
	} catch { /* ignore */ }

	// 2) fallback: require-based getAPI
	if (!api) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
			const mod = require("obsidian-dataview");
			if (mod && typeof mod.getAPI === "function") {
				api = mod.getAPI(app);
			}
		} catch { /* ignore */ }
	}

	_cachedDvApi = api ?? null;
	return (_cachedDvApi as DataviewApi) ?? null;
}

export abstract class BaseDataviewDataSourceQuery {
	abstract accept(source: DataSource): boolean;

	query(source: DataSource, app: App): Contribution[] {
		this.reconcileSourceValueIfNotExists(source);
		const dv = this.checkAndGetApi(app);
		const data = this.doQuery(dv, source);
		const queryData = this.mapToQueryData(data, source);
		const unsatisfiedData = queryData.filter((item) => !item.date);
		if (unsatisfiedData.length > 0) {
			console.warn(
				unsatisfiedData.length +
				" data can't be converted to date, please check the date field format",
				unsatisfiedData
			);
		}
		const result = queryData
			.filter((d) => d.date != undefined)
			.groupBy((d) => d.date?.toFormat("yyyy-MM-dd"))
			.map((entry) => {
				// performance optimization
				const value = this.countSumValueByCustomizeProperty(
					entry.rows,
					source.countField?.type,
					source.countField?.value
				);
				const items = entry.rows
					.map((item) => {
						let label;
						if (source.type == "PAGE") {
							// @ts-ignore
							label = item.raw.file.name;
						} else {
							label = item.raw.text;
						}

						const value =
							this.getAndConvertValueByCustomizeProperty(
								item,
								source.countField?.type,
								source.countField?.value
							);

						if (source.countField?.type == "PAGE_PROPERTY") {
							label += ` [${source.countField?.value}:${value}]`;
						}

						return {
							label: label,
							value: value,
							link: {
								// @ts-ignore
								href: item.raw.file.path,
								className: "internal-link",
								rel: 'noopener'
							},
							open: (e) => jump(e, source, item, app),
						} as ContributionItem;
					})
					.array();
				return {
					date: entry.key,
					value: value,
					items: items,
				} as Contribution;
			})
			.array();
		return result;
	}

	reconcileSourceValueIfNotExists(source: DataSource) {
		// Normalise the source value so it is always a plain string suitable for
		// `dv.pages(source.value)`.
		//
		// Rules:
		//   - undefined / null  -> ""            (query ALL pages/tasks)
		//   - '""', '" "', or any quoted whitespace-only string
		//                        -> ""            (fixes migration bug where old
		//                                           reconciliation persisted quoted
		//                                           empty values into settings)
		//   - any other string   -> used as-is
		//
		// The quoted-empty case is the root cause of "grid shows but no colour":
		// dv.pages('" "') returns no results, every daily count becomes 0, and
		// every cell renders the empty grey background.
		if (source.value === undefined || source.value === null) {
			source.value = "";
			return;
		}
		if (typeof source.value === "string") {
			const trimmed = source.value.trim();
			const quotedEmpty = /^"?\s*"?$/.test(trimmed); // zero/whitespace chars optionally wrapped in a pair of quotes
			if (quotedEmpty) {
				source.value = "";
			}
		}
	}

	checkAndGetApi(app: App): DataviewApi {
		const dv = getDataviewApi(app);
		if (!dv) {
			throw new GraphProcessError({
				summary: "Initialize Dataview failed",
				recommends: ["Please install Dataview plugin"],
			});
		}
		return dv;
	}

	abstract doQuery(
		dv: DataviewApi,
		source: DataSource
	): DataArray<Record<string, Literal>>;

	mapToQueryData(
		data: DataArray<Record<string, Literal>>,
		source: DataSource
	): DataArray<Data<Record<string, Literal>>> {
		if (source.dateField && source.dateField.type) {
			const dateFieldName = source.dateField.value;
			const dateFieldType = source.dateField.type;
			const dateFieldFormat = source.dateField.format;
			return data
			.filter((item) => {
				return dataviewDataFilterChain.every((filter) =>
					filter.filter(source, item, this)
				);
			})
			// 排除指定文件夹中的笔记
			.filter((item) => {
				if (source.excludeFolders && source.excludeFolders.length > 0) {
					// @ts-ignore - dataview item has file property with path
					const filePath = (item as any).file?.path || "";
					return !source.excludeFolders!.some(
						(folder) => filePath.startsWith(folder)
					);
				}
				return true;
			})
			.map((item) => {
					// @ts-ignore
					const fileName = item.file.name;
					if (dateFieldType == "FILE_CTIME") {
						// @ts-ignore
						return new Data(item, item.file.ctime);
					} else if (dateFieldType == "FILE_MTIME") {
						// @ts-ignore
						return new Data(item, item.file.mtime);
					} else if (dateFieldType == "FILE_NAME") {
						const dateTime = this.toDateTime(
							fileName,
							fileName,
							dateFieldFormat
						);
						if (dateTime) {
							return new Data(item, dateTime);
						} else {
							return new Data(item);
						}
					} else {
						const propertySource =
							this.getPropertySourceByDateFieldType(
								source.dateField?.type
							);
						const fieldValue = this.getValueByCustomizeProperty(
							item,
							propertySource,
							dateFieldName || ""
						);
						if (isLuxonDateTime(fieldValue)) {
							return new Data(item, fieldValue as DateTime);
						} else {
							const dateTime = this.toDateTime(
								fileName,
								fieldValue as string,
								dateFieldFormat
							);
							return new Data(item, dateTime);
						}
					}
				});
		} else {
			return data.map((item) => {
				// @ts-ignore
				return new Data(item, item.file.ctime);
			});
		}
	}

	toDateTime(
		page: string,
		date: string,
		dateFieldFormat?: string
	): DateTime | undefined {
		if (typeof date !== "string") {
			console.warn(
				"can't parse date, it's a valid format? " +
				date +
				" in page " +
				page
			);
			return undefined;
		}
		try {
			let dateTime = null;
			if (dateFieldFormat) {
				dateTime = DateTime.fromFormat(date, dateFieldFormat);
				if (dateTime.isValid) {
					return dateTime;
				}
			}

			dateTime = DateTime.fromISO(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromRFC2822(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromHTTP(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromSQL(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm");
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromFormat(date, "yyyy-MM-dd'T'HH:mm");
			if (dateTime.isValid) {
				return dateTime;
			}
		} catch {
			console.warn(
				"can't parse date, it's a valid format? " +
				date +
				" in page " +
				page
			);
		}
		return undefined;
	}

	countSumValueByCustomizeProperty(
		groupData: DataArray<Data<Record<string, Literal>>>,
		propertyType?: CountFieldType,
		propertyName?: string
	): number {
		if (!propertyType || propertyType == "DEFAULT") {
			return groupData.length;
		}

		if (propertyName) {
			return groupData
				.map((item) => {
					return this.getAndConvertValueByCustomizeProperty(
						item,
						propertyType,
						propertyName
					);
				})
				.array()
				.reduce((a, b) => a + b, 0);
		}
		return groupData.length;
	}

	getAndConvertValueByCustomizeProperty(
		item: Data<Record<string, Literal>>,
		propertyType?: CountFieldType,
		propertyName?: string
	): number {
		if (propertyName) {
			let propertySource: PropertySource;
			switch (propertyType) {
				case "PAGE_PROPERTY":
					propertySource = "PAGE";
					break;
				case "TASK_PROPERTY":
					propertySource = "TASK";
					break;
				default:
					propertySource = "UNKNOWN";
					break;
			}

			const r = this.getValueByCustomizeProperty(
				item.raw,
				propertySource,
				propertyName
			);
			if (r == undefined || r == null) {
				return 0;
			}

			if (r instanceof Array) {
				return r.length;
			}

			if (typeof r === "number" || r instanceof Number) {
				return r as number;
			}

			if (typeof r === "string" || r instanceof String) {
				const n = parseNumberOption(r as string);
				if (n != null) {
					return n;
				}
				return r.trim() === "" ? 0 : 1;
			}

			if (typeof r === "boolean" || r instanceof Boolean) {
				return r ? 1 : 0;
			}
			return 1;
		} else {
			return 1;
		}
	}

	abstract getValueByCustomizeProperty(
		data: Record<string, Literal>,
		propertyType: PropertySource,
		propertyName: string
	): any;

	getPropertySourceByCountFieldType(type: CountFieldType): PropertySource {
		switch (type) {
			case "PAGE_PROPERTY":
				return "PAGE";
			case "TASK_PROPERTY":
				return "TASK";
			default:
				return "UNKNOWN";
		}
	}

	getPropertySourceByDateFieldType(type?: DateFieldType): PropertySource {
		switch (type) {
			case "FILE_CTIME":
			case "FILE_MTIME":
			case "FILE_NAME":
			case "PAGE_PROPERTY":
				return "PAGE";
			case "TASK_PROPERTY":
				return "TASK";
			default:
				return "UNKNOWN";
		}
	}
}

function jump(
	evt: MouseEvent,
	source: DataSource,
	item: Data<Record<string, Literal>>,
	app: App
) {
	if (source.type != "PAGE") {
		const selectionState = {
			eState: {
				cursor: {
					from: {
						line: item.raw.line,
						// @ts-ignore
						ch: item.raw.position.start.col,
					},
					to: {
						// @ts-ignore
						line: item.raw.line + item.raw.lineCount - 1,
						// @ts-ignore
						ch: item.raw.position.end.col,
					},
				},
				line: item.raw.line,
			},
		};
		// MacOS interprets the Command key as Meta.
		app.workspace.openLinkText(
			// @ts-ignore
			item.raw.link.toFile().obsidianLink(),
			// @ts-ignore
			item.raw.path,
			evt.ctrlKey || (evt.metaKey && Platform.isMacOS),
			selectionState as any
		);
	} else {
		app.workspace.openLinkText(
			// @ts-ignore
			item.raw.file?.path,
			"",
			evt.ctrlKey || (evt.metaKey && Platform.isMacOS)
		);
	}
}
