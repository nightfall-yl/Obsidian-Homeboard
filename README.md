# Homeboard

> 一款 Obsidian 插件，将首页变为可配置的导航仪表盘，并支持贡献热力图追踪。

**[English](README_EN.md)**

[![Min App Version](https://img.shields.io/badge/Obsidian-1.3.0%2B-7C3AED?logo=obsidian)](https://obsidian.md/)
[![Version](https://img.shields.io/badge/Version-2026.4-22C55E)](https://github.com/nightfall-yl/Obsidian-Homeboard/releases)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

Homeboard 提供两大核心功能，可独立使用，也可在同一页面组合：

- **首页仪表盘** — 通过 `homeboard` 代码块构建多列导航卡片布局
- **贡献图** — 通过 `contributionGraph` 代码块渲染 GitHub 风格热力图，追踪笔记创作节奏

## 安装

### 手动安装

1. 下载最新 [release](https://github.com/nightfall-yl/Obsidian-Homeboard/releases)
2. 将以下文件放入 Obsidian 插件目录：

```
.obsidian/plugins/obsidian-homeboard/
├── main.js
├── manifest.json
└── styles.css
```

3. 在 Obsidian 设置 → 社区插件中启用 **Homeboard**

### 从源码构建

```bash
git clone https://github.com/nightfall-yl/Obsidian-Homeboard.git
cd Obsidian-Homeboard
npm install
npm run build
```

### 前置依赖

- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 插件（贡献图数据查询需要）

---

## 首页仪表盘（Homeboard）

通过 `homeboard` 代码块构建多列导航仪表盘。

### 快速创建

````markdown
```homeboard
id: homepage-main
title: 我的首页
columns: 2
gap: 16
cards:
  - type: links
    title: 常用入口
    span: 1
    linksLayout: inline
    links:
      - label: 收件箱
        url: 00.收件箱
      - label: 日记
        url: 00.Daily Index
      - label: 项目
        url: 00.项目 Index

  - type: links
    title: 资源
    span: 1
    linksLayout: list
    links:
      - label: GitHub
        url: https://github.com
        external: true
```
````

### Builder

通过命令面板运行 `Open Homeboard builder` 打开可视化搭建界面。

要编辑已有代码块，将光标移入 `homeboard` 代码块，运行 `Edit Homeboard block at cursor`，保存后变更会自动回写到源代码块。

也可以在编辑区右键，从右键菜单中选择 **新增 Homeboard 组件**。

### 配置参考

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `id` | 代码块唯一标识（推荐设置，用于记忆列宽） | 自动生成 |
| `title` | 仪表盘标题 | — |
| `columns` | 列数（1–4） | 2 |
| `gap` | 卡片间距（px） | 16 |
| `cards` | 卡片列表 | — |

### Links 卡片

| 字段 | 说明 |
|------|------|
| `title` | 卡片标题 |
| `span` | 跨列数 |
| `linksLayout` | `inline`（内联）或 `list`（列表） |
| `palettePreset` | 配色方案：`sage`（苔绿）`mist`（雾蓝）`amber`（琥珀）`plum`（梅紫）`slate`（石墨） |
| `links` | 链接列表，每项含 `label` 和 `url`，可选 `external` 标记外部链接 |

阅读模式下可以拖动列分隔条调整列宽，宽度保存在 `localStorage`。建议给每个代码块设置固定 `id` 以确保持久化。

---

## 贡献图（Contribution Graph）

基于 Dataview 查询数据，渲染 GitHub 风格的贡献热力图。灵感来源于 [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph)。

### 快速创建

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

也可以通过命令面板运行 `新建热力图` 或右键菜单创建，会打开可视化配置表单。

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
| `Insert Homeboard block` | 插入新的 `homeboard` 代码块 |
| `Open Homeboard builder` | 打开可视化 Builder |
| `Edit Homeboard block at cursor` | 编辑光标处的 `homeboard` 代码块 |
| `新建热力图` | 创建新的贡献图 |

编辑区右键可从上下文菜单访问 **新增 Homeboard 组件**。阅读模式下 `homeboard` 和 `contributionGraph` 代码块旁均有浮动编辑按钮。

---

## 开发

基于 TypeScript、React 和 esbuild 构建。

```
src/
├── main.ts                    # 插件入口
├── builderModal.ts            # Homeboard Builder 模态框
├── homepageProcessor.ts       # homeboard 代码块解析与渲染
├── homepageConfig.ts          # homeboard 配置
├── homepageTypes.ts           # homeboard 类型定义
├── homepageYaml.ts            # homeboard YAML 序列化
├── types.ts                   # 贡献图核心类型
├── i18/                       # 国际化（中/英）
├── processor/                 # 贡献图数据处理与验证
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

## 许可证

[MIT](LICENSE)

## 致谢

基于 [Obsidian](https://obsidian.md/) 插件 API 和 [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 构建。

贡献图功能灵感来源于 [obsidian-contribution-graph](https://github.com/vran-dev/obsidian-contribution-graph) by [vran-dev](https://github.com/vran-dev)，在其基础上进行了深度整合与功能增强，特此致谢。
