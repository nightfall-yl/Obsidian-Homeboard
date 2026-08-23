import { FuzzySuggestModal, Modal, setIcon } from "obsidian";
import type { App } from "obsidian";
import type AttendDashboardPlugin from "./main";
import type { QuickLink } from "./models";

interface CommandEntry {
  id: string;
  name: string;
}

class CommandSuggestModal extends FuzzySuggestModal<CommandEntry> {
  private readonly onSelect: (id: string) => void;

  constructor(app: App, onSelect: (id: string) => void) {
    super(app);
    this.onSelect = onSelect;
    this.setPlaceholder("搜索命令...");
  }

  getItems(): CommandEntry[] {
    const registry = (this.app as unknown as {
      commands?: { commands?: Record<string, { name?: string }> };
    }).commands?.commands ?? {};
    return Object.entries(registry)
      .map(([id, cmd]) => ({ id, name: cmd?.name ?? id }))
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }

  getItemText(item: CommandEntry): string {
    return item.name;
  }

  onChooseItem(item: CommandEntry): void {
    this.onSelect(item.id);
  }
}

export class QuickLinkModal extends Modal {
  private readonly links: QuickLink[];

  constructor(
    app: App,
    private readonly dashboardPlugin: AttendDashboardPlugin
  ) {
    super(app);
    this.links = dashboardPlugin.data.settings.quickLinks.map((link) => ({
      ...link
    }));
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    this.modalEl.addClass("attend-quick-link-modal");

    const header = this.contentEl.createDiv("attend-link-editor-header");
    header.createEl("h2", { text: "管理快捷链接" });
    header.createEl("p", {
      text: "自定义顶部快捷入口。url 指向笔记（笔记名或路径），action 为命令 ID（填写后优先执行命令）。图标填写 Lucide 图标名，如 home。"
    });

    const list = this.contentEl.createDiv("attend-link-editor-list");

    if (this.links.length === 0) {
      list.createDiv({
        cls: "attend-link-editor-empty",
        text: "还没有快捷链接，点击下方新增。"
      });
    } else {
      this.links.forEach((link, index) => {
        this.renderRow(list, link, index);
      });
    }

    const addBar = this.contentEl.createDiv("attend-link-editor-add");
    const addBtn = addBar.createEl("button", {
      cls: "mod-cta",
      text: "新增链接",
      attr: { type: "button" }
    });
    addBtn.addEventListener("click", () => {
      this.links.push({ label: "新链接", url: "" });
      this.render();
    });

    const actions = this.contentEl.createDiv("attend-settings-actions");
    const done = actions.createEl("button", {
      cls: "mod-cta",
      text: "完成",
      attr: { type: "button" }
    });
    done.addEventListener("click", () => {
      const cleaned = this.links.filter((link) => link.label.trim() !== "");
      this.dashboardPlugin.data.settings.quickLinks = cleaned;
      void this.dashboardPlugin.saveDashboardPreferences();
      this.close();
    });
  }

  private renderRow(
    list: HTMLElement,
    link: QuickLink,
    index: number
  ): void {
    const row = list.createDiv("attend-link-editor-row");

    const head = row.createDiv("attend-link-editor-row-head");
    head.createSpan({
      cls: "attend-link-editor-index",
      text: String(index + 1)
    });

    const controls = head.createSpan("attend-link-editor-controls");
    this.createIconButton(
      controls,
      "arrow-up",
      "上移",
      index === 0,
      () => this.move(index, -1)
    );
    this.createIconButton(
      controls,
      "arrow-down",
      "下移",
      index === this.links.length - 1,
      () => this.move(index, 1)
    );
    this.createIconButton(controls, "trash", "删除", false, () =>
      this.remove(index)
    );

    const fields = row.createDiv("attend-link-editor-fields");
    this.createField(fields, "名称", link.label, (value) => {
      link.label = value;
    });
    this.createField(
      fields,
      "图标（可选）",
      link.icon ?? "",
      (value) => {
        link.icon = value.trim() || undefined;
      }
    );
    this.createField(
      fields,
      "链接（笔记名或路径）",
      link.url ?? "",
      (value) => {
        link.url = value.trim() || undefined;
      }
    );

    const actionField = fields.createDiv("attend-link-editor-field");
    actionField.createSpan({
      cls: "attend-link-editor-label",
      text: "命令（可选）"
    });
    const actionInput = actionField.createEl("input", {
      attr: { type: "text", placeholder: "命令 ID" }
    });
    actionInput.value = link.action ?? "";
    actionInput.addEventListener("change", () => {
      link.action = actionInput.value.trim() || undefined;
    });
    const pickBtn = actionField.createEl("button", {
      cls: "attend-link-editor-pick",
      text: "选择",
      attr: { type: "button" }
    });
    pickBtn.addEventListener("click", () => {
      new CommandSuggestModal(this.app, (id) => {
        link.action = id;
        actionInput.value = id;
      }).open();
    });
  }

  private createField(
    parent: HTMLElement,
    label: string,
    value: string,
    onChange: (value: string) => void
  ): void {
    const field = parent.createDiv("attend-link-editor-field");
    field.createSpan({ cls: "attend-link-editor-label", text: label });
    const input = field.createEl("input", { attr: { type: "text" } });
    input.value = value;
    input.addEventListener("change", () => onChange(input.value));
  }

  private createIconButton(
    parent: HTMLElement,
    icon: string,
    label: string,
    disabled: boolean,
    action: () => void
  ): void {
    const btn = parent.createEl("button", {
      cls: "attend-link-editor-button",
      attr: {
        type: "button",
        "aria-label": label,
        title: label
      }
    });
    btn.disabled = disabled;
    setIcon(btn, icon);
    btn.addEventListener("click", action);
  }

  private move(index: number, offset: number): void {
    const target = index + offset;
    if (target < 0 || target >= this.links.length) return;
    [this.links[index], this.links[target]] = [
      this.links[target]!,
      this.links[index]!
    ];
    this.render();
  }

  private remove(index: number): void {
    this.links.splice(index, 1);
    this.render();
  }
}

export function quickLinkInitial(label: string): string {
  return Array.from(label.trim())[0]?.toLocaleUpperCase() ?? "L";
}
