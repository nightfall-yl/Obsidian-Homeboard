import { Modal, Setting } from "obsidian";
import type { App } from "obsidian";
import type AttendDashboardPlugin from "./main";
import type {
  HeatmapDateFieldType,
  HeatmapSettings
} from "./models";

export class HeatmapSettingsModal extends Modal {
  private readonly settings: HeatmapSettings;

  constructor(
    app: App,
    private readonly plugin: AttendDashboardPlugin
  ) {
    super(app);
    this.settings = { ...plugin.data.settings.heatmap };
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    this.modalEl.addClass("attend-heatmap-settings-modal");

    // 以下设置为固定默认值，不再提供配置项
    this.settings.startOfWeek = 1; // 每周起始日固定周一
    this.settings.showCellRuleIndicators = true; // 固定显示图例
    this.settings.countFieldType = "DEFAULT"; // 计数字段固定按条目数
    this.settings.countFieldValue = "";
    this.settings.excludeFolders = ""; // 不再排除文件夹

    this.renderBasicSection(this.contentEl);
    this.renderDataSourceSection(this.contentEl);

    const actions = this.contentEl.createDiv("attend-settings-actions");
    const done = actions.createEl("button", {
      cls: "mod-cta",
      text: "完成",
      attr: { type: "button" }
    });
    done.addEventListener("click", () => {
      this.plugin.data.settings.heatmap = this.settings;
      void this.plugin.saveDashboardPreferences();
      this.close();
    });
  }

  private renderBasicSection(parent: HTMLElement): void {
    const heading = parent.createEl("h3", { text: "基本设置" });
    heading.addClass("attend-heatmap-section-heading");

    new Setting(parent)
      .setName("标题")
      .setDesc("热图标题，留空则不显示")
      .addText((text) =>
        text
          .setValue(this.settings.title)
          .onChange((v) => {
            this.settings.title = v;
          })
      );
  }

  private renderDataSourceSection(parent: HTMLElement): void {
    const heading = parent.createEl("h3", { text: "数据源" });
    heading.addClass("attend-heatmap-section-heading");

    // 数据源类型固定为"文档"（PAGE），数据源值固定为空（全部文件），不再提供配置。
    this.settings.dataSourceType = "PAGE";
    this.settings.dataSourceValue = "";

    new Setting(parent)
      .setName("日期字段")
      .setDesc("按哪个字段取日期")
      .addDropdown((dd) => {
        const options: Array<[HeatmapDateFieldType, string]> = [
          ["FILE_CTIME", "文件创建时间"],
          ["FILE_MTIME", "文件修改时间"],
          ["FILE_NAME", "文件名"],
          ["PAGE_PROPERTY", "文档属性"]
        ];
        options.forEach(([value, label]) => {
          dd.addOption(value, label);
        });
        dd.setValue(this.settings.dateFieldType);
        dd.onChange((v) => {
          this.settings.dateFieldType = v as HeatmapDateFieldType;
          this.render();
        });
      });

    if (this.settings.dateFieldType === "PAGE_PROPERTY") {
      new Setting(parent)
        .setName("日期属性名")
        .setDesc("文档属性的字段名")
        .addText((text) =>
          text
            .setValue(this.settings.dateFieldValue)
            .onChange((v) => {
              this.settings.dateFieldValue = v;
            })
        );

      new Setting(parent)
        .setName("日期格式")
        .setDesc("留空=自动识别；手动填写 luxon 格式串，如 yyyy-MM-dd")
        .addDropdown((dd) => {
          dd.addOption("smart_detect", "自动识别");
          dd.addOption("manual", "手动");
          dd.setValue(this.settings.dateFormat ? "manual" : "smart_detect");
          dd.onChange((v) => {
            this.settings.dateFormat = v === "manual" ? "yyyy-MM-dd" : "";
            this.render();
          });
        });

      if (this.settings.dateFormat) {
        new Setting(parent)
          .setName("日期格式串")
          .setDesc("luxon 格式，如 yyyy-MM-dd")
          .addText((text) =>
            text
              .setValue(this.settings.dateFormat)
              .onChange((v) => {
                this.settings.dateFormat = v;
              })
          );
      }
    }
  }
}
