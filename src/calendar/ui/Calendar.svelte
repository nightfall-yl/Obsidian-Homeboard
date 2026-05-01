<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Calendar } from "obsidian-calendar-ui";
	import type { ICalendarSource, Moment } from "obsidian-calendar-ui";

	import { calendarSettings, activeFile } from "./stores";
	import {
		wordCountSource,
		streakSource,
		tasksSource,
		customTagsSource,
	} from "./sources";

	export let onDateClick: (date: string, isMetaPressed: boolean) => void;
	export let onHoverDay: (date: string, isMetaPressed: boolean) => void;
	export let onContextMenuDay: (date: string, event: MouseEvent) => void;

	const sources: ICalendarSource[] = [
		wordCountSource,
		streakSource,
		tasksSource,
		customTagsSource,
	];

	let today: Moment = window.moment().startOf("day");
	let displayedMonth: Moment = today.clone();

	$: selectedId = $activeFile || "";
	$: settings = $calendarSettings;
	$: highlightToday = settings.highlightToday !== false;

	const REFERENCE_WIDTH = 280;
	const MIN_ZOOM = 0.6;
	const MAX_ZOOM = 1.8;

	let outerEl: HTMLElement;
	let zoomLevel: number = 1;
	let resizeObserver: ResizeObserver;
	let interval: ReturnType<typeof setInterval>;

	function updateZoom(width: number) {
		zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, width / REFERENCE_WIDTH));
	}

	onMount(() => {
		interval = setInterval(() => {
			today = window.moment().startOf("day");
		}, 60 * 1000);

		if (outerEl) {
			updateZoom(outerEl.clientWidth);
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const width = entry.contentRect.width;
					if (width > 0) {
						updateZoom(width);
					}
				}
			});
			resizeObserver.observe(outerEl);
		}
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
		if (resizeObserver) resizeObserver.disconnect();
	});

	function handleClickDay(date: Moment, isMetaPressed: boolean): boolean {
		onDateClick(date.format("YYYY-MM-DD"), isMetaPressed);
		return true;
	}

	function handleHoverDay(date: Moment, targetEl: EventTarget, isMetaPressed: boolean): boolean {
		onHoverDay(date.format("YYYY-MM-DD"), isMetaPressed);
		return true;
	}

	function handleContextMenuDay(date: Moment, event: MouseEvent): boolean {
		onContextMenuDay(date.format("YYYY-MM-DD"), event);
		return true;
	}

	function handleContextMenuWeek(date: Moment, event: MouseEvent): boolean {
		return true;
	}
</script>

<div
	class="elements-calendar-outer"
	class:highlight-today={highlightToday}
	bind:this={outerEl}
>
	<div class="elements-calendar-inner" style="width: {REFERENCE_WIDTH}px; zoom: {zoomLevel}">
		<Calendar
			{sources}
			{today}
			{displayedMonth}
			{selectedId}
			onClickDay={handleClickDay}
			onHoverDay={handleHoverDay}
			onContextMenuDay={handleContextMenuDay}
			onContextMenuWeek={handleContextMenuWeek}
		/>
	</div>
</div>

<style>
	.elements-calendar-outer {
		width: 100%;
		overflow: hidden;
	}

	.elements-calendar-inner {
		transform-origin: top left;
	}

	:global(.elements-calendar-outer:not(.highlight-today) .calendar .day.today) {
		color: var(--text-normal) !important;
		font-weight: normal !important;
		background-color: transparent !important;
	}

	:global(.elements-calendar-outer.highlight-today .calendar .day.today) {
		color: var(--text-normal) !important;
		font-weight: normal !important;
		background-color: rgba(59, 130, 246, 0.15) !important;
		border-radius: 6px;
	}
</style>
