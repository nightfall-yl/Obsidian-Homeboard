import type { App} from "obsidian";
import { Notice, TFolder } from "obsidian";
import { yamlScalar } from "./frontmatterWriter";
import { todayStr } from "./taskLogic";
import type { RepeatRule } from "./taskParser";
import type { TaskFormData } from "../task-modal";

/**
 * 任务文件创建逻辑（从 dashboard-view 提取，供首页「新建任务」与
 * 项目板「任务名 + 号加子任务」共用，避免两份 frontmatter 构造逻辑分叉）。
 */

function buildRepeatRule(data: {
  freq: string;
  interval: number;
  workdaysOnly: boolean;
  weekdays: number[];
  monthDay: number;
  startDate: string | null;
}): RepeatRule | null {
  if (!data.freq) return null;
  const rule: RepeatRule = {};
  const d = data.startDate ? new Date(data.startDate + "T00:00:00") : new Date();

  if (data.freq === "daily") {
    if (data.workdaysOnly) {
      rule["频率"] = "工作日";
    } else {
      rule["频率"] = "每天";
      rule["间隔天数"] = data.interval && data.interval >= 1 ? data.interval : 1;
    }
  } else if (data.freq === "weekly") {
    rule["频率"] = "每周";
    const days = data.weekdays && data.weekdays.length
      ? [...data.weekdays].sort((a, b) => a - b)
      : [((d.getDay() + 6) % 7) + 1];
    rule["每周几"] = days;
  } else if (data.freq === "monthly") {
    rule["频率"] = "每月";
    const md = data.monthDay && data.monthDay >= 1 && data.monthDay <= 31
      ? data.monthDay
      : (isNaN(d.getTime()) ? 1 : d.getDate());
    rule["每月几号"] = md;
  } else {
    return null;
  }
  return rule;
}

async function findProjectFolder(app: App, rootPath: string, projectName: string): Promise<TFolder | null> {
  const root = app.vault.getAbstractFileByPath(rootPath);
  if (!(root instanceof TFolder)) return null;
  return findProjectFolderRecursive(app, root, projectName);
}

function findProjectFolderRecursive(app: App, folder: TFolder, projectName: string): TFolder | null {
  for (const child of folder.children) {
    if (child instanceof TFolder) {
      if (child.name === projectName) return child;
      const found = findProjectFolderRecursive(app, child, projectName);
      if (found) return found;
    }
  }
  return null;
}

export async function createTaskFile(
  app: App,
  projectsFolder: string,
  data: TaskFormData
): Promise<void> {
  const statusMap: Record<string, string> = {
    "todo": "待办",
    "in-progress": "进行中",
    "blocked": "已阻塞",
    "done": "已完成",
    "cancelled": "已取消"
  };
  const typeMap: Record<string, string> = {
    "task": "普通",
    "recurring": "重复"
  };

  const safeTitle = data.title.replace(/[*"/<>:|?\\]/g, "-");
  const filename = `${safeTitle}.md`;

  const folder = await findProjectFolder(app, projectsFolder, data.project);
  if (!folder) {
    new Notice(`❌ 找不到项目文件夹: ${data.project}`);
    return;
  }
  const filePath = `${folder.path}/${filename}`;

  if (app.vault.getAbstractFileByPath(filePath)) {
    new Notice(`❌ ${data.title} 已存在于该项目中`);
    return;
  }

  const fmPriority = data.priority || "";
  const fmType = typeMap[data.type] || "普通";
  const isRecurring = fmType === "重复";
  const fmStatus = isRecurring ? "进行中" : statusMap[data.status] || "待办";

  const repeatRule = isRecurring
    ? buildRepeatRule({
        freq: data.repeatFreq,
        interval: data.repeatInterval,
        workdaysOnly: data.repeatWorkdaysOnly,
        weekdays: data.repeatWeekdays,
        monthDay: data.repeatMonthDay,
        startDate: data.startDate
      })
    : null;

  const lines: string[] = ["---"];
  lines.push(`状态: ${yamlScalar(fmStatus)}`);
  lines.push(`优先级: ${yamlScalar(fmPriority)}`);
  lines.push(`开始日期: ${yamlScalar(data.startDate)}`);
  if (data.endDate) lines.push(`截止日期: ${yamlScalar(data.endDate)}`);
  lines.push(`项目: ${yamlScalar(data.project)}`);
  lines.push(`tags: ${JSON.stringify(data.tags)}`);
  lines.push(`类型: ${yamlScalar(fmType)}`);
  lines.push(`提醒: ${JSON.stringify(data.reminders)}`);
  lines.push(`备注: ${yamlScalar(data.notes)}`);
  if (data.parent) lines.push(`父任务: ${yamlScalar(data.parent)}`);

  if (isRecurring && repeatRule) {
    lines.push("重复规则:");
    lines.push(`  频率: ${repeatRule["频率"]}`);
    if (repeatRule["间隔天数"] != null) lines.push(`  间隔天数: ${repeatRule["间隔天数"]}`);
    if (repeatRule["每周几"] && repeatRule["每周几"].length) lines.push(`  每周几: [${repeatRule["每周几"].join(", ")}]`);
    if (repeatRule["每月几号"] != null) lines.push(`  每月几号: ${repeatRule["每月几号"]}`);
    lines.push(`提醒日期: ${data.startDate || todayStr()}`);
  }

  lines.push("---");
  lines.push("");
  lines.push(`# ${data.title}`);
  lines.push("");

  await app.vault.create(filePath, lines.join("\n"));
  new Notice("✨ 任务已创建");
}
