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

		// Title
		contentEl.createEl("h3", {
			text: this.options.title,
			cls: "calendar-confirm-modal__title",
		});

		// Message
		contentEl.createEl("p", {
			text: this.options.message,
			cls: "calendar-confirm-modal__message",
		});

		// Button row
		const buttonRow = contentEl.createDiv({
			cls: "calendar-confirm-modal__buttons",
		});

		const cancelBtn = buttonRow.createEl("button", {
			text: this.options.cancelText,
			cls: "calendar-confirm-modal__btn calendar-confirm-modal__btn--cancel",
		});
		cancelBtn.addEventListener("click", () => {
			this.close();
			this.onCancel();
		});

		const confirmBtn = buttonRow.createEl("button", {
			text: this.options.confirmText,
			cls: "calendar-confirm-modal__btn calendar-confirm-modal__btn--confirm mod-cta",
		});
		confirmBtn.addEventListener("click", () => {
			this.close();
			this.onConfirm();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
