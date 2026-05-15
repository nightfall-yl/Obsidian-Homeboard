# Elements

> 一款 Obsidian 插件，为首页配置分栏导航卡片，并支持热力图追踪。

## 插件功能总结

Elements 是一款功能强大的 Obsidian 插件，为用户提供了多种实用功能：

- **元素卡片**：通过 `elementCard` 代码块构建多列导航卡片布局，支持自定义配色方案、链接布局和卡片样式，帮助用户快速访问常用笔记和资源。链接支持 Action 触发器，可一键打开主页、微信读书书架等。
- **热力图（Heatmap）**：通过 `heatmap` 代码块渲染 GitHub 风格热力图，支持多种图表类型和数据源，帮助用户追踪笔记创作节奏和任务完成情况。
- **主页**：将指定笔记设为主页，支持启动自动打开、空标签页自动打开、多种打开模式（替换全部/保留/替换最后一个）及视图模式控制。
- **侧边栏日历**：在左侧或右侧边栏显示月历视图，支持点击日期创建/打开日记，通过圆点直观展示每日笔记字数。
- **强制视图模式**：允许用户为特定文件夹或文件设置默认视图模式（阅读模式或编辑模式），提高工作效率。
- **光标位置记忆**：自动记忆并恢复用户在文件中的光标位置，避免重复定位，提升编辑体验。

插件提供了直观的命令面板和右键菜单操作，支持中英文国际化，可根据用户的语言环境自动切换界面语言。

## 安装

### 手动安装

1. 下载最新 [release](https://github.com/nightfall_yl/obsidian-elements/releases)
2. 将以下文件放入 Obsidian 插件目录：

```
.obsidian/plugins/obsidian-elements/
├── main.js
├── manifest.json
└── styles.css
```

3. 在 Obsidian 设置 → 社区插件中启用 **Elements**

### 前置依赖

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 插件（热力图数据查询需要）

---

## 元素卡片（ElementCard）

通过 `elementCard` 代码块构建多列导航链接。

### 快速创建

````markdown
```elementCard
id: homepage-main
title: elementCard
columns: 2
gap: 2
cards:
  - type: links
    title: 卡片 1
    span: 1
    linksLayout: inline
    palettePreset: sage
    links:
      - label: 链接 1
        url:
      - label: 链接 2
        url:

  - type: links
    title: 卡片 2
    span: 1
    linksLayout: inline
    palettePreset: mist
    links:
      - label: 链接 1
        url:
      - label: 链接 2
        url:
```
````

### Builder

通过命令面板运行 `New ElementCard` 直接插入卡片，或通过右键菜单选择 **新增 Elements 组件** → **新建卡片**。

要编辑已有代码块，将光标移入 `elementCard` 代码块，运行 `Edit Elements (elementCard) block at cursor`，保存后变更会自动回写到源代码块。

### 配置参考

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `id` | 代码块唯一标识（推荐设置，用于记忆列宽） | 自动生成 |
| `title` | 仪表盘标题 | — |
| `columns` | 列数（1–4） | 2 |
| `gap` | 卡片间距（px） | 2 |
| `cards` | 卡片列表 | — |

### Links 卡片

| 字段 | 说明 |
|------|------|
| `title` | 卡片标题 |
| `span` | 跨列数 |
| `linksLayout` | `inline`（内联）或 `list`（列表） |
| `palettePreset` | 配色方案：`sage`（苔绿）`mist`（雾蓝）`amber`（琥珀）`plum`（梅紫）`slate`（石墨） |
| `links` | 链接列表，每项含 `label` 和 `url`（或 `action`），可选 `external` 标记外部链接 |

阅读模式下可以拖动列分隔条调整列宽，宽度保存在 `localStorage`。建议给每个代码块设置固定 `id` 以确保持久化。

### Action 链接

链接项支持 `action` 字段，点击后触发插件内置功能（如打开主页、打开 Memoria 面板等），而非跳转到普通链接。

```yaml
links:
  - label: 打开主页
    action: open-homepage
  - label: 打开微信读书书架
    action: open-weread
  - label: 打开 Memoria 面板
    action: open-memoria
```

| action 值 | 功能 |
|-----------|------|
| `open-homepage` | 打开 Elements 主页 |
| `open-weread` | 打开微信读书书架 |
| `open-memoria` | 打开 Memoria 面板 |

Action 链接在卡片中以 ⚡ 图标标识，与普通链接视觉区分。

---

## 热力图（Heatmap）

基于 Dataview 查询数据，渲染 GitHub 风格的热力图。移植自 [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph)。

### 快速创建

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

也可以通过命令面板运行 `New Heatmap` 或右键菜单选择 **新增 Elements 组件** → **新建热力图**，会打开可视化配置表单。

### 图表类型

| 类型 | `graphType` | 说明 |
|------|-------------|------|
| Git 风格 | `default` | 经典 GitHub 风格，每列一周 |
| 月度追踪 | `month-track` | 每行一个月 |
| 日历视图 | `calendar` | 传统日历布局 |

### 配置参考

#### 基础设置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `title` | 图表标题 | `"Contributions"` |
| `graphType` | 图表类型 | `"default"` |
| `dateRangeType` | 日期范围模式 | `"LATEST_DAYS"` |
| `dateRangeValue` | 日期范围数值 | `180` |
| `startOfWeek` | 每周起始日（0=周日, 1=周一） | 中文环境为 1 |

**日期范围模式 `dateRangeType`：**

| 值 | 说明 | 需要的参数 |
|----|------|-----------|
| `LATEST_DAYS` | 最近 N 天 | `dateRangeValue` |
| `LATEST_MONTH` | 最近 N 个整月 | `dateRangeValue` |
| `LATEST_YEAR` | 最近 N 个整年 | `dateRangeValue` |
| `FIXED_DATE_RANGE` | 固定日期范围 | `fromDate` + `toDate`（yyyy-MM-dd） |

#### 数据源配置

```yaml
dataSource:
  type: PAGE                    # PAGE | ALL_TASK | TASK_IN_SPECIFIC_PAGE
  value: '#tag'                 # Dataview 查询表达式
  excludeFolders:               # 可选，排除指定文件夹中的笔记
    - templates/
    - Archive/
  dateField:
    type: FILE_CTIME            # 日期字段类型
    value: propertyName         # 属性名（PAGE_PROPERTY/TASK_PROPERTY 时需要）
    format: yyyy-MM-dd          # 日期格式（可选）
  countField:
    type: DEFAULT               # DEFAULT | PAGE_PROPERTY | TASK_PROPERTY
    value: propertyName         # 计数字段名
  filters:                      # 可选
    - type: STATUS_IS
      value: COMPLETED
```

**数据源类型：**

| 类型 | 说明 |
|------|------|
| `PAGE` | 基于文档查询（按创建/修改时间、文件名或文档属性） |
| `ALL_TASK` | 查询库中所有任务 |
| `TASK_IN_SPECIFIC_PAGE` | 查询指定文档中的任务 |

**日期字段类型 `dateField.type`：**

| 类型 | 说明 |
|------|------|
| `FILE_CTIME` | 文件创建时间 |
| `FILE_MTIME` | 文件修改时间 |
| `FILE_NAME` | 文件名（需包含日期格式） |
| `PAGE_PROPERTY` | 文档属性中的日期字段 |
| `TASK_PROPERTY` | 任务属性中的日期字段 |

**筛选器（仅任务数据源可用）：**

| 类型 | 说明 |
|------|------|
| `STATUS_IS` | 任务状态等于指定值 |
| `STATUS_IN` | 任务状态包含任意一个 |
| `CONTAINS_ANY_TAG` | 包含任意标签 |

**任务状态选项：** `COMPLETED` / `FULLY_COMPLETED` / `INCOMPLETE` / `CANCELED` / `ANY`

#### 样式设置

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `fillTheScreen` | 充满屏幕宽度 | `false` |
| `enableMainContainerShadow` | 启用容器阴影 | `false` |
| `showCellRuleIndicators` | 显示色阶指示器 | `true` |

**内置主题（通过可视化表单选择）：**

| 主题 | 说明 |
|------|------|
| `default` | 经典 GitHub 绿 |
| `ocean` | 海洋蓝 |
| `halloween` | 琥珀暖橙 |
| `lovely` | 樱粉柔雾 |
| `wine` | 梅酒红 |

单元格形状支持圆角（默认）、方块（`borderRadius: "0%"`）、圆形（`borderRadius: "50%"`），尺寸可通过 `cellStyle.minWidth` / `cellStyle.minHeight` 调整。

---

## 命令

| 命令 | 说明 |
|------|------|
| `New ElementCard` | 创建新的元素卡片 |
| `New Heatmap` | 创建新的热力图 |
| `Open Homepage` | 打开主页 |
| `Open Calendar` | 打开侧边栏日历 |

编辑区右键可从上下文菜单访问 **新增 Elements 组件**，包含 **新建卡片** 和 **新建热力图** 选项。阅读模式下 `elementCard` 和 `heatmap` 代码块旁均有浮动编辑按钮。

---

## 集成功能

Elements 集成以下实用功能：

### 主页（Homepage）

移植自 [obsidian-homepage](https://github.com/mirnovov/obsidian-homepage)，将指定笔记设为主页，提供多种打开方式和视图模式控制。

**功能特点：**
- 启动自动打开：Obsidian 启动时自动打开主页笔记
- 空标签页自动打开：工作区只剩空标签页时自动打开主页
- 自动创建：主页文件不存在时自动创建
- 视图模式控制：支持默认视图、阅读模式、编辑模式（源码）、编辑模式（实时预览）
- 多种打开模式：替换全部标签 / 保留现有标签 / 替换最后一个标签
- Ribbon 栏快捷入口：左键正常打开，右键/Ctrl/Meta 键使用备用打开方式
- Action 链接集成：ElementCard 中可通过 `action: open-homepage` 一键打开主页

### 侧边栏日历

移植自 [obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)，在侧边栏显示月历视图，与日记插件无缝集成。

**功能特点：**
- 支持显示在左侧或右侧边栏
- 点击日期创建或打开日记（可开启创建前确认）
- 通过圆点直观展示每日笔记字数（可自定义每个圆点代表的字数）
- 今日日期高亮显示
- 日历宽度随侧边栏自动缩放
- 支持自定义星期起始日

**日历设置：**

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用日历 | 在侧边栏显示日历视图 | 开启 |
| 日历位置 | 左侧边栏 / 右侧边栏 | 左侧边栏 |
| 创建前确认 | 创建日记前是否弹出确认对话框 | 开启 |
| 每个圆点代表字数 | 日历中每个圆点对应的字数 | 250 |
| 星期起始日 | 选择一周的起始日 | 跟随系统 |
| 今日高亮 | 用背景颜色高亮今天的日期 | 开启 |

### 强制视图模式

移植自 [obsidian-force-view-mode-of-note](https://github.com/bwydoogh/obsidian-force-view-mode-of-note)，允许你为特定文件夹或文件设置默认视图模式（阅读模式或编辑模式）。

**功能特点：**
- 支持按文件夹设置视图模式
- 支持按文件模式设置视图模式
- 可忽略已打开的文件，避免切换干扰
- 可忽略强制视图全部设置，临时使用其他视图模式

### 光标位置记忆

移植自 [obsidian-remember-cursor-position](https://github.com/dy-sh/obsidian-remember-cursor-position)，自动记忆并恢复你在文件中的光标位置。

**功能特点：**
- 自动保存光标位置
- 重新打开文件时恢复光标位置
- 支持延迟恢复，避免影响文件打开速度

这些功能可以在插件设置中进行配置。

---

## 开发

基于 TypeScript、React 和 esbuild 构建。

```
src/
├── main.ts                    # 插件入口
├── elementCardBuilderModal.ts # Elements ElementCard Builder 模态框
├── elementCardProcessor.ts    # elementCard 代码块解析与渲染
├── elementCardConfig.ts       # elementCard 配置
├── elementCardTypes.ts        # elementCard 类型定义
├── elementCardYaml.ts         # elementCard YAML 序列化
├── types.ts                   # 热力图核心类型
├── i18/                       # 国际化（中/英）
├── processor/                 # 热力图数据处理与验证
├── query/                     # Dataview 查询层
├── render/                    # 图表渲染（Git 风格、月度追踪、日历）
├── view/                      # React UI 组件
└── util/                      # 工具函数
```


```bash
npm install
npm run build
```

---
## 致谢

基于 [Obsidian](https://obsidian.md/) 插件 API 和 [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 构建。

-  [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph)
-  [obsidian-homepage](https://github.com/mirnovov/obsidian-homepage)
-  [obsidian-calendar-plugin](https://github.com/liamcain/obsidian-calendar-plugin)
-  [obsidian-force-view-mode-of-note](https://github.com/bwydoogh/obsidian-force-view-mode-of-note)
-  [obsidian-remember-cursor-position](https://github.com/dy-sh/obsidian-remember-cursor-position)


---

## 许可证

[MIT](LICENSE)
