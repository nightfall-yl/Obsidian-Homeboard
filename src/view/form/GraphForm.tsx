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
	const [showThemeMenu, setShowThemeMenu] = useState(false);
	const formDataRef = useRef(formData);
	const cellRulesRef = useRef(cellRules);
	const hasMountedRef = useRef(false);
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

	useEffect(() => {
		if (!showThemeMenu) {
			return;
		}

		const handleOutsideClick = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (target && themeWrapperRef.current?.contains(target)) {
				return;
			}
			setShowThemeMenu(false);
		};

		document.addEventListener("click", handleOutsideClick, true);
		return () => {
			document.removeEventListener("click", handleOutsideClick, true);
		};
	}, [showThemeMenu]);

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
		setShowThemeMenu(false);
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
		<div className="contribution-graph-modal-content">
			<Tab
				activeIndex={0}
				tabs={[
					{
						title: local.form_basic_settings,
						children: (
							<div className="contribution-graph-modal-form">
								<div className="form-group contribution-graph-modal__basic-group">
									<div className="form-item">
										<span className="label">
											{local.form_title}
										</span>
										<div className="form-content contribution-graph-modal__title-row">
											<input
												name="title"
												type="text"
												defaultValue={formData.title}
												placeholder={
													local.form_title_placeholder
												}
												onChange={handleInputChange}
												className="contribution-graph-modal__title-input"
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
												className="contribution-graph-modal__title-size"
											/>
										</div>
									</div>

									<div className="form-item">
										<span className="label">
											{local.form_title_align_label}
										</span>
										<div className="form-content contribution-graph-modal__title-align-row">
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
												className="contribution-graph-modal__compact-select"
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
										<div className="form-content contribution-graph-modal__date-range-row">
											<select
												className="contribution-graph-modal__date-range-type"
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
												)}
											</select>
											{formData.dateRangeType !=
											"FIXED_DATE_RANGE" ? (
												<input
													className="contribution-graph-modal__date-range-value"
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
														className="contribution-graph-modal__date-range-date"
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
													<span className="contribution-graph-modal__date-range-separator">
														-
													</span>
													<input
														className="contribution-graph-modal__date-range-date"
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
											)}
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
							<div className="contribution-graph-modal-form">
								<div className="form-group">
									<div className="form-item">
										<span className="label">
											{local.form_theme}
										</span>
										<div className="form-content">
											<div
												ref={themeWrapperRef}
												className="contribution-graph-modal__theme-picker"
											>
												<button
													type="button"
													className="contribution-graph-modal__theme-trigger plugin-config-palette-trigger-row"
													onClick={() =>
														setShowThemeMenu((value) => !value)
													}
												>
													<span className="plugin-config-palette-label">
														{activeTheme?.label ?? local.form_theme}
													</span>
													<div className="plugin-config-swatch-group">
														{(activeTheme
															? getThemeSwatches(activeTheme)
															: cellRules
																	.map((rule) => rule.color)
																	.slice(0, 4)
														).map((color, index) => (
															<span
																key={`${color}-${index}`}
																className="homepage-builder-modal__palette-swatch homepage-builder-modal__palette-swatch--small"
																style={{ background: color }}
															/>
														))}
													</div>
												</button>
												{showThemeMenu ? (
													<div className="contribution-graph-modal__theme-menu plugin-config-palette-menu">
														{themes.map((theme) => (
															<button
																type="button"
																key={theme.name}
																className={`contribution-graph-modal__theme-option plugin-config-palette-option ${activeTheme?.name === theme.name ? "is-active" : ""}`}
																onClick={() => {
																	applyTheme(theme.rules);
																}}
															>
																<span className="plugin-config-palette-label">
																	{theme.label}
																</span>
																<div className="plugin-config-swatch-group">
																	{getThemeSwatches(theme).map(
																		(color, index) => (
																			<span
																				key={`${theme.name}-${color}-${index}`}
																				className="homepage-builder-modal__palette-swatch homepage-builder-modal__palette-swatch--small"
																				style={{ background: color }}
																			/>
																		)
																	)}
																</div>
															</button>
														))}
													</div>
												) : null}
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
													)}
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
