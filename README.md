# Elements

> An Obsidian plugin that provides configurable navigation cards and heatmaps for your homepage.

## Plugin Feature Summary

Elements is a powerful Obsidian plugin that offers multiple useful features:

- **Element Card**: Build multi-column navigation card layouts through `elementCard` code blocks, supporting custom color schemes, link layouts, and card styles to help users quickly access frequently used notes and resources. Links support Action triggers for one-click access to homepage, WeRead bookshelf, etc.
- **Heatmap**: Render GitHub-style heatmaps through `heatmap` code blocks, supporting multiple chart types and data sources to help users track note creation rhythm and task completion status.
- **Homepage**: Designate a specific note as your homepage with auto-open on startup, auto-open on empty tabs, multiple open modes (replace all / keep / replace last), and view mode control.
- **Sidebar Calendar**: Display a monthly calendar in the left or right sidebar, allowing you to create/open daily notes by clicking dates and visualize daily note counts with dots.
- **Force View Mode**: Allow users to set default view modes (reading mode or editing mode) for specific folders or files, improving work efficiency.
- **Remember Cursor Position**: Automatically remember and restore users' cursor positions in files, avoiding repeated positioning and enhancing editing experience.

The plugin provides intuitive command palette and right-click menu operations, supports English and Chinese internationalization, and automatically switches interface languages based on the user's language environment.

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

3. Enable **Elements** in Settings → Community Plugins

### Prerequisites

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin (required for Heatmap queries)

---

## ElementCard

Create a dashboard with multi-column card layouts using the `elementCard` code block.

### Quick Start

````markdown
```elementCard
id: homepage-main
title: elementCard
columns: 2
gap: 2
cards:
  - type: links
    title: Card 1
    span: 1
    linksLayout: inline
    palettePreset: sage
    links:
      - label: Link 1
        url:
      - label: Link 2
        url:

  - type: links
    title: Card 2
    span: 1
    linksLayout: inline
    palettePreset: mist
    links:
      - label: Link 1
        url:
      - label: Link 2
        url:
```
````

### Builder

Run `New ElementCard` from the command palette to directly insert a card, or select **Add Elements Component** → **Add Card** from the right-click menu.

To edit an existing block, place your cursor inside a `elementCard` code block and run `Edit Elements (elementCard) block at cursor`. Changes are written back to the source block on save.

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `id` | Unique block identifier (recommended for persisting column widths) | Auto-generated |
| `title` | Dashboard title | — |
| `columns` | Number of columns (1–4) | 2 |
| `gap` | Gap between cards in px | 2 |
| `cards` | List of cards | — |

### Links Card

| Field | Description |
|-------|-------------|
| `title` | Card title |
| `span` | Number of columns to span |
| `linksLayout` | `inline` or `list` |
| `palettePreset` | Color scheme: `sage` `mist` `amber` `plum` `slate` |
| `links` | List of links, each with `label` and `url` (or `action`). Set `external: true` for external links |

Column widths can be dragged to resize in reading mode. Widths are saved to `localStorage` — set a fixed `id` on each block to ensure persistence.

### Action Links

Link items support an optional `action` field that triggers built-in plugin functions (e.g., open homepage, open Memoria panel) instead of navigating to a regular link.

```yaml
links:
  - label: Open Homepage
    action: open-homepage
  - label: Open WeRead Bookshelf
    action: open-weread
  - label: Open Memoria Panel
    action: open-memoria
```

| action value | Function |
|-------------|----------|
| `open-homepage` | Open Elements homepage |
| `open-weread` | Open WeRead bookshelf |
| `open-memoria` | Open Memoria panel |

Action links are visually distinguished with a ⚡ icon prefix in the card.

---

## Heatmap

Render GitHub-style heatmaps based on Dataview queries. Inspired by [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph).

### Quick Start

````markdown
```heatmap
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

You can also create graphs via the command palette (`New Heatmap`) or select **Add Elements Component** → **Add Graph** from the right-click menu, which opens a visual configuration form.

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
  excludeFolders:               # Optional, exclude notes in specific folders
    - templates/
    - Archive/
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
| `New ElementCard` | Create a new element card |
| `New Heatmap` | Create a new heatmap |
| `Open Homepage` | Open homepage |
| `Open Calendar` | Open sidebar calendar |

Right-click in the editor to access **Add Elements Component** from the context menu, which includes **Add Card** and **Add Graph** options. Floating edit buttons are available in reading mode for both `elementCard` and `heatmap` blocks.

---

## Integrated Features

Elements also integrates the following utility features:

### Homepage

Based on [obsidian-homepage](https://github.com/mirnovov/obsidian-homepage), designate a specific note as your homepage with flexible open modes and view mode control.

**Features:**
- Auto-open on startup: Automatically opens the homepage note when Obsidian starts
- Auto-open on empty tabs: Opens homepage when the workspace only has empty tabs
- Auto-create: Automatically creates the homepage file if it doesn't exist
- View mode control: Supports default view, reading mode, editing mode (source), and editing mode (live preview)
- Multiple open modes: Replace all tabs / Keep existing tabs / Replace last tab
- Ribbon shortcut: Left-click for normal open; right-click/Ctrl/Meta for alternate open mode
- Action link integration: Open homepage directly from ElementCard via `action: open-homepage`

### Sidebar Calendar

Based on [obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin), display a monthly calendar in the left or right sidebar.

**Features:**
- Display in left or right sidebar
- Click dates to create or open daily notes (with optional confirmation)
- Visualize daily note counts with dots (customizable threshold)
- Today's date highlighted
- Calendar width scales with sidebar
- Customizable week start day

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
├── types.ts                   # Heatmap core types
├── i18/                       # i18n (zh / en)
├── processor/                 # Heatmap data processing & validation
├── query/                     # Dataview query layer
├── render/                    # Chart rendering (git-style, month-track, calendar)
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

- [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph)
- [obsidian-homepage](https://github.com/mirnovov/obsidian-homepage)
- [obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)
- [obsidian-force-view-mode-of-note](https://github.com/bwydoogh/obsidian-force-view-mode-of-note)
- [obsidian-remember-cursor-position](https://github.com/dy-sh/obsidian-remember-cursor-position)
