import type { HeatmapConfig } from "heatmap/types";
import { GitStyleTrackGraphRender } from "./gitStyleTrackGraphRender";

export class Renders {
	static renders = [
		new GitStyleTrackGraphRender(),
	];

	static render(
		container: HTMLElement,
		graphConfig: HeatmapConfig
	): void {
		if (graphConfig.graphType === undefined) {
			graphConfig.graphType = "default";
		}
		const render = this.renders.find(
			(r) => r.graphType() === graphConfig.graphType
		);
		if (render) {
			render.render(container, graphConfig);
		} else {
			this.renderErrorTips(
				container,
				`invalid graphType "${graphConfig.graphType}"`,
				[
					`please set graphType to one of ${Renders.renders
						.map((r) => r.graphType())
						.join(", ")}`
				]
			);
		}
	}

	static renderErrorTips(container: HTMLElement, summary: string, recommends?: string[]): void {
		// ✅ 保留Obsidian原生编辑按钮
		const nativeEditButton = container.querySelector<HTMLElement>(".edit-block-button");
		container.empty();
		if (nativeEditButton) {
			container.appendChild(nativeEditButton);
		}

		const errDiv = createDiv({
			cls: "heatmap-render-error-container",
			parent: container
		});

		createEl("p", {
			text: summary,
			cls: "summary",
			parent: errDiv
		})

		if (recommends) {
			recommends.forEach(r => {
				createEl("pre", {
					text: r,
					cls: "recommend",
					parent: errDiv
				})
			})
		}

	}

	static renderError(container: HTMLElement, {
		summary,
		recommends
	}: {
		summary: string,
		recommends?: string[]
	}): void {
		Renders.renderErrorTips(container, summary, recommends)
	}
}
