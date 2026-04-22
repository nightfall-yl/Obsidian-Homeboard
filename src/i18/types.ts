
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

	homeboard_builder_heading: string;
	homeboard_tab_basic: string;
	homeboard_tab_cards: string;
	homeboard_block_id: string;
	homeboard_block_id_desc: string;
	homeboard_title_font_size_placeholder: string;
	homeboard_columns: string;
	homeboard_gap: string;
	homeboard_gap_desc: string;
	homeboard_cards: string;
	homeboard_add_card: string;
	homeboard_add_card_desc: string;
	homeboard_add_button: string;
	homeboard_type: string;
	homeboard_type_desc: string;
	homeboard_palette: string;
	homeboard_palette_desc: string;
	homeboard_palette_custom: string;
	homeboard_palette_sage: string;
	homeboard_palette_mist: string;
	homeboard_palette_amber: string;
	homeboard_palette_plum: string;
	homeboard_palette_slate: string;
	homeboard_background: string;
	homeboard_background_desc: string;
	homeboard_accent_colors: string;
	homeboard_accent_colors_desc: string;
	homeboard_column_span: string;
	homeboard_column_span_desc: string;
	homeboard_links: string;
	homeboard_links_desc: string;
	homeboard_move_up: string;
	homeboard_move_down: string;
	homeboard_remove: string;
	homeboard_card_label: string;
	homeboard_default_title: string;
	homeboard_default_card_title: string;
	homeboard_menu_title: string;
	homeboard_insert_command: string;
	homeboard_builder_command: string;
	homeboard_edit_command: string;
	homeboard_menu_insert: string;
	elementCard_builder_heading: string;
	elementCard_tab_basic: string;
	elementCard_tab_cards: string;
	elementCard_block_id: string;
	elementCard_block_id_desc: string;
	elementCard_title_font_size_placeholder: string;
	elementCard_columns: string;
	elementCard_gap: string;
	elementCard_gap_desc: string;
	elementCard_cards: string;
	elementCard_add_card: string;
	elementCard_add_card_desc: string;
	elementCard_add_button: string;
	elementCard_type: string;
	elementCard_type_desc: string;
	elementCard_palette: string;
	elementCard_palette_desc: string;
	elementCard_palette_custom: string;
	elementCard_palette_sage: string;
	elementCard_palette_mist: string;
	elementCard_palette_amber: string;
	elementCard_palette_plum: string;
	elementCard_palette_slate: string;
	elementCard_background: string;
	elementCard_background_desc: string;
	elementCard_accent_colors: string;
	elementCard_accent_colors_desc: string;
	elementCard_column_span: string;
	elementCard_column_span_desc: string;
	elementCard_links: string;
	elementCard_links_desc: string;
	elementCard_move_up: string;
	elementCard_move_down: string;
	elementCard_remove: string;
	elementCard_card_label: string;
	elementCard_default_title: string;
	elementCard_default_card_title: string;
	elementCard_menu_title: string;
	elementCard_insert_command: string;
	elementCard_builder_command: string;
	elementCard_edit_command: string;
	elementCard_menu_insert: string;
	notice_open_markdown_first: string;
	notice_homeboard_update_failed: string;
	notice_homeboard_parse_failed: string;
	notice_homeboard_cursor_required: string;
	notice_elementCard_update_failed: string;
	notice_elementCard_parse_failed: string;
	notice_elementCard_cursor_required: string;
	notice_no_active_markdown_file: string;
	notice_heatmap_no_markdown_view: string;
	notice_heatmap_editor_unsupported: string;
	homeboard_error_empty: string;
	homeboard_error_empty_recommend: string;
	homeboard_error_invalid_yaml_object: string;
	homeboard_error_card_required: string;
	homeboard_error_card_required_recommend: string;
	homeboard_error_yaml_failed_at_line: string;
	homeboard_error_yaml_failed: string;
	elementCard_error_empty: string;
	elementCard_error_empty_recommend: string;
	elementCard_error_invalid_yaml_object: string;
	elementCard_error_card_required: string;
	elementCard_error_card_required_recommend: string;
	elementCard_error_yaml_failed_at_line: string;
	elementCard_error_yaml_failed: string;

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
}
