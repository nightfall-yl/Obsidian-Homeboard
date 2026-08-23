import type { Local } from "./types";

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
    context_menu_create = "New Heatmap";
    context_menu_insert_navbar = "New NavBar";
    elements_menu_title = "Add Elements Component";

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

	form_exclude_folders = "Exclude Folders";
	form_exclude_folders_placeholder = "e.g.: templates/, Archive/, comma separated";
	form_exclude_folders_description = "Notes in these folders will be excluded from heatmap statistics";

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

	notice_open_markdown_first = "Please open a Markdown note first.";
	notice_no_active_markdown_file = "No active markdown file.";
	notice_heatmap_no_markdown_view = "No markdown view is active.";
	notice_heatmap_editor_unsupported = "Current editor does not support in-place heatmap editing.";

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

    /**
     * calendar
     */
    calendar_display_name = "Elements Calendar";
    calendar_modal_title_daily = "New Daily Note";
    calendar_modal_message_daily = "The file {date} does not exist. Would you like to create it?";
    calendar_btn_create = "Create";
    calendar_btn_cancel = "Cancel";
    calendar_notice_create_daily_failed = "Failed to create daily note";
    calendar_menu_open = "Open";
    calendar_menu_open_in_new_pane = "Open in new pane";
    calendar_menu_delete = "Delete";
	calendar_menu_create_daily = "Create daily note";

	settings_cal_enable = "Enable Calendar";
	settings_cal_enableDesc = "Show calendar view in sidebar";
	settings_cal_position = "Calendar position";
	settings_cal_positionDesc = "Choose which sidebar to display the calendar";
	settings_cal_left = "Left sidebar";
	settings_cal_right = "Right sidebar";
	settings_cal_confirmCreate = "Confirm before creating";
	settings_cal_confirmCreateDesc = "Show a confirmation modal before creating a new note";
	settings_cal_wordsPerDot = "Words per dot";
	settings_cal_wordsPerDotDesc = "How many words should be represented by a single dot?";
	settings_cal_weekStart = "Start week on";
	settings_cal_weekStartDesc = "Choose what day of the week to start";
	settings_cal_localeDefault = "Locale default";
	settings_cal_highlightToday = "Highlight today";
	settings_cal_highlightTodayDesc = "Highlight today's date with a background color and bold text";

	settings_forceView_enable = "Enable Force View Mode";
	settings_forceView_enableDesc = "Automatically set view mode based on frontmatter or folder/file rules";
	settings_forceView_descPart1 = "You can change view mode by setting ";
	settings_forceView_descPart2 = ", whose value can be either ";
	settings_forceView_descPart3 = " or ";
	settings_forceView_descPart4 = ".";
	settings_forceView_descPart5 = "You can change edit mode by setting ";
	settings_forceView_descPart6 = ", whose value can be either ";
	settings_forceView_descPart7 = " or ";
	settings_forceView_descPart8 = ".";
	settings_forceView_ignoreOpenedFiles = "Ignore opened files";
	settings_forceView_ignoreOpenedFilesDesc = "Don't change the view mode of already opened notes.";
	settings_forceView_ignoreForceView = "Ignore force view when not specified in frontmatter";
	settings_forceView_ignoreForceViewDesc = "Don't change the view mode of notes opened from other views.";
	settings_forceView_debounceTimeout = "Debounce timeout (ms)";
	settings_forceView_debounceTimeoutDesc = 'Debounce timeout is the time (in milliseconds) before setting the view mode. Set it to "0" to disable debounce (default value is "300"). If you encounter issues, try increasing this value.';
	settings_forceView_foldersHeader = "Folders";
	settings_forceView_foldersDesc1 = "Set a view mode for notes in specific folders.";
	settings_forceView_foldersDesc2 = "Note: This will force all notes in that folder to use the specified view mode, even if they have a different view mode set in their frontmatter.";
	settings_forceView_foldersDesc3 = "Priority increases from bottom to top (bottom-most has highest priority), so if you specify subfolders make sure they are below their parent folders.";
	settings_forceView_addNewFolder = "Add new folder";
	settings_forceView_addAnotherFolder = "Add another folder to list";
	settings_forceView_folderPlaceholder = "Example: folder1/templates";
	settings_forceView_delete = "Delete";
	settings_forceView_filesHeader = "Files";
	settings_forceView_filesDesc1 = 'Set a view mode for files matching a pattern (regex; example " - All$" for all notes ending with " - All" or "1900-01" for all daily notes starting with "1900-01").';
	settings_forceView_filesDesc2 = "Note: This will force using the specified view mode, even if it has a different view mode set in its frontmatter.";
	settings_forceView_filesDesc3 = "Priority increases from bottom to top (bottom-most has highest priority).";
	settings_forceView_filesDesc4 = "Note that file patterns will override folder settings for the same file.";
	settings_forceView_addNewFile = "Add new file";
	settings_forceView_addAnotherFile = "Add another file to list";
	settings_forceView_filePlaceholder = 'Example: " - All$" or "1900-01"';

	settings_cursor_enable = "Enable";
	settings_cursor_enableDesc = "Remember cursor position and scroll state for each file";
	settings_cursor_delayAfterOpening = "Delay after opening new note";
	settings_cursor_delayAfterOpeningDesc = "If you use links pointing to headings inside notes (like [link](note.md#heading)), this plugin should not scroll. Increase delay if you experience this. Set to zero if you don't use links pointing to sections within pages (move slider to the left). Range: 0-300 ms (default 100 ms).";
	settings_cursor_delayBetweenSaving = "Interval between saving cursor position to file";
	settings_cursor_delayBetweenSavingDesc = "For multi-device users. Shorten if you don't want to wait until Obsidian closes to save positions.";

	settings_nav_calendar = "Calendar";
	settings_nav_forceView = "Force View";
	settings_nav_cursorPosition = "Cursor Position";

	notice_command_not_found = "Command '{0}' not found";

	/**
	 * navbar
	 */
	navbar_builder_heading = "NavBar Configuration";
	navbar_align_label = "Alignment";
	navbar_align_desc = "How navigation items are arranged";
	navbar_align_center = "Center";
	navbar_align_justify = "Justify";
	navbar_items_heading = "Navigation Items";
	navbar_add_item = "Add Item";
	navbar_item_label = "Label";
	navbar_item_icon_label = "Icon";
	navbar_item_icon_desc = "Lucide icon name";
	navbar_item_url_label = "URL";
	navbar_item_url_desc = "Internal note path or external URL";
	navbar_item_action_label = "Action";
	navbar_item_action_desc = "Obsidian command ID";
	navbar_item_select_command = "Select";
	navbar_item_select_icon = "Pick icon";
	navbar_error_empty = "navbar config is empty";
	navbar_error_invalid_yaml = "navbar config is not a valid YAML object";
	navbar_error_no_items = "navbar requires at least one navigation item";
	navbar_error_yaml_failed = "navbar YAML parsing failed, check indentation and field format";
	navbar_command_new = "New NavBar";
	heatmap_command_new = "New Heatmap";
	navbar_default_title = "Navigation";
	navbar_desktop_gap_label = "Desktop horizontal gap";
	navbar_desktop_gap_desc = "Horizontal gap between nav items (desktop)";
	navbar_mobile_gap_label = "Mobile horizontal gap";
	navbar_mobile_gap_desc = "Horizontal gap between nav items (mobile)";
	navbar_desktop_row_gap_label = "Desktop row gap";
	navbar_desktop_row_gap_desc = "Vertical gap between wrapped rows (desktop)";
	navbar_mobile_row_gap_label = "Mobile row gap";
	navbar_mobile_row_gap_desc = "Vertical gap between wrapped rows (mobile)";

	// ✅ 通用按钮文本
	cancel = "Cancel";
	confirm = "OK";

	/**
	 * dashboard
	 */
	dashboard_display_name = "Elements Dashboard";
	dashboard_banner_subtitle = "Your personal command center";
	dashboard_refresh = "Refresh";
	dashboard_heatmaps_section = "Heatmaps";
	dashboard_heatmaps_empty = "No heatmaps found in vault";
	dashboard_navbars_section = "Navbars";
	dashboard_navbars_empty = "No navbars found in vault";
	dashboard_calendar_open = "Open Calendar";
	dashboard_new_heatmap = "New Heatmap";
	dashboard_new_navbar = "New Navbar";
	dashboard_loading = "Loading...";
	dashboard_recent_updates = "Recent Updates";
	dashboard_col_file = "File";
	dashboard_col_modified = "Modified";
	dashboard_col_folder = "Folder";
	dashboard_no_recent_files = "No recent files";
	dashboard_quick_actions = "Quick Actions";
	dashboard_calendar_section = "Calendar";
	dashboard_open_settings = "Settings";
	dashboard_add_module = "Add Module";
	dashboard_add_module_placeholder = "Search modules to add...";
	dashboard_remove_module = "Remove Module";
	dashboard_no_modules = "No modules yet. Click above to add one.";
	dashboard_module_settings = "Module Settings";
	navbar_source_type = "Source Type";
	navbar_source_first = "Auto Scan (use first found)";
	navbar_source_specific_file = "Specific File";
	navbar_source_file = "File Path";
	navbar_source_file_placeholder = "e.g.: folder/filename";
}
