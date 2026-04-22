# Elements

> An Obsidian plugin that turns your homepage into a configurable navigation dashboard with contribution heatmaps.

[![Min App Version](https://img.shields.io/badge/Obsidian-1.3.0%2B-7C3AED?logo=obsidian)](https://obsidian.md/)
[![Version](https://img.shields.io/badge/Version-26.4.2-22C55E)](https://github.com/nightfall-yl/obsidian-elements/releases)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

Elements provides two core features that can be used independently or combined on the same page:

- **ElementCard** — Build a multi-column navigation card layout via `elementCard` code blocks
- **Contribution Graph** — Render GitHub-style heatmaps via `contributionGraph` code blocks to track note creation rhythm

## Installation

### Manual

1. Download the latest [release](https://github.com/nightfall-yl/Trimmings/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` into your vault's plugin folder:

```
.obsidian/plugins/obsidian-elements/
├── main.js
├── manifest.json
└── styles.css
```

3. Enable **Trimmings** in Settings → Community Plugins

### From Source

```bash
git clone https://github.com/nightfall-yl/obsidian-elements.git
cd obsidian-elements
npm install
npm run build
```

### Prerequisites

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin (required for Contribution Graph queries)

---

## ElementCard

Create a dashboard with multi-column card layouts using the `elementCard` code block.

### Quick Start

````markdown
```elementCard
id: homepage-main
title: My Dashboard
columns: 2
gap: 16
cards:
  - type: links
    title: Quick Access
    span: 1
    linksLayout: inline
    links:
      - label: Inbox
        url: 00.Inbox
      - label: Daily Note
        url: 00.Daily Index
      - label: Projects
        url: 00.Projects

  - type: links
    title: Resources
    span: 1
    linksLayout: list
    links:
      - label: GitHub
        url: https://github.com
        external: true
```
````

### Builder

Open the visual builder via the command palette: `Open Trimmings Builder`.

To edit an existing block, place your cursor inside a `elementCard` code block and run `Edit Trimmings (elementCard) block at cursor`. Changes are written back to the source block on save.

You can also right-click in the editor and select **Add Trimmings Component** from the context menu.

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `id` | Unique block identifier (recommended for persisting column widths) | Auto-generated |
| `title` | Dashboard title | — |
| `columns` | Number of columns (1–4) | 2 |
| `gap` | Gap between cards in px | 16 |
| `cards` | List of cards | — |

### Links Card

| Field | Description |
|-------|-------------|
| `title` | Card title |
| `span` | Number of columns to span |
| `linksLayout` | `inline` or `list` |
| `palettePreset` | Color scheme: `sage` `mist` `amber` `plum` `slate` |
| `links` | List of links, each with `label` and `url`. Set `external: true` for external links |

Column widths can be dragged to resize in reading mode. Widths are saved to `localStorage` — set a fixed `id` on each block to ensure persistence.

---

## Contribution Graph

Render GitHub-style contribution heatmaps based on Dataview queries. Inspired by [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph).

### Quick Start

````markdown
```contributionGraph
title: Contributions
graphType: default
dateRangeType: LATEST_DAYS
dateRangeValue: 365
dataSource:
  type: PAGE
  value: '""'
  dateField:
    type: FILE_CTIME
  countField:
    type: DEFAULT
```
````

You can also create graphs via the command palette (`New Heatmap`) or the right-click context menu, which opens a visual configuration form.

### Graph Types

| Type | `graphType` | Description |
|------|-------------|-------------|
| Git Style | `default` | Classic GitHub layout, one column per week |
| Month Track | `month-track` | One row per month |
| Calendar | `calendar` | Traditional calendar layout |

### Configuration

#### Basic

| Parameter | Description | Default |
|-----------|-------------|---------|
| `title` | Graph title | `"Contributions"` |
| `graphType` | Graph type | `"default"` |
| `dateRangeType` | Date range mode | `"LATEST_DAYS"` |
| `dateRangeValue` | Numeric value for date range | `180` |
| `startOfWeek` | Week start day (0=Sun, 1=Mon) | 1 for Chinese locale |

**Date range modes:**

| Value | Description | Required Params |
|-------|-------------|-----------------|
| `LATEST_DAYS` | Last N days | `dateRangeValue` |
| `LATEST_MONTH` | Last N complete months | `dateRangeValue` |
| `LATEST_YEAR` | Last N complete years | `dateRangeValue` |
| `FIXED_DATE_RANGE` | Fixed date range | `fromDate` + `toDate` (yyyy-MM-dd) |

#### Data Source

```yaml
dataSource:
  type: PAGE                    # PAGE | ALL_TASK | TASK_IN_SPECIFIC_PAGE
  value: '#tag'                 # Dataview query expression
  dateField:
    type: FILE_CTIME            # Date field type
    value: propertyName         # Property name (for PAGE_PROPERTY/TASK_PROPERTY)
    format: yyyy-MM-dd          # Date format (optional)
  countField:
    type: DEFAULT               # DEFAULT | PAGE_PROPERTY | TASK_PROPERTY
    value: propertyName         # Count field name
  filters:                      # Optional
    - type: STATUS_IS
      value: COMPLETED
```

**Data source types:**

| Type | Description |
|------|-------------|
| `PAGE` | Query pages (by creation/modification time, filename, or page property) |
| `ALL_TASK` | Query all tasks in vault |
| `TASK_IN_SPECIFIC_PAGE` | Query tasks in specific pages |

**Date field types:**

| Type | Description |
|------|-------------|
| `FILE_CTIME` | File creation time |
| `FILE_MTIME` | File modification time |
| `FILE_NAME` | Filename (must contain date pattern) |
| `PAGE_PROPERTY` | Date property on the page |
| `TASK_PROPERTY` | Date property on the task |

**Filters (task sources only):**

| Type | Description |
|------|-------------|
| `STATUS_IS` | Task status equals value |
| `STATUS_IN` | Task status matches any of the values |
| `CONTAINS_ANY_TAG` | Contains any of the specified tags |

**Task status options:** `COMPLETED` / `FULLY_COMPLETED` / `INCOMPLETE` / `CANCELED` / `ANY`

#### Style

| Parameter | Description | Default |
|-----------|-------------|---------|
| `fillTheScreen` | Expand to fill screen width | `false` |
| `enableMainContainerShadow` | Enable container shadow | `false` |
| `showCellRuleIndicators` | Show color scale legend | `true` |

**Built-in themes (selectable in visual form):**

| Theme | Description |
|-------|-------------|
| `default` | Classic GitHub green |
| `ocean` | Ocean blue |
| `halloween` | Warm amber |
| `lovely` | Cherry blossom pink |
| `wine` | Wine red |

Cell shape supports rounded (default), square (`borderRadius: "0%"`), and circle (`borderRadius: "50%"`). Cell size can be adjusted via `cellStyle.minWidth` / `cellStyle.minHeight`.

---

## Commands

| Command | Description |
|---------|-------------|
| `Insert Elements (elementCard) block` | Insert a new `elementCard` code block |
| `Open Elements Builder` | Open the visual builder |
| `Edit Elements (elementCard) block at cursor` | Edit the `elementCard` block under cursor |
| `New Heatmap` | Create a new contribution graph |

Right-click in the editor to access **Add Elements Component** from the context menu. Floating edit buttons are available in reading mode for both `elementCard` and `contributionGraph` blocks.

---

## Integrated Features

Elements also integrates the following utility features:

### Force View Mode

Based on [obsidian-force-view-mode-of-note](https://github.com/bwydoogh/obsidian-force-view-mode-of-note), this feature allows you to set default view modes (reading or editing) for specific folders or files.

**Features:**
- Support setting view mode by folder
- Support setting view mode by file pattern
- Can ignore already opened files to avoid switching interference
- Can ignore all force view settings temporarily

### Remember Cursor Position

Based on [obsidian-remember-cursor-position](https://github.com/dy-sh/obsidian-remember-cursor-position), this feature automatically remembers and restores your cursor position in files.

**Features:**
- Automatically saves cursor position
- Restores cursor position when reopening files
- Supports delayed restoration to avoid affecting file opening speed

These features can be configured in the plugin settings.

---

## Development

Built with TypeScript, React, and esbuild.

```
src/
├── main.ts                    # Plugin entry point
├── elementCardBuilderModal.ts # Elements ElementCard Builder modal
├── elementCardProcessor.ts    # elementCard block parsing & rendering
├── elementCardConfig.ts       # elementCard configuration
├── elementCardTypes.ts        # elementCard type definitions
├── elementCardYaml.ts         # elementCard YAML serialization
├── types.ts                   # Contribution graph core types
├── i18/                       # i18n (zh / en)
├── processor/                 # Graph data processing & validation
├── query/                     # Dataview query layer
├── render/                    # Graph rendering (git-style, month-track, calendar)
├── view/                      # React UI components
└── util/                      # Utilities
```

```bash
npm install
npm run build
```

---

## License

[MIT](LICENSE)

## Acknowledgements

Built on the [Obsidian](https://obsidian.md/) plugin API and [Dataview](https://github.com/blacksmithgu/obsidian-dataview).

The Contribution Graph feature is inspired by [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph) by [vran-dev](https://github.com/vran-dev), with deep integration and enhancements.
