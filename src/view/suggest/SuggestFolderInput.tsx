import { App } from "obsidian";
import * as React from "react";
import { Suggest, SuggestItem } from "./Suggest";

export function SuggestFolderInput(props: {
	app: App;
	value: string[];
	onChange: (folders: string[]) => void;
	placeholder?: string;
	className?: string;
}): JSX.Element {
	const { app } = props;
	const [inputText, setInputText] = React.useState("");
	const [showSuggest, setShowSuggest] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const allFolders = React.useMemo(() => {
		return getAllFolders(app);
	}, [app]);

	const getItems = (query: string): SuggestItem[] => {
		if (!query.trim()) return allFolders.slice(0, 10);
		const q = query.toLowerCase();
		return allFolders.filter(
			(item) =>
				item.label.toLowerCase().includes(q) ||
				item.value.toLowerCase().includes(q)
		).slice(0, 15);
	};

	const addFolder = (folderPath: string) => {
		if (props.value.includes(folderPath)) return;
		const newValue = [...props.value, folderPath];
		props.onChange(newValue);
		setInputText("");
		setShowSuggest(false);
	};

	const removeFolder = (folderPath: string) => {
		props.onChange(props.value.filter((f) => f !== folderPath));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const val = inputText.trim();
			if (val && !props.value.includes(val)) {
				addFolder(val.endsWith("/") ? val : val + "/");
			}
			setInputText("");
			setShowSuggest(false);
		} else if (e.key === "Backspace" && !inputText && props.value.length > 0) {
			removeFolder(props.value[props.value.length - 1]);
		}
	};

	return (
		<div className="heatmap-modal__folder-suggest-input">
			<div className="heatmap-modal__folder-tags">
				{props.value.map((folder) => (
					<span
						key={folder}
						className="heatmap-modal__folder-tag"
						onClick={() => removeFolder(folder)}
					>
						📁 {folder} <span className="remove">✕</span>
					</span>
				))}
				<input
					ref={inputRef}
					type="text"
					placeholder={
						props.value.length === 0 ? props.placeholder || ""
							: ""
					}
					className={props.className || ""}
					value={inputText}
					onFocus={() => setShowSuggest(true)}
					onChange={(e) => {
						setInputText(e.target.value);
						if (!showSuggest) setShowSuggest(true);
					}}
					onBlur={() =>
						setTimeout(() => setShowSuggest(false), 200)
					}
					onKeyDown={handleKeyDown}
				/>
			</div>
			{inputRef.current && (
				<Suggest
					query={inputText}
					showSuggest={showSuggest}
					getItems={getItems}
					onSelected={(item) => addFolder(item.value)}
					anchorElement={inputRef.current}
					onOpenChange={(open) => setShowSuggest(open)}
				/>
			)}
		</div>
	);
}

function getAllFolders(app: App): SuggestItem[] {
	const folders = new Set<string>();
	for (const file of app.vault.getFiles()) {
		const parent = file.parent?.path;
		if (parent) {
			folders.add(parent + "/");
		}
		let current = file.parent;
		while (current && current.path) {
			folders.add(current.path + "/");
			current = current.parent;
		}
	}
	return Array.from(folders)
		.sort()
		.map((path) => ({
			id: path,
			label: path,
			value: path,
		}));
}
