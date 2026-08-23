import { Modal, setIcon } from "obsidian";
import type { App, TFile } from "obsidian";

export interface DetailItem {
  file: TFile;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export class DetailModal extends Modal {
  private filteredItems: DetailItem[];

  constructor(
    app: App,
    private readonly heading: string,
    private readonly description: string,
    private readonly items: DetailItem[],
    private readonly showSearch: boolean = true
  ) {
    super(app);
    this.filteredItems = items;
  }

  onOpen(): void {
    this.modalEl.addClass("attend-detail-modal");
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    const header = this.contentEl.createDiv("attend-modal-header");
    header.createEl("h2", { text: this.heading });
    header.createEl("p", { text: this.description });

    const summary = this.contentEl.createDiv("attend-modal-summary");
    summary.setText(`共 ${this.items.length} 条`);
    const list = this.contentEl.createDiv("attend-modal-list");

    if (this.showSearch) {
      const searchWrap = this.contentEl.createDiv("attend-modal-search");
      const searchIcon = searchWrap.createSpan("attend-modal-search-icon");
      setIcon(searchIcon, "search");
      const search = searchWrap.createEl("input", {
        attr: {
          type: "search",
          placeholder: `搜索 ${this.items.length} 条结果`,
          "aria-label": "搜索结果"
        }
      });
      search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase();
        this.filteredItems = query
          ? this.items.filter((item) =>
              [item.title ?? item.file.basename, item.file.path, item.subtitle]
                .filter(Boolean)
                .some((value) => value?.toLocaleLowerCase().includes(query))
            )
          : this.items;
        this.renderList(list);
      });
      window.setTimeout(() => search.focus(), 0);
    }

    this.renderList(list);
  }

  private renderList(list: HTMLElement): void {
    list.empty();
    if (this.filteredItems.length === 0) {
      const empty = list.createDiv("attend-modal-empty");
      const icon = empty.createSpan();
      setIcon(icon, "search-x");
      empty.createEl("p", { text: "没有匹配结果" });
      return;
    }

    this.filteredItems.forEach((item) => {
      const row = list.createEl("button", {
        cls: "attend-modal-row",
        attr: { type: "button" }
      });
      const icon = row.createSpan("attend-modal-row-icon");
      setIcon(icon, "file-text");
      const copy = row.createSpan("attend-modal-row-copy");
      copy.createSpan({
        cls: "attend-modal-row-title",
        text: item.title ?? item.file.basename
      });
      copy.createSpan({
        cls: "attend-modal-row-path",
        text: item.subtitle ?? item.file.path
      });
      if (item.badge) {
        row.createSpan({ cls: "attend-modal-row-badge", text: item.badge });
      }
      const arrow = row.createSpan("attend-modal-row-arrow");
      setIcon(arrow, "chevron-right");
      row.addEventListener("click", () => {
        void this.app.workspace.getLeaf(false).openFile(item.file);
        this.close();
      });
    });
  }
}
