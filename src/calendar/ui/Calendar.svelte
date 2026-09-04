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
  // 滞回带：避免宽度在阈值附近来回穿越触发 stretch 模式反复切换造成闪烁
  const STRETCH_ENTER = REFERENCE_WIDTH + 8; // 288：进入拉伸模式
  const STRETCH_EXIT = REFERENCE_WIDTH - 8; // 272：退出拉伸模式
  const WIDTH_EPS = 1; // 宽度变化小于 1px 视为亚像素抖动，忽略

  let outerEl;
  let innerEl;
  let zoomLevel = 1;
  let useStretch = false;
  let innerHeight = 0;
  let lastWidth = 0;
  let resizeObserver;
  let interval;

  function updateLayout(width) {
    if (width <= 0 || Math.abs(width - lastWidth) < WIDTH_EPS) return;
    lastWidth = width;
    if (useStretch) {
      // 已在拉伸模式：只有明显低于退出阈值才缩回，避免在边界反复跳变
      if (width < STRETCH_EXIT) {
        useStretch = false;
        zoomLevel = Math.max(MIN_ZOOM, width / REFERENCE_WIDTH);
      }
    } else {
      // 未拉伸：明显高于进入阈值才拉宽（zoom 封顶 1，避免反向放大）
      if (width >= STRETCH_ENTER) {
        useStretch = true;
        zoomLevel = 1;
      } else {
        useStretch = false;
        zoomLevel = Math.min(1, Math.max(MIN_ZOOM, width / REFERENCE_WIDTH));
      }
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
          updateLayout(entry.contentRect.width);
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
    onHoverDay(date.format("YYYY-MM-DD"), isMetaPressed, targetEl);
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
  class="astra-calendar-outer"
  class:highlight-today={highlightToday}
  bind:this={outerEl}
  style="overflow: visible; height: {innerHeight ? innerHeight * zoomLevel : 300}px;"
>
  <div
    class="astra-calendar-inner"
    class:stretch={useStretch}
    bind:this={innerEl}
    bind:clientHeight={innerHeight}
    style="
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
  .astra-calendar-outer {
    width: 100%;
    min-height: auto;
    transition: height 0.15s ease-out;
  }

  .astra-calendar-inner {
    transform-origin: top left;
  }

  :global(.astra-calendar-outer .calendar .day) {
    text-shadow: none !important;
    -webkit-text-stroke: 0 !important;
    paint-order: normal !important;
  }

  :global(.astra-calendar-outer:not(.highlight-today) .calendar .day.today) {
    color: var(--text-normal) !important;
    font-weight: normal !important;
    background-color: transparent !important;
  }

  :global(.astra-calendar-outer.highlight-today .calendar .day.today) {
    color: var(--text-normal) !important;
    font-weight: normal !important;
    background-color: rgba(59, 130, 246, 0.15) !important;
    border-radius: 6px;
  }
</style>
