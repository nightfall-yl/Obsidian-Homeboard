
export interface Local {
	language_label: string;
	language_desc: string;
	language_zh: string;
	language_en: string;

	default: string;
	click_to_reset: string;
	/**
	 * context menu
	 */
	context_menu_create: string;
	context_menu_insert_navbar: string;
	elements_menu_title: string;

	/**
	 * form
	 */
	form_basic_settings: string;
	form_style_settings: string;
	form_about: string;
	form_contact_me: string;
	form_project_url: string;
	form_sponsor: string;
	form_title: string;
	form_title_placeholder: string;
	form_title_align_label: string;
	form_graph_type: string;
	form_graph_type_git: string;
	form_graph_type_month_track: string;
	form_graph_type_calendar: string;
	form_date_range: string;
	form_date_range_latest_days: string;
	form_date_range_latest_month: string;
	form_date_range_latest_year: string;
	form_date_range_input_placeholder: string;
	form_date_range_fixed_date: string;
	form_date_range_start_date: string;

	form_start_of_week: string;
	form_data_source_value: string;
	form_data_source_filter_label: string;

	form_datasource_filter_type_none: string;
	form_datasource_filter_type_status_is: string;
	form_datasource_filter_type_contains_any_tag: string;
	form_datasource_filter_type_status_in: string;

	form_datasource_filter_task_none: string;
	form_datasource_filter_task_status_completed: string;
	form_datasource_filter_task_status_fully_completed: string;
	form_datasource_filter_task_status_any: string;
	form_datasource_filter_task_status_incomplete: string;
	form_datasource_filter_task_status_canceled: string;
	form_datasource_filter_contains_tag: string;
	form_datasource_filter_contains_tag_input_placeholder: string;

	form_datasource_filter_customize: string;

	form_query_placeholder: string;

	form_date_field: string;
	form_date_field_type_file_name: string;
	form_date_field_type_file_ctime: string;
	form_date_field_type_file_mtime: string;
	form_date_field_type_file_specific_page_property: string;
	form_date_field_type_file_specific_task_property: string;

	form_date_field_placeholder: string;
	form_date_field_format: string;
	form_date_field_format_sample: string;
	form_date_field_format_description: string;
	form_date_field_format_placeholder: string;

	form_date_field_format_type_smart: string;

	form_date_field_format_type_manual: string;
	form_count_field_count_field_label: string;

	form_count_field_count_field_input_placeholder: string;

	form_count_field_count_field_type_default: string;

	form_count_field_count_field_type_page_prop: string;

	form_count_field_count_field_type_task_prop: string;
	form_exclude_folders: string;
	form_exclude_folders_placeholder: string;
	form_exclude_folders_description: string;
	form_title_font_size_label: string;
	form_number_input_min_warning: string;
	form_number_input_max_warning: string;
	form_fill_the_screen_label: string;
	form_main_container_bg_color: string;
	form_enable_main_container_shadow: string;
	form_show_cell_indicators: string;
	form_cell_shape: string;
	form_cell_shape_circle: string;
	form_cell_shape_square: string;
	form_cell_shape_rounded: string;
	form_cell_min_height: string;
	form_cell_min_width: string;

	form_datasource_type_page: string;
	form_datasource_type_all_task: string;
	form_datasource_type_task_in_specific_page: string;

	form_theme: string;
	form_theme_placeholder: string;
	form_theme_default: string;
	form_theme_ocean: string;
	form_theme_halloween: string;
	form_theme_lovely: string;
	form_theme_wine: string;
	form_cell_style_rules: string;

	form_button_preview: string;
	form_button_save: string;

	notice_open_markdown_first: string;
	notice_no_active_markdown_file: string;
	notice_heatmap_no_markdown_view: string;
	notice_heatmap_editor_unsupported: string;

	/**
	 * weekday
	 */
	weekday_sunday: string;
	weekday_monday: string;
	weekday_tuesday: string;
	weekday_wednesday: string;
	weekday_thursday: string;
	weekday_friday: string;
	weekday_saturday: string;

	/**
	 * graph text
	 */
	you_have_no_contributions_on: string;
	you_have_contributed_to: string;
	click_to_load_more: string;

	/**
	 * calendar
	 */
	calendar_display_name: string;
	calendar_modal_title_daily: string;
	calendar_modal_message_daily: string;
	calendar_btn_create: string;
	calendar_btn_cancel: string;
	calendar_notice_create_daily_failed: string;
	calendar_menu_open: string;
	calendar_menu_open_in_new_pane: string;
	calendar_menu_delete: string;
	calendar_menu_create_daily: string;

	/**
	 * settings - calendar
	 */
	settings_cal_enable: string;
	settings_cal_enableDesc: string;
	settings_cal_position: string;
	settings_cal_positionDesc: string;
	settings_cal_left: string;
	settings_cal_right: string;
	settings_cal_confirmCreate: string;
	settings_cal_confirmCreateDesc: string;
	settings_cal_wordsPerDot: string;
	settings_cal_wordsPerDotDesc: string;
	settings_cal_weekStart: string;
	settings_cal_weekStartDesc: string;
	settings_cal_localeDefault: string;
	settings_cal_highlightToday: string;
	settings_cal_highlightTodayDesc: string;

	/**
	 * settings - force view mode
	 */
	settings_forceView_enable: string;
	settings_forceView_enableDesc: string;
	settings_forceView_descPart1: string;
	settings_forceView_descPart2: string;
	settings_forceView_descPart3: string;
	settings_forceView_descPart4: string;
	settings_forceView_descPart5: string;
	settings_forceView_descPart6: string;
	settings_forceView_descPart7: string;
	settings_forceView_descPart8: string;
	settings_forceView_ignoreOpenedFiles: string;
	settings_forceView_ignoreOpenedFilesDesc: string;
	settings_forceView_ignoreForceView: string;
	settings_forceView_ignoreForceViewDesc: string;
	settings_forceView_debounceTimeout: string;
	settings_forceView_debounceTimeoutDesc: string;
	settings_forceView_foldersHeader: string;
	settings_forceView_foldersDesc1: string;
	settings_forceView_foldersDesc2: string;
	settings_forceView_foldersDesc3: string;
	settings_forceView_addNewFolder: string;
	settings_forceView_addAnotherFolder: string;
	settings_forceView_folderPlaceholder: string;
	settings_forceView_delete: string;
	settings_forceView_filesHeader: string;
	settings_forceView_filesDesc1: string;
	settings_forceView_filesDesc2: string;
	settings_forceView_filesDesc3: string;
	settings_forceView_filesDesc4: string;
	settings_forceView_addNewFile: string;
	settings_forceView_addAnotherFile: string;
	settings_forceView_filePlaceholder: string;

	/**
	 * settings - cursor position
	 */
	settings_cursor_enable: string;
	settings_cursor_enableDesc: string;
	settings_cursor_delayAfterOpening: string;
	settings_cursor_delayAfterOpeningDesc: string;
	settings_cursor_delayBetweenSaving: string;
	settings_cursor_delayBetweenSavingDesc: string;

	/**
	 * settings - navigation
	 */
	settings_nav_calendar: string;
	settings_nav_forceView: string;
	settings_nav_cursorPosition: string;

	/**
	 * commands
	 */
	notice_command_not_found: string;

	/**
	 * navbar
	 */
	navbar_builder_heading: string;
	navbar_align_label: string;
	navbar_align_desc: string;
	navbar_align_center: string;
	navbar_align_justify: string;
	navbar_items_heading: string;
	navbar_add_item: string;
	navbar_item_label: string;
	navbar_item_icon_label: string;
	navbar_item_icon_desc: string;
	navbar_item_url_label: string;
	navbar_item_url_desc: string;
	navbar_item_action_label: string;
	navbar_item_action_desc: string;
	navbar_item_select_command: string;
	navbar_item_select_icon: string;
	navbar_error_empty: string;
	navbar_error_invalid_yaml: string;
	navbar_error_no_items: string;
	navbar_error_yaml_failed: string;
	navbar_command_new: string;
	heatmap_command_new: string;
	navbar_default_title: string;
	navbar_desktop_gap_label: string;
	navbar_desktop_gap_desc: string;
	navbar_mobile_gap_label: string;
	navbar_mobile_gap_desc: string;
	navbar_desktop_row_gap_label: string;
	navbar_desktop_row_gap_desc: string;
	navbar_mobile_row_gap_label: string;
	navbar_mobile_row_gap_desc: string;

	// ✅ 通用按钮文本
	cancel: string;
	confirm: string;

	/**
	 * dashboard
	 */
	dashboard_display_name: string;
	dashboard_banner_subtitle: string;
	dashboard_refresh: string;
	dashboard_heatmaps_section: string;
	dashboard_heatmaps_empty: string;
	dashboard_navbars_section: string;
	dashboard_navbars_empty: string;
	dashboard_calendar_open: string;
	dashboard_new_heatmap: string;
	dashboard_new_navbar: string;
	dashboard_loading: string;
	dashboard_recent_updates: string;
	dashboard_col_file: string;
	dashboard_col_modified: string;
	dashboard_col_folder: string;
	dashboard_no_recent_files: string;
	dashboard_quick_actions: string;
	dashboard_calendar_section: string;
	dashboard_open_settings: string;
	dashboard_add_module: string;
	dashboard_add_module_placeholder: string;
	dashboard_remove_module: string;
	dashboard_no_modules: string;
	dashboard_module_settings: string;
	navbar_source_type: string;
	navbar_source_first: string;
	navbar_source_specific_file: string;
	navbar_source_file: string;
	navbar_source_file_placeholder: string;
}
