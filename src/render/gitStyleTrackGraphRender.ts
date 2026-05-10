import { ContributionCellData, HeatmapConfig } from "src/types";
import { mapBy, matchCellStyleRule } from "src/util/utils";
import { BaseGraphRender } from "./graphRender";
import { distanceBeforeTheStartOfWeek } from "src/util/dateUtils";
import {
	localizedMonthMapping,
	localizedWeekDayMapping,
} from "src/i18/messages";

export class GitStyleTrackGraphRender extends BaseGraphRender {
	constructor() {
		super();
	}

	graphType(): string {
		return "default";
	}

	render(root: HTMLElement, graphConfig: HeatmapConfig): void {
		const graphEl = this.createGraphEl(root)

		const main = this.createMainEl(graphEl, graphConfig)

		if (graphConfig.title && graphConfig.title.trim() != "") {
			this.renderTitle(graphConfig, main);
		}

		const chartsScrollEl = this.createChartsScrollEl(main);

		const chartsEl = createDiv({
			cls: ["charts", "default"],
			parent: chartsScrollEl,
		});
		this.applyCellGlobalStyleToContainer(chartsEl, graphConfig);

		this.renderCellRuleIndicator(graphConfig, main);
		const activityContainer = this.renderActivityContainer(graphConfig, main);

		const weekTextColumns = createDiv({
			cls: "column",
			parent: chartsEl,
		});

		const contributionData: ContributionCellData[] =
			this.generateContributionData(graphConfig);

		if (contributionData.length > 0) {
			const from = new Date(contributionData[0].date);
			const weekDayOfFromDate = from.getDay();
			const firstHoleCount = distanceBeforeTheStartOfWeek(
				graphConfig.startOfWeek || 0,
				weekDayOfFromDate
			);
			for (let i = 0; i < firstHoleCount; i++) {
				contributionData.unshift({
					date: "$HOLE$",
					weekDay: -1,
					month: -1,
					monthDate: -1,
					year: -1,
					value: 0,
				});
			}
		}

		const contributionMapByYearMonth = mapBy(
			contributionData,
			(item) => `${item.year}-${item.month + 1}`,
			(item) => item.value,
			(a, b) => a + b
		);

		const cellRules = this.getCellRules(graphConfig);
		const cellDataMap = new Map<string, ContributionCellData>();
		const htmlParts: string[] = [];

		for (let i = 0; i < contributionData.length; i++) {
			if (i % 7 === 0) {
				if (i > 0) htmlParts.push("</div>");
				htmlParts.push("<div class='column'>");
			}

			const item = contributionData[i];

			if (item.monthDate === 1) {
				const yearMonth = `${item.year}-${item.month + 1}`;
				const monthVal = contributionMapByYearMonth.get(yearMonth) || 0;
				htmlParts.push(
					"<div class='month-indicator' aria-label='" +
					monthVal + " contributions on " + yearMonth + "'>" +
					this.escapeHtml(localizedMonthMapping(item.month)) +
					"</div>"
				);
			}

			if (item.value === 0) {
				if (item.date !== "$HOLE$") {
					const rule = matchCellStyleRule(0, cellRules);
					const bg = rule ? rule.color : "";
					htmlParts.push(
						"<div class='cell empty' data-year='" + item.year +
						"' data-month='" + item.month +
						"' data-date='" + this.escapeAttr(item.date) +
						"' style='background-color:" + bg + "'></div>"
					);
				} else {
					htmlParts.push("<div class='cell'></div>");
				}
			} else {
				const rule = matchCellStyleRule(item.value, cellRules);
				const bg = rule ? rule.color : (cellRules[0]?.color || "");
				const tips = item.summary
					? item.summary
					: (item.value + " contributions on " + item.date + ".");
				htmlParts.push(
					"<div class='cell' data-year='" + item.year +
					"' data-month='" + item.month +
					"' data-date='" + this.escapeAttr(item.date) +
					"' style='background-color:" + bg +
					"' aria-label='" + this.escapeAttr(tips) + "'></div>"
				);
				cellDataMap.set(item.date, item);
			}
		}

		htmlParts.push("</div>");

		const temp = document.createElement("div");
		temp.innerHTML = htmlParts.join("");
		while (temp.firstChild) {
			chartsEl.appendChild(temp.firstChild);
		}

		const startOfWeek = graphConfig.startOfWeek || 0;
		const weekParts: string[] = [];
		for (let i = 0; i < 7; i++) {
			const text = (i === 1 || i === 3 || i === 5)
				? this.escapeHtml(localizedWeekDayMapping((startOfWeek + i) % 7))
				: "";
			weekParts.push("<div class='cell week-indicator'>" + text + "</div>");
		}
		weekTextColumns.innerHTML = weekParts.join("");

		chartsEl.addEventListener("click", (e: MouseEvent) => {
			const target = (e.target as HTMLElement).closest(".cell:not(.empty):not(.week-indicator):not(.month-indicator):not(.date-indicator)");
			if (!target) return;
			const date = (target as HTMLElement).dataset.date;
			if (!date) return;
			const item = cellDataMap.get(date);
			if (!item) return;
			if (graphConfig.onCellClick) {
				graphConfig.onCellClick(item, e);
			}
			if (activityContainer) {
				this.renderActivity(graphConfig, item, activityContainer);
			}
		});
	}

	private escapeHtml(str: string): string {
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	private escapeAttr(str: string): string {
		return str
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}
}
