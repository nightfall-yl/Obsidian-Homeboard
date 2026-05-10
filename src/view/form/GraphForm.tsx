import { useEffect, useMemo, useRef, useState } from "react";
import { CellStyleRule } from "src/types";
import { Choose } from "../choose/Choose";
import { getThemes, getThemeSwatches, matchThemeByRules } from "./GraphTheme";
import { Locals } from "src/i18/messages";
import { App } from "obsidian";

import {
	getCellShapes,
	titleAlignChooseOptions,
	getGraphOptions,
	getStartOfWeekOptions,
	getDateTypeOptions,
} from "./options";
import { DataSourceFormItem } from "./DataSourceFormItem";
import { DateRangeType, YamlGraphConfig } from "src/processor/types";
import { Tab } from "../tab/Tab";
import NumberInput from "../number-input";
import { ColorPicker } from "./ColorPicker";

export function GraphForm(props: {
	yamlConfig: YamlGraphConfig;
	onSubmit: (yamlGraphConfig: YamlGraphConfig) => void;
	app: App;
}): JSX.Element {
	const { yamlConfig } = props;
	const local = Locals.get();
	const themes = useMemo(() => getThemes(local), [local]);

	const [formData, setFormData] = useState(yamlConfig);
	const [cellRules, setCellRules] = useState<CellStyleRule[]>(
		yamlConfig.cellStyleRules || []
	);
	const formDataRef = useRef(formData);
	const cellRulesRef = useRef(cellRules);
	const hasMountedRef = useRef(false);
	const themeTriggerRef = useRef<HTMLButtonElement>(null);
	const closePaletteMenuRef = useRef<(() => void) | null>(null);
	const graphOptions = getGraphOptions();
	const dateTypeOptions = getDateTypeOptions();
	const startOfWeekOptions = getStartOfWeekOptions();
	const cellShapes = getCellShapes();

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		changeFormData(name, value);
	};

	const themeWrapperRef = useRef<HTMLDivElement | null>(null);
	const activeTheme = useMemo(() => matchThemeByRules(cellRules, themes), [cellRules, themes]);

	useEffect(() => {
		formDataRef.current = formData;
	}, [formData]);

	useEffect(() => {
		cellRulesRef.current = cellRules;
	}, [cellRules]);

	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		submitCurrent();
	}, [formData, cellRules]);

	// Clean up palette menu when component unmounts
	useEffect(() => {
		return () => {
			if (closePaletteMenuRef.current) {
				closePaletteMenuRef.current();
			}
		};
	}, []);

	const handleCellShapeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { value } = e.target;
		changeFormData("cellStyle", {
			...formData.cellStyle,
			borderRadius: value,
		});
	};

	const getDefaultCellShape = (): string => {
		if (formData.cellStyle && formData.cellStyle.borderRadius) {
			return (
				cellShapes.find(
					(p) => p.value == formData.cellStyle?.borderRadius
				)?.value || ""
			);
		}
		return "";
	};

	const changeFormData = (name: string, value: any) => {
		setFormData((prevData) => {
			const nextData = { ...prevData, [name]: value };
			formDataRef.current = nextData;
			return nextData;
		});
	};

	const submitCurrent = () => {
		const nextFormData = JSON.parse(
			JSON.stringify(formDataRef.current)
		) as YamlGraphConfig;
		nextFormData.cellStyleRules = JSON.parse(
			JSON.stringify(cellRulesRef.current)
		);
		props.onSubmit(nextFormData);
	};

	const applyTheme = (rules: CellStyleRule[]) => {
		cellRulesRef.current = rules;
		changeFormData("cellStyleRules", rules);
		setCellRules(rules);
		if (closePaletteMenuRef.current) {
			closePaletteMenuRef.current();
		}
	};

	const togglePaletteMenu = () => {
		if (closePaletteMenuRef.current) {
			closePaletteMenuRef.current();
			return;
		}

		const triggerEl = themeTriggerRef.current;
		if (!triggerEl) return;

		const triggerRect = triggerEl.getBoundingClientRect();
		const modalEl = document.querySelector('.heatmap-modal-container');
		if (!modalEl) return;

		const menuEl = document.createElement('div');
		menuEl.className = 'heatmap-modal__theme-menu plugin-config-palette-menu elementCard-builder-modal__palette-menu';
		menuEl.style.position = 'fixed';
		menuEl.style.left = `${triggerRect.left}px`;
		menuEl.style.top = `${triggerRect.bottom + 5}px`;
		menuEl.style.width = `${Math.max(triggerRect.width, 200)}px`;
		menuEl.style.zIndex = '1000';
		menuEl.style.boxSizing = 'border-box';

		const closeMenu = () => {
			menuEl.remove();
			document.removeEventListener('click', handleOutsideClick, true);
			if (closePaletteMenuRef.current === closeMenu) {
				closePaletteMenuRef.current = null;
			}
		};

		const handleOutsideClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && (triggerEl.contains(target) || menuEl.contains(target))) {
				return;
			}
			closeMenu();
		};

		closePaletteMenuRef.current = closeMenu;

		// Render theme options
		themes.forEach((theme) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = `heatmap-modal__theme-option plugin-config-palette-option elementCard-builder-modal__palette-option ${activeTheme?.name === theme.name ? 'is-active' : ''}`;
			
			// Create label span
			const labelSpan = document.createElement('span');
			labelSpan.className = 'plugin-config-palette-label elementCard-builder-modal__palette-option-label';
			labelSpan.textContent = theme.label;
			button.appendChild(labelSpan);
			
			// Create swatches container
			const swatchesContainer = document.createElement('div');
			swatchesContainer.className = 'plugin-config-swatch-group elementCard-builder-modal__palette-swatches';
			
			// Add color swatches
			getThemeSwatches(theme).forEach((color, index) => {
				const swatch = document.createElement('span');
				swatch.className = 'elementCard-builder-modal__palette-swatch elementCard-builder-modal__palette-swatch--small';
				swatch.style.background = color;
				swatchesContainer.appendChild(swatch);
			});
			
			button.appendChild(swatchesContainer);
			
			button.addEventListener('click', () => {
				applyTheme(theme.rules);
				closeMenu();
			});
			menuEl.appendChild(button);
		});

		modalEl.appendChild(menuEl);

		setTimeout(() => {
			document.addEventListener('click', handleOutsideClick, true);
		}, 0);
	};

	const getTitleFontSize = () => {
		if (formData.titleStyle && formData.titleStyle.fontSize) {
			const fontSize = formData.titleStyle.fontSize;
			return parseInt(fontSize.replace(/[^0-9]/, ""));
		}
		return 14;
	};

	const parseNumberFromPrefix = (
		str: string | undefined,
		defaultValue: number
	): number => {
		if (!str) {
			return defaultValue;
		}
		const numberStr = str.replace(/[^0-9]/, "") || "0";
		return parseInt(numberStr);
	};

	return (
		<div className="heatmap-modal-content plugin-config-modal">
			<Tab
				activeIndex={0}
				tabs={[
					{
						title: local.form_basic_settings,
						children: (
							<div className="heatmap-modal-form plugin-config-form">
								<div className="form-group heatmap-modal__basic-group">
									<div className="form-item">
										<span className="label">
											{local.form_title}
										</span>
										<div className="form-content heatmap-modal__title-row">
											<input
												name="title"
												type="text"
												defaultValue={formData.title}
												placeholder={
													local.form_title_placeholder
												}
												onChange={handleInputChange}
												className="heatmap-modal__title-input elementCard-builder-modal__title-input"
												style={{
													...formData.titleStyle,
													fontSize: "inherits",
													fontWeight:
														formData.titleStyle
															?.fontWeight ||
														"normal",
													// @ts-ignore
													textAlign:
														formData.titleStyle
															?.textAlign ||
														"left",
													}}
											/>

											<NumberInput
												defaultValue={getTitleFontSize()}
												onChange={(value) => {
													changeFormData(
														"titleStyle",
														{
															...formData.titleStyle,
															fontSize:
																value + "px",
														}
													);
												}}
												min={1}
												max={128}
												className="heatmap-modal__title-size elementCard-builder-modal__title-size-input"
											/>
										</div>
									</div>

									<div className="form-item">
										<span className="label">
											{local.form_title_align_label}
										</span>
										<div className="form-content heatmap-modal__title-align-row">
											<Choose
												options={
													titleAlignChooseOptions
												}
												defaultValue={
													formData.titleStyle
														?.textAlign || "left"
												}
												onChoose={(option) => {
													changeFormData(
														"titleStyle",
														{
															...formData.titleStyle,
															textAlign:
																option.value,
														}
													);
												}}
											/>
										</div>
									</div>

									<div className="form-item">
										<span className="label">
											{local.form_graph_type}
										</span>
										<div className="form-content">
											<select
											className="heatmap-modal__compact-select elementCard-builder-modal__select"
											name="graphType"
											defaultValue={
												formData.graphType ||
												graphOptions.find(
													(p) => p.selected
												)?.value
											}
											onChange={handleInputChange}
										>
											{graphOptions.map((option) => (
												<option
													value={option.value}
													key={option.value}
												>
													{option.label}
												</option>
											))}
										</select>
										</div>
									</div>

									<div className="form-item">
										<span className="label">
											{local.form_date_range}
										</span>
										<div className="form-content heatmap-modal__date-range-row">
											<select
											className="heatmap-modal__date-range-type elementCard-builder-modal__select"
											defaultValue={
												formData.dateRangeType ||
												"LATEST_DAYS"
											}
											onChange={(e) => {
												changeFormData(
													"dateRangeType",
													e.target
														.value as DateRangeType
												);
												if (
													e.target.type !=
													"FIXED_DATE_RANGE"
												) {
													changeFormData(
														"fromDate",
														undefined
													);
													changeFormData(
														"toDate",
														undefined
													);
												} else {
													changeFormData(
														"dateRangeValue",
														undefined
													);
												}
											}}
										>
											{dateTypeOptions.map(
												(option) => (
													<option
														value={option.value}
														key={option.value}
													>
														{option.label}
													</option>
												)
											)
										}
										</select>
										{formData.dateRangeType !=
										"FIXED_DATE_RANGE" ? (
											<input
												className="heatmap-modal__date-range-value elementCard-builder-modal__input"
												type="number"
												defaultValue={
													formData.dateRangeValue
												}
												min={1}
												placeholder={
													local.form_date_range_input_placeholder
												}
												onChange={(e) =>
													changeFormData(
														"dateRangeValue",
														parseInt(
															e.target.value
														)
													)
												}
											/>
										) : (
											<>
												<input
													className="heatmap-modal__date-range-date elementCard-builder-modal__input"
													id="fromDate"
													name="fromDate"
													type="date"
													defaultValue={
														formData.fromDate
													}
													placeholder="from date, such as 2023-01-01"
													onChange={
														handleInputChange
													}
												/>
												<span className="heatmap-modal__date-range-separator">
													-
												</span>
												<input
													className="heatmap-modal__date-range-date elementCard-builder-modal__input"
													id="toDate"
													name="toDate"
													type="date"
													defaultValue={
														formData.toDate
													}
													placeholder="to date, such as 2023-12-31"
													onChange={
														handleInputChange
													}
												/>
											</>
										)
										}
										</div>
									</div>

									<DataSourceFormItem
										dataSource={formData.dataSource}
										onChange={(newDataSource) => {
											changeFormData(
												"dataSource",
												newDataSource
											);
										}}
										app={props.app}
									/>
								</div>
							</div>
						),
					},
					{
						title: local.form_style_settings,
						children: (
							<div className="heatmap-modal-form plugin-config-form">
								<div className="form-group">
									<div className="form-item">
												<span className="label">
													{local.form_theme}
												</span>
												<div className="form-content">
													<div
													ref={themeWrapperRef}
													className="heatmap-modal__theme-picker"
												>
													<button
														type="button"
														ref={themeTriggerRef}
														className="heatmap-modal__theme-trigger plugin-config-palette-trigger-row elementCard-builder-modal__palette-trigger-row"
														onClick={() => {
															togglePaletteMenu();
														}}
													>
														<span className="plugin-config-palette-label elementCard-builder-modal__palette-trigger-label">
															{activeTheme?.label ?? local.form_theme}
														</span>
														<div className="plugin-config-swatch-group elementCard-builder-modal__palette-swatches">
															{(activeTheme
																? getThemeSwatches(activeTheme)
																: cellRules
																		.map((rule) => rule.color)
																		.slice(0, 4)
															).map((color, index) => (
																<span
																	key={`${color}-${index}`}
																	className="elementCard-builder-modal__palette-swatch elementCard-builder-modal__palette-swatch--small"
																	style={{ background: color }}
																/>
															))}
														</div>
													</button>
												</div>
												</div>
											</div>
									<div className="form-item">
										<span className="label">
											{local.form_fill_the_screen_label}
										</span>
										<div className="form-content">
											<input
												type="checkbox"
												className="checkbox"
												defaultChecked={
													formData.fillTheScreen
												}
												onChange={() =>
													changeFormData(
														"fillTheScreen",
														!formData.fillTheScreen
													)
												}
											/>
										</div>
									</div>
									{formData.graphType ==
									"month-track" ? null : (
										<div className="form-item">
											<span className="label">
												{local.form_start_of_week}
											</span>
											<div className="form-content">
												<select
											id="startOfWeek"
											name="startOfWeek"
											className="elementCard-builder-modal__select"
											defaultValue={
												formData.startOfWeek !=
												undefined
													? formData.startOfWeek
													: startOfWeekOptions.find(
															(p) =>
																p.selected
														  )?.value
											}
											onChange={handleInputChange}
										>
											{startOfWeekOptions.map(
												(option) => (
													<option
														value={
															option.value
														}
														key={
															option.value
														}
													>
														{option.label}
													</option>
												)
											)
										}
										</select>
											</div>
										</div>
									)}

									<div className="form-item">
										<span className="label">
											{
												local.form_enable_main_container_shadow
											}
										</span>
										<div className="form-content">
											<input
												name="enableMainContainerShadow"
												type="checkbox"
												className="checkbox"
												defaultChecked={
													formData.enableMainContainerShadow
												}
												onChange={(e) => {
													if (e.target.checked) {
														changeFormData(
															"enableMainContainerShadow",
															true
														);
													} else {
														changeFormData(
															"enableMainContainerShadow",
															false
														);
													}
												}}
											/>
										</div>
									</div>

									<div className="form-item">
										<span className="label">
											{local.form_show_cell_indicators}
										</span>
										<div className="form-content">
											<input
												name="showCellRuleIndicators"
												type="checkbox"
												className="checkbox"
												defaultChecked={
													formData.showCellRuleIndicators
												}
												onChange={() =>
													changeFormData(
														"showCellRuleIndicators",
														!formData.showCellRuleIndicators
													)
												}
											/>
										</div>
									</div>
									<div className="form-item">
										<span className="label">
											{local.form_cell_shape}
										</span>
										<div className="form-content">
											<select
											name="cellShape"
											className="elementCard-builder-modal__select"
											defaultValue={getDefaultCellShape()}
											onChange={handleCellShapeChange}
										>
											{cellShapes.map((option) => (
												<option
													value={option.value}
													key={option.label}
												>
													{option.label}
												</option>
											))}
										</select>
										</div>
									</div>
									<div className="form-item">
										<span className="label">
											{local.form_cell_min_width}
										</span>
										<div className="form-content">
											<input
												type="range"
												min={4}
												max={64}
												defaultValue={parseNumberFromPrefix(
													formData.cellStyle
														?.minWidth,
													8
												)}
												onChange={(e) => {
													changeFormData(
														"cellStyle",
														{
															...formData.cellStyle,
															minWidth:
																e.target.value +
																"px",
														}
													);
												}}
											/>
											<span
												className="input-range-value-label"
												onClick={(e) => {
													changeFormData(
														"cellStyle",
														{
															...formData.cellStyle,
															minWidth: undefined,
														}
													);
												}}
											>
												{formData.cellStyle?.minWidth
													? formData.cellStyle
															?.minWidth
													: local.default}
											</span>
										</div>
									</div>
									<div className="form-item">
										<span className="label">
											{local.form_cell_min_height}
										</span>
										<div className="form-content">
											<input
												type="range"
												min={4}
												max={64}
												defaultValue={parseNumberFromPrefix(
													formData.cellStyle
														?.minHeight,
													8
												)}
												onChange={(e) => {
													changeFormData(
														"cellStyle",
														{
															...formData.cellStyle,
															minHeight:
																e.target.value +
																"px",
														}
													);
												}}
											/>
											<span
												className="input-range-value-label"
												onClick={(e) => {
													changeFormData(
														"cellStyle",
														{
															...formData.cellStyle,
															minHeight:
																undefined,
														}
													);
												}}
											>
												{formData.cellStyle?.minHeight
													? formData.cellStyle
															?.minHeight
													: local.default}
											</span>
										</div>
									</div>
								</div>
							</div>
						),
					},
				]}
			></Tab>
		</div>
	);
}

export class SelectOption<T> {
	label: string;
	value: T;
	selected?: boolean;

	constructor(label: string, value: T, selected?: boolean) {
		this.label = label;
		this.value = value;
		this.selected = selected;
	}
}
