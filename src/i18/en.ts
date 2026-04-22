import { Local } from "./types";

export class En implements Local {
    language_label = "Language";
    language_desc = "Display language used in the config panels.";
    language_zh = "Chinese";
    language_en = "English";
    default = "default";
	click_to_reset = "click to reset";

    /**
     * context menu
     */
    context_menu_create = "Add Heatmap";

    /**
     * form
     */
    form_basic_settings = "Basic Settings";
    form_style_settings = "Style Settings";
    form_about = "About";
    form_contact_me = "Contact me";
    form_project_url = "Project";
    form_sponsor = "Sponsor";
    form_title = "Title";
    form_title_placeholder = "Input title";
    form_title_align_label = "Alignment";
    form_graph_type = "Graph Type";
    form_graph_type_git = "Git Style";
    form_graph_type_month_track = "Month Track";
    form_graph_type_calendar = "Calendar";
    form_date_range = "Date Range";
    form_date_range_latest_days = "Latest Days";
    form_date_range_latest_month = "Latest Whole Month";
    form_date_range_latest_year = "Latest Whole Year";
    form_date_range_input_placeholder = "Input number here";
    form_date_range_fixed_date = "Fixed Date";
    form_date_range_start_date = "Start Date";

    form_start_of_week = "Start of Week";
    form_data_source_value = "Source";
    form_data_source_filter_label = "Filter";

    form_datasource_filter_type_none = "None";
    form_datasource_filter_type_status_is = "Status Is";
    form_datasource_filter_type_contains_any_tag = "Contains Any Tag";
	form_datasource_filter_type_status_in = "Status In";

    form_datasource_filter_task_none = "None";
    form_datasource_filter_task_status_completed = "Completed";
    form_datasource_filter_task_status_fully_completed = "Fully completed";
    form_datasource_filter_task_status_any = "Any Status";
    form_datasource_filter_task_status_incomplete = "Incomplete";
	form_datasource_filter_task_status_canceled = "Canceled";
    form_datasource_filter_contains_tag = "Contains Any Tag";
    form_datasource_filter_contains_tag_input_placeholder = "Please input tag, such as #todo";
    form_datasource_filter_customize = "Customize";

    form_query_placeholder = ' such as #tag or "folder"';

    form_date_field = "Date Field";
    form_date_field_type_file_name = "File Name";
    form_date_field_type_file_ctime = "File Create Time";
    form_date_field_type_file_mtime = "File Modify Time";
    form_date_field_type_file_specific_page_property = "Specific Page Property";
    form_date_field_type_file_specific_task_property = "Specific Task Property";

    form_date_field_placeholder = "default is file's create time";

    form_date_field_format = "Date Field Format";
    form_date_field_format_sample = "Sample";
    form_date_field_format_description =
        "If your date property value is not a standard format, you need to specify this field so that the system knows how to recognize your date format";
    form_date_field_format_placeholder = "such as yyyy-MM-dd HH:mm:ss";

    form_date_field_format_type_smart = "Auto Detect";

    form_date_field_format_type_manual = "Specify Format";

    form_count_field_count_field_label = "Count Field";

    form_count_field_count_field_input_placeholder = "Please input property name";

    form_count_field_count_field_type_default = "Default";

    form_count_field_count_field_type_page_prop = "Page Property";

    form_count_field_count_field_type_task_prop = "Task Property";
    form_title_font_size_label = "Title font Size";
    form_number_input_min_warning = "allow min value is {value}";
    form_number_input_max_warning = "allow max value is {value}";
    form_fill_the_screen_label = "Fill The Screen";
    form_main_container_bg_color = "Background Color";
    form_enable_main_container_shadow = "Enable Shadow";
    form_show_cell_indicators = "Show Cell Indicators";
    form_cell_shape = "Cell Shape";
    form_cell_shape_circle = "Circle";
    form_cell_shape_square = "Square";
    form_cell_shape_rounded = "Rounded";
    form_cell_min_height = "Min Height";
    form_cell_min_width = "Min Width";

    form_datasource_type_page = "Page";
    form_datasource_type_all_task = "All Task";
    form_datasource_type_task_in_specific_page = "Task in Specific Page";

    form_theme = "Theme";
    form_theme_placeholder = "Select theme or customize style";
    form_theme_default = "Default";
    form_theme_ocean = "Ocean";
    form_theme_halloween = "Halloween";
    form_theme_lovely = "Lovely";
    form_theme_wine = "Wine";
    form_cell_style_rules = "Cell Style Rules";

    form_button_preview = "Preview";
    form_button_save = "Save";
    homeboard_builder_heading = "Style Config";
	homeboard_tab_basic = "Basic Settings";
	homeboard_tab_cards = "Card Settings";
	homeboard_block_id = "Block ID";
	homeboard_block_id_desc = "Used to store resized column widths. Keep it unique and stable.";
	homeboard_title_font_size_placeholder = "Title size";
	homeboard_columns = "Columns";
	homeboard_gap = "Gap";
	homeboard_gap_desc = "Pixel gap between cards";
	homeboard_cards = "Cards";
	homeboard_add_card = "Add card";
	homeboard_add_card_desc = "Add a new Links card";
	homeboard_add_button = "Add";
	homeboard_type = "Type";
	homeboard_type_desc = "Only Links is supported now";
	homeboard_palette = "Palette";
	homeboard_palette_desc = "Choose a built-in color palette";
	homeboard_palette_custom = "Custom palette";
	homeboard_palette_sage = "Sage Dawn";
	homeboard_palette_mist = "Mist Blue";
	homeboard_palette_amber = "Amber Rice";
	homeboard_palette_plum = "Plum Dusk";
	homeboard_palette_slate = "Slate Gray";
	homeboard_background = "Background";
	homeboard_background_desc = "Background color for this card";
	homeboard_accent_colors = "Accent colors";
	homeboard_accent_colors_desc = "Controls title, links, and separators";
	homeboard_column_span = "Column / Span";
	homeboard_column_span_desc = "Column starts from 1; span means how many columns to cross";
	homeboard_links = "Links";
	homeboard_links_desc = "One per line, format: Title | Note path or Obsidian link";
	homeboard_move_up = "Move up";
	homeboard_move_down = "Move down";
	homeboard_remove = "Remove";
	homeboard_card_label = "Card";
	homeboard_default_title = "Home";
	homeboard_default_card_title = "Links";
	homeboard_menu_title = "Add Elements Component";
	homeboard_insert_command = "Insert Elements (homeboard) block";
	homeboard_builder_command = "Open Elements Builder";
	homeboard_edit_command = "Edit Elements (homeboard) block at cursor";
	homeboard_menu_insert = "Add Card";
	elementCard_builder_heading = "Style Config";
	elementCard_tab_basic = "Basic Settings";
	elementCard_tab_cards = "Card Settings";
	elementCard_block_id = "Block ID";
	elementCard_block_id_desc = "Used to store resized column widths. Keep it unique and stable.";
	elementCard_title_font_size_placeholder = "Title size";
	elementCard_columns = "Columns";
	elementCard_gap = "Gap";
	elementCard_gap_desc = "Pixel gap between cards";
	elementCard_cards = "Cards";
	elementCard_add_card = "Add card";
	elementCard_add_card_desc = "Add a new Links card";
	elementCard_add_button = "Add";
	elementCard_type = "Type";
	elementCard_type_desc = "Only Links is supported now";
	elementCard_palette = "Palette";
	elementCard_palette_desc = "Choose a built-in color palette";
	elementCard_palette_custom = "Custom palette";
	elementCard_palette_sage = "Sage Dawn";
	elementCard_palette_mist = "Mist Blue";
	elementCard_palette_amber = "Amber Rice";
	elementCard_palette_plum = "Plum Dusk";
	elementCard_palette_slate = "Slate Gray";
	elementCard_background = "Background";
	elementCard_background_desc = "Background color for this card";
	elementCard_accent_colors = "Accent colors";
	elementCard_accent_colors_desc = "Controls title, links, and separators";
	elementCard_column_span = "Column / Span";
	elementCard_column_span_desc = "Column starts from 1; span means how many columns to cross";
	elementCard_links = "Links";
	elementCard_links_desc = "One per line, format: Title | Note path or Obsidian link";
	elementCard_move_up = "Move up";
	elementCard_move_down = "Move down";
	elementCard_remove = "Remove";
	elementCard_card_label = "Card";
	elementCard_default_title = "Home";
	elementCard_default_card_title = "Links";
	elementCard_menu_title = "Add Elements Component";
	elementCard_insert_command = "Insert Elements (elementCard) block";
	elementCard_builder_command = "Open Elements Builder";
	elementCard_edit_command = "Edit Elements (elementCard) block at cursor";
	elementCard_menu_insert = "Add Card";
	notice_open_markdown_first = "Please open a Markdown note first.";
	notice_homeboard_update_failed = "Failed to update current Elements (homeboard) block.";
	notice_homeboard_parse_failed = "Failed to parse current Elements (homeboard) block.";
	notice_homeboard_cursor_required = "Place the cursor inside a Elements (homeboard) code block first.";
	notice_elementCard_update_failed = "Failed to update current Elements (elementCard) block.";
	notice_elementCard_parse_failed = "Failed to parse current Elements (elementCard) block.";
	notice_elementCard_cursor_required = "Place the cursor inside a Elements (elementCard) code block first.";
	notice_no_active_markdown_file = "No active markdown file.";
	notice_heatmap_no_markdown_view = "No markdown view is active.";
	notice_heatmap_editor_unsupported = "Current editor does not support in-place heatmap editing.";
	homeboard_error_empty = "Elements (homeboard) config is empty";
	homeboard_error_empty_recommend = "Please add cards first";
	homeboard_error_invalid_yaml_object = "Elements (homeboard) config is not a valid YAML object";
	homeboard_error_card_required = "Elements (homeboard) requires at least one card";
	homeboard_error_card_required_recommend = "Please add a links card in cards";
	homeboard_error_yaml_failed_at_line = "Elements (homeboard) YAML parse failed near line {line}";
	homeboard_error_yaml_failed = "Elements (homeboard) YAML parse failed, please check indentation and field format";
	elementCard_error_empty = "Elements (elementCard) config is empty";
	elementCard_error_empty_recommend = "Please add cards first";
	elementCard_error_invalid_yaml_object = "Elements (elementCard) config is not a valid YAML object";
	elementCard_error_card_required = "Elements (elementCard) requires at least one card";
	elementCard_error_card_required_recommend = "Please add a links card in cards";
	elementCard_error_yaml_failed_at_line = "Elements (elementCard) YAML parse failed near line {line}";
	elementCard_error_yaml_failed = "Elements (elementCard) YAML parse failed, please check indentation and field format";

    /**
     * weekday
     */
    weekday_sunday = "Sunday";
    weekday_monday = "Monday";
    weekday_tuesday = "Tuesday";
    weekday_wednesday = "Wednesday";
    weekday_thursday = "Thursday";
    weekday_friday = "Friday";
    weekday_saturday = "Saturday";

    /**
     * graph text
     */
    you_have_no_contributions_on = "No contributions on {date}";
    you_have_contributed_to = "{value} contributions on {date}";
    click_to_load_more = "Click to load more...";
}
