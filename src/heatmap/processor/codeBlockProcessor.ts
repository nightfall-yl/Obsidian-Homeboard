// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/only-throw-error */
import type { App, MarkdownPostProcessorContext} from "obsidian";
import { parseYaml } from "obsidian";
import { Renders } from "heatmap/render/renders";

import { MISS_CONFIG } from "./bizErrors";
import { GraphProcessError } from "./graphProcessError";
import { CompositeDataSourceQuery } from "heatmap/query/compositeDataSourceQuery";
import { YamlGraphConfig } from "./types";
import { YamlConfigReconciler } from "./yamlConfigReconciler";

// Lazy-load dataview API.
// Primary path: grab the public API directly from app.plugins.plugins["dataview"] (how Obsidian plugins actually expose APIs).
// Fallback: try `require("obsidian-dataview").getAPI(app)` (works only in envs where dataview registers itself into the resolver).
// Cached on first success: the same API object for the lifetime of this module.
let _cachedDvApi: unknown | undefined;
function getDataviewApi(app: App): any {
	if (_cachedDvApi !== undefined) return _cachedDvApi as any;

	let api: any = null;

	// 1) app.plugins.plugins["dataview"] — Obsidian's standard cross-plugin exposure
	try {
		const plugins: any = (app as any).plugins;
		if (plugins?.plugins) {
			const dvPlugin: any = plugins.plugins["dataview"] ?? plugins.plugins["obsidian-dataview"];
			if (dvPlugin) {
				if (dvPlugin.api) {
					api = dvPlugin.api;
				} else if (typeof dvPlugin.getAPI === "function") {
					api = dvPlugin.getAPI(app);
				}
			}
		}
	} catch { /* ignore */ }

	// 2) fallback: require-based getAPI (environments that pre-bundle obsidian-dataview into resolver)
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
	return _cachedDvApi as any;
}

export class CodeBlockProcessor {
	dataSourceQuery: CompositeDataSourceQuery = new CompositeDataSourceQuery();

	async renderFromCodeBlock(
		code: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		app: App
	) {
		try {
			const graphConfig: YamlGraphConfig = this.loadYamlConfig(el, code);
			await this.renderFromYaml(graphConfig, el, app);
		} catch (e) {
			if (e instanceof GraphProcessError) {
				Renders.renderErrorTips(el, e.summary, e.recommends);
			} else {
				console.error(e);
				const notice = "unexpected error: " + e.message;
				Renders.renderErrorTips(el, notice);
			}
		}
	}

	async renderFromYaml(graphConfig: YamlGraphConfig, el: HTMLElement, app: App) {
		const renderCallback = () => {
			try {
				// validate
				YamlGraphConfig.validate(graphConfig);
				const data = this.dataSourceQuery.query(
					graphConfig.dataSource,
					app
				);

				const aggregatedData = [];
				if (graphConfig.data) {
					aggregatedData.push(...graphConfig.data);
				}
				aggregatedData.push(...data);
				graphConfig.data = aggregatedData;

				// render
				Renders.render(
					el,
					YamlGraphConfig.toHeatmapConfig(graphConfig)
				);
			} catch (e) {
				if (e instanceof GraphProcessError) {
					Renders.renderErrorTips(el, e.summary, e.recommends);
				} else {
					console.error(e);
					const notice = "unexpected error: " + e.message;
					Renders.renderErrorTips(el, notice);
				}
			}
		}

		// Poll for dataview readiness up to ~8s, then fall back to index-ready event,
		// and finally timeout with a clear error if nothing happens.
		let attempts = 0;
		const maxAttempts = 16; // 16 * 500ms = 8s
		let fired = false;
		let eventOff: (() => void) | null = null;
		const tryOnce = (): boolean => {
			if (fired) return true;
			const dv = getDataviewApi(app);
			if (dv && dv.index?.initialized) {
				fired = true;
				if (eventOff) { eventOff(); eventOff = null; }
				renderCallback();
				return true;
			}
			return false;
		};

		// Immediate try first.
		if (tryOnce()) return;

		// Event fallback (use once; store off-function for cancellation).
		const eventHandler = () => { if (!fired) tryOnce() || renderCallback(); };
		// @ts-ignore
		app.metadataCache.on("dataview:index-ready", eventHandler);
		const boundOff = app.metadataCache.off.bind(app.metadataCache);
		eventOff = () => {
			try { boundOff("dataview:index-ready", eventHandler); } catch { /* ignore */ }
		};

		// Polling fallback.
		const pollId = window.setInterval(() => {
			attempts++;
			if (tryOnce()) {
				window.clearInterval(pollId);
				return;
			}
			if (attempts >= maxAttempts) {
				window.clearInterval(pollId);
				if (!fired) {
					const dv = getDataviewApi(app);
					fired = true;
					if (eventOff) { eventOff(); eventOff = null; }
					if (!dv) {
						Renders.renderErrorTips(
							el,
							"Initialize Dataview failed",
							["Please install and enable Dataview plugin"]
						);
					} else {
						Renders.renderErrorTips(
							el,
							"Dataview index is not ready (timeout)",
							["Please wait for Dataview to finish indexing your vault, then refresh the dashboard"]
						);
					}
				}
			}
		}, 500);
	}

	loadYamlConfig(el: HTMLElement, code: string): YamlGraphConfig {
		if (code == null || code.trim() == "") {
			throw new GraphProcessError(MISS_CONFIG());
		}

		try {
			// @ts-ignore
			const yamlConfig: YamlGraphConfig = parseYaml(code);
			return YamlConfigReconciler.reconcile(yamlConfig);
		} catch (e) {
			if (e.mark?.line) {
				throw new GraphProcessError({
					summary:
						"yaml parse error at line " +
						(e.mark.line + 1) +
						", please check the format",
				});
			} else {
				throw new GraphProcessError({
					summary:
						"content parse error, please check the format(such as blank, indent)",
				});
			}
		}
	}
}
