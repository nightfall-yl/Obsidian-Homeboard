import { App, MarkdownView, getIcon } from "obsidian";

interface FloatingEditButtonOptions {
	app: App;
	codeblockDom: HTMLElement;
	className: string;
	iconName: string;
	canShow?: () => boolean;
	onClick: () => void;
}

export function mountFloatingEditButton(options: FloatingEditButtonOptions) {
	const { app, codeblockDom, className, iconName, canShow, onClick } = options;
	const classTokens = className.split(/\s+/).filter(Boolean);
	const primaryClassName = classTokens[0];
	if (primaryClassName) {
		codeblockDom.querySelectorAll(`.${primaryClassName}`).forEach((existing) => existing.remove());
	}

	codeblockDom.style.position = "relative";

	const editButton = document.createElement("div");
	editButton.className = className;
	editButton.setAttribute("aria-label", "Edit");
	const iconEl = getIcon(iconName);
	if (iconEl) {
		editButton.appendChild(iconEl);
	}

	const nativeEditButton = findNativeEditButton(codeblockDom);
	let hideTimer: number | null = null;

	const clearHideTimer = () => {
		if (hideTimer !== null) {
			window.clearTimeout(hideTimer);
			hideTimer = null;
		}
	};

	const showButton = () => {
		clearHideTimer();
		const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView && (!canShow || canShow())) {
			justifyBottomRight(codeblockDom, editButton);
			editButton.style.opacity = "1";
			editButton.style.pointerEvents = "auto";
		}
	};

	const hideButton = () => {
		clearHideTimer();
		editButton.style.opacity = "0";
		editButton.style.pointerEvents = "none";  /* ✅ 立即禁用指针事件，不延迟 */
	};

	codeblockDom.addEventListener("mouseenter", showButton);
	codeblockDom.addEventListener("mouseleave", hideButton);
	editButton.addEventListener("mouseenter", showButton);
	editButton.addEventListener("mouseleave", hideButton);

	if (nativeEditButton) {
		nativeEditButton.addEventListener("mouseenter", showButton);
		nativeEditButton.addEventListener("mouseleave", hideButton);
		nativeEditButton.style.position = "relative";  /* ✅ 确保原生按钮在更高层级 */
		nativeEditButton.style.zIndex = "20";
	}

	editButton.addEventListener("click", (e) => {
		e.stopPropagation();
		e.preventDefault();
		onClick();
	});

	editButton.style.zIndex = "5";  /* ✅ 确保自定义按钮在原生按钮下方 */
	codeblockDom.appendChild(editButton);

	return editButton;
}

function justifyBottomRight(codeblockDom: HTMLElement, editButton: HTMLDivElement) {
	editButton.style.bottom = "4px";
	editButton.style.right = "4px";
}

function findNativeEditButton(codeblockDom: HTMLElement): HTMLElement | null {
	return (
		codeblockDom.querySelector<HTMLElement>(".edit-block-button") ??
		codeblockDom.parentElement?.querySelector<HTMLElement>(".edit-block-button") ??
		null
	);
}
