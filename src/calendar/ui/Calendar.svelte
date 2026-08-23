<script>
  import { onMount, onDestroy } from "svelte";
  import { Calendar } from "obsidian-calendar-ui";

  import { calendarSettings, activeFile } from "./stores";
  import {
    wordCountSource,
    streakSource,
    tasksSource,
    customTagsSource,
  } from "./sources";

  export let onDateClick;
  export let onHoverDay;
  export let onContextMenuDay;

  const sources = [
    wordCountSource,
    streakSource,
    tasksSource,
    customTagsSource,
  ];

  let today = window.moment().startOf("day");
  let displayedMonth = today.clone();

  $: selectedId = $activeFile || "";
  $: settings = $calendarSettings;
  $: highlightToday = settings.highlightToday !== false;

  const REFERENCE_WIDTH = 280;
  const MIN_ZOOM = 0.6;

  let outerEl;
  let zoomLevel = 1;
  let useStretch = false;
  let resizeObserver;
  let interval;

  function updateLayout(width) {
    if (width >= REFERENCE_WIDTH) {
      // 超过阈值：只拉宽，不缩放（高度保持不变）
      useStretch = true;
      zoomLevel = 1;
    } else {
      // 低于阈值：等比缩小，避免挤压
      useStretch = false;
      zoomLevel = Math.max(MIN_ZOOM, width / REFERENCE_WIDTH);
    }
  }

  onMount(() => {
    interval = setInterval(() => {
      today = window.moment().startOf("day");
    }, 60 * 1000);

    if (outerEl) {
      updateLayout(outerEl.clientWidth);
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            updateLayout(width);
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

  function handleClickDay(date, isMetaPressed) {
    onDateClick(date.format("YYYY-MM-DD"), isMetaPressed);
    return true;
  }

  function handleHoverDay(date, targetEl, isMetaPressed) {
    onHoverDay(date.format("YYYY-MM-DD"), isMetaPressed);
    return true;
  }

  function handleContextMenuDay(date, event) {
    onContextMenuDay(date.format("YYYY-MM-DD"), event);
    return true;
  }

  function handleContextMenuWeek(date, event) {
    return true;
  }
</script>

<div
  class="attend-calendar-outer"
  class:highlight-today={highlightToday}
  bind:this={outerEl}
  style="overflow: visible;"
>
  <div class="attend-calendar-inner" class:stretch={useStretch} style="
    width: {useStretch ? '100%' : REFERENCE_WIDTH + 'px'};
    transform: scale({zoomLevel});
    transform-origin: top left;
  ">
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
  .attend-calendar-outer {
    width: 100%;
    min-height: 300px;
  }

  .attend-calendar-inner {
    transform-origin: top left;
  }

  :global(.attend-calendar-outer .calendar .day) {
    text-shadow: none !important;
    -webkit-text-stroke: 0 !important;
    paint-order: normal !important;
  }

  :global(.attend-calendar-outer:not(.highlight-today) .calendar .day.today) {
    color: var(--text-normal) !important;
    font-weight: normal !important;
    background-color: transparent !important;
  }

  :global(.attend-calendar-outer.highlight-today .calendar .day.today) {
    color: var(--text-normal) !important;
    font-weight: normal !important;
    background-color: rgba(59, 130, 246, 0.15) !important;
    border-radius: 6px;
  }
</style>
