import { App, Modal } from "obsidian";

interface ConfirmCreateModalOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

export class ConfirmCreateModal extends Modal {
  private options: ConfirmCreateModalOptions;
  private onConfirm: () => void;
  private onCancel: () => void;

  constructor(
    app: App,
    options: ConfirmCreateModalOptions,
    onConfirm: () => void,
    onCancel: () => void
  ) {
    super(app);
    this.options = options;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("calendar-confirm-modal");

    this.titleEl.setText(this.options.title);

    contentEl.createEl("p", {
      text: this.options.message,
      cls: "modal-description",
    });

    const buttonRow = contentEl.createDiv("modal-buttons");

    const cancelBtn = buttonRow.createEl("button", {
      text: this.options.cancelText,
      cls: "modal-button",
    });
    cancelBtn.addEventListener("click", () => {
      this.close();
      this.onCancel();
    });

    const confirmBtn = buttonRow.createEl("button", {
      text: this.options.confirmText,
      cls: "modal-button mod-cta",
    });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
