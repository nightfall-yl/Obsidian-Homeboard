import { Local } from "./types";

export class Zh implements Local {
	language_label = "语言";
	language_desc = "设置页面显示语言。";
	language_zh = "简体中文";
	language_en = "English";
	default = "默认";
	click_to_reset = "点击重置";
    /**
     * context menu
     */
    context_menu_create = "新建热力图";

    /**
     * form
     */
    form_basic_settings = "基础设置";
    form_style_settings = "样式设置";
    form_about = "关于";
    form_contact_me = "联系我";
	form_project_url = "项目地址";
	form_sponsor = "赞助";
    form_title = "标题";
    form_title_placeholder = "输入标题";
    form_title_align_label = "对齐方式";
    form_graph_type = "图表类型";
    form_graph_type_git = "Git 视图";
    form_graph_type_month_track = "月追踪视图";
    form_graph_type_calendar = "日历视图";
    form_date_range = "日期范围";
    form_date_range_latest_days = "最近几天";
    form_date_range_latest_month = "最近几个整月";
	form_date_range_latest_year = "最近几个整年";
    form_date_range_input_placeholder = "在这里输入数值";
    form_date_range_fixed_date = "固定日期";
    form_date_range_start_date = "开始日期";

    form_start_of_week = "每周开始于";
    form_data_source_value = "来源";
    form_data_source_filter_label = "筛选";

    form_datasource_filter_type_none = "无";
    form_datasource_filter_type_status_is = "状态等于";
    form_datasource_filter_type_contains_any_tag = "包含任意标签";
    form_datasource_filter_type_status_in = "包含任意一个状态";

    form_datasource_filter_task_none = "无";
    form_datasource_filter_task_status_completed = "已完成（不包含子任务）";
    form_datasource_filter_task_status_fully_completed = "已完成（包含子任务）";
	form_datasource_filter_task_status_canceled = "已取消";
    form_datasource_filter_task_status_any = "任意状态";
    form_datasource_filter_task_status_incomplete = "未完成";
    form_datasource_filter_contains_tag = "包含任意一个标签";
    form_datasource_filter_contains_tag_input_placeholder = "请输入标签，比如 #todo";
    form_datasource_filter_customize = "自定义";

    form_query_placeholder = '比如 #tag 或 "folder"';

    form_date_field = "日期字段";
    form_date_field_type_file_name = "文件名称";
    form_date_field_type_file_ctime = "文件创建日期";
    form_date_field_type_file_mtime = "文件修改日期";
    form_date_field_type_file_specific_page_property = "指定文档属性";
    form_date_field_type_file_specific_task_property = "指定任务属性";

    form_date_field_placeholder = "默认为文件的创建日期";

    form_date_field_format = "日期格式";
    form_date_field_format_sample = "示例值";
    form_date_field_format_description = "如果你的日期属性值不是标准的格式，需要指定该字段让系统知道如何识别你的日期格式";
    form_date_field_format_placeholder = "比如 yyyy-MM-dd HH:mm:ss";

    form_date_field_format_type_smart = "自动识别";

    form_date_field_format_type_manual = "指定格式";

    form_count_field_count_field_label = "打分属性";

    form_count_field_count_field_input_placeholder = "请输入属性名称";

	form_exclude_folders = "排除文件夹";
	form_exclude_folders_placeholder = "如: templates/, Archive/, 多个用逗号分隔";
	form_exclude_folders_description = "这些文件夹中的笔记将不参与热力图数据统计";

    form_count_field_count_field_type_default = "默认";

    form_count_field_count_field_type_page_prop = "文档属性";

    form_count_field_count_field_type_task_prop = "任务属性";
    form_title_font_size_label = "标题字体大小";
    form_number_input_min_warning = "允许的最小值为 {value}";
	form_number_input_max_warning = "允许的最大值为 {value}";
    form_fill_the_screen_label = "充满屏幕";
    form_main_container_bg_color = "背景颜色";
	form_enable_main_container_shadow = "启用阴影";
    form_show_cell_indicators = "显示单元格指示器";
    form_cell_shape = "单元格形状";
    form_cell_shape_circle = "圆形";
    form_cell_shape_square = "方块";
    form_cell_shape_rounded = "圆角";
    form_cell_min_height = "单元格最小高度";
	form_cell_min_width = "单元格最小宽度";

    form_datasource_type_page = "文档";
    form_datasource_type_all_task = "所有任务";
    form_datasource_type_task_in_specific_page = "指定文档中的任务";

    form_theme = "主题";
    form_theme_placeholder = "选择主题或自定义样式";
    form_theme_default = "默认";
    form_theme_ocean = "海洋蓝";
    form_theme_halloween = "琥珀暖橙";
    form_theme_lovely = "樱粉柔雾";
    form_theme_wine = "梅酒红";
    form_cell_style_rules = "单元格样式规则";

    form_button_preview = "预览";
    form_button_save = "保存";

	notice_open_markdown_first = "请先打开一个 Markdown 笔记。";
	notice_no_active_markdown_file = "当前没有激活的 Markdown 文件。";
	notice_heatmap_no_markdown_view = "当前没有激活的 Markdown 视图。";
	notice_heatmap_editor_unsupported = "当前编辑器不支持就地编辑热力图。";

    /**
     * weekday
     */
    weekday_sunday = "周日";
    weekday_monday = "周一";
    weekday_tuesday = "周二";
    weekday_wednesday = "周三";
    weekday_thursday = "周四";
    weekday_friday = "周五";
    weekday_saturday = "周六";

    /**
     * graph text
     */
    you_have_no_contributions_on = "你在 {date} 没有任何贡献";
    you_have_contributed_to = "你在 {date} 有 {value} 次贡献";
    click_to_load_more = "点击加载更多......";

    /**
     * calendar
     */
    calendar_display_name = "日历";
    calendar_modal_title_daily = "新建日记";
    calendar_modal_message_daily = "文件 {date} 不存在。是否要创建它？";
    calendar_btn_create = "创建";
    calendar_btn_cancel = "取消";
    calendar_notice_create_daily_failed = "创建日记失败";
    calendar_menu_open = "打开";
    calendar_menu_open_in_new_pane = "在新面板中打开";
    calendar_menu_delete = "删除";
	calendar_menu_create_daily = "新建日记";

	settings_homepage_enable = "启用主页";
	settings_homepage_enableDesc = "开启主页功能，可在启动时自动打开指定笔记";
	settings_homepage_kind = "首页类型";
	settings_homepage_kindDesc = "选择主页类型：指定文件或每日日记";
	settings_homepage_kindFile = "指定文件";
	settings_homepage_kindDailyNote = "日记";
	settings_homepage_filePath = "文件路径";
	settings_homepage_filePathDesc = "输入主页文件的路径（不含 .md 后缀）";
	settings_homepage_dailyNoteFormat = "日记格式";
	settings_homepage_dailyNoteFormatDesc = "日记文件名格式（由日记插件设置决定）";
	settings_homepage_dailyNoteFormatValue = "使用日记插件设置";
	settings_homepage_openOnStartup = "启动时打开";
	settings_homepage_openOnStartupDesc = "Obsidian 启动时自动打开主页";
	settings_homepage_openMode = "打开方式";
	settings_homepage_openModeDescIntro = "选择打开主页时的行为。假设工作区当前开着 3 个标签：";
	settings_homepage_openModeDescExample = "笔记A / 笔记B / 笔记C";
	settings_homepage_openModeReplaceAll = "替换全部";
	settings_homepage_openModeReplaceAllDesc = "3 个标签全关，只剩主页";
	settings_homepage_openModeRetain = "保留";
	settings_homepage_openModeRetainDesc = "标签全保留，如果主页已在其中则跳转，否则不操作（除非当前是空标签）";
	settings_homepage_openModeReplaceLast = "替换最后一个";
	settings_homepage_openModeReplaceLastDesc = "变成 笔记A / 笔记B / 主页（笔记C 被替换）";
	settings_homepage_viewMode = "视图模式";
	settings_homepage_viewModeDesc = "打开主页时使用的视图模式";
	settings_homepage_viewModeDefault = "默认视图";
	settings_homepage_viewModeReading = "阅读视图";
	settings_homepage_viewModeSource = "编辑视图（源码模式）";
	settings_homepage_viewModeLivePreview = "编辑视图（实时预览）";
	settings_homepage_revertView = "离开后恢复视图";
	settings_homepage_revertViewDesc = "离开主页文件时恢复为默认视图模式";
	settings_homepage_openWhenEmpty = "空标签页时自动打开";
	settings_homepage_openWhenEmptyDesc = "当工作区只有空标签页时自动打开主页";
	settings_homepage_autoCreate = "自动创建文件";
	settings_homepage_autoCreateDesc = "当主页文件不存在时自动创建";

	settings_cal_enable = "启用日历";
	settings_cal_enableDesc = "在侧边栏显示日历视图";
	settings_cal_position = "日历位置";
	settings_cal_positionDesc = "选择日历显示在哪个侧边栏";
	settings_cal_left = "左侧边栏";
	settings_cal_right = "右侧边栏";
	settings_cal_confirmCreate = "创建前确认";
	settings_cal_confirmCreateDesc = "创建日记前是否需要确认";
	settings_cal_wordsPerDot = "每个圆点代表字数";
	settings_cal_wordsPerDotDesc = "日历中每个圆点代表的字数";
	settings_cal_weekStart = "星期起始日";
	settings_cal_weekStartDesc = "选择一周的起始日";
	settings_cal_localeDefault = "系统默认";
	settings_cal_highlightToday = "今日高亮";
	settings_cal_highlightTodayDesc = "用背景颜色和加粗文本高亮今天的日期";

	settings_forceView_enable = "启用强制视图模式";
	settings_forceView_enableDesc = "根据 frontmatter 或文件夹/文件规则自动设置视图模式";
	settings_forceView_descPart1 = "可以通过键 ";
	settings_forceView_descPart2 = " 来更改视图模式，其值可以是 ";
	settings_forceView_descPart3 = " 或 ";
	settings_forceView_descPart4 = "。";
	settings_forceView_descPart5 = "通过声明键 ";
	settings_forceView_descPart6 = " 来更改编辑模式；其值可以是 ";
	settings_forceView_descPart7 = " 或 ";
	settings_forceView_descPart8 = " 作为值。";
	settings_forceView_ignoreOpenedFiles = "忽略已打开的文件";
	settings_forceView_ignoreOpenedFilesDesc = "不要更改已打开笔记的视图模式。";
	settings_forceView_ignoreForceView = "未在 frontmatter 中指定时忽略强制视图";
	settings_forceView_ignoreForceViewDesc = "不要更改从其他视图模式中打开的笔记的视图模式。";
	settings_forceView_debounceTimeout = "防抖超时（毫秒）";
	settings_forceView_debounceTimeoutDesc = '防抖超时是指设置视图模式之前的等待时间（毫秒）。设为 "0" 可禁用防抖（默认值为 "300"）。如果遇到问题，请尝试增大此值。';
	settings_forceView_foldersHeader = "文件夹";
	settings_forceView_foldersDesc1 = "为指定文件夹中的笔记设定视图模式。";
	settings_forceView_foldersDesc2 = "注意：这将强制该文件夹中所有笔记使用指定的视图模式，即使笔记的 frontmatter 中设置了不同的视图模式。";
	settings_forceView_foldersDesc3 = "优先级从下到上递增（最下面的优先级最高），因此如果指定了子文件夹，请确保将其放在父文件夹下方。";
	settings_forceView_addNewFolder = "添加新文件夹";
	settings_forceView_addAnotherFolder = "添加另一个文件夹到列表";
	settings_forceView_folderPlaceholder = "示例：folder1/templates";
	settings_forceView_delete = "删除";
	settings_forceView_filesHeader = "文件";
	settings_forceView_filesDesc1 = '为匹配特定模式（正则表达式；example " - All$" for all notes ending with " - All" or "1900-01" for all daily notes starting with "1900-01"';
	settings_forceView_filesDesc2 = "注意：这将强制使用指定的视图模式，即使它 have a different view mode set in its frontmatter.";
	settings_forceView_filesDesc3 = "优先级从下到上递增（最下面的优先级最高）。";
	settings_forceView_filesDesc4 = "请注意，配置文件模式的配置将覆盖同一文件的文件夹配置。";
	settings_forceView_addNewFile = "添加新文件";
	settings_forceView_addAnotherFile = "添加另一个文件到列表";
	settings_forceView_filePlaceholder = '示例：" - All$" 或 "1900-01"';

	settings_cursor_enable = "启用记住光标位置";
	settings_cursor_enableDesc = "记住并恢复每个文件的光标位置和滚动位置";
	settings_cursor_dataFileName = "数据文件名";
	settings_cursor_dataFileNameDesc = "将位置信息保存到此文件";
	settings_cursor_dataFileNamePlaceholder = "例如：cursor.json";
	settings_cursor_delayAfterOpening = "打开新笔记后的延迟";
	settings_cursor_delayAfterOpeningDesc = "如果你使用了指向笔记标题的链接（如 [链接](笔记.md#标题)），本插件不应滚动页面。如果出现此问题，请增加延迟时间。如果你不使用指向页面内章节的链接，可将延迟设为零（滑块调至最左）。滑块范围：0-300 毫秒（默认值：100 毫秒）。";
	settings_cursor_delayBetweenSaving = "光标位置保存到文件的间隔";
	settings_cursor_delayBetweenSavingDesc = "适用于多设备用户。如果你不想等到关闭 Obsidian 才保存光标位置，可以缩短此间隔。";

	settings_nav_homepage = "主页";
	settings_nav_calendar = "日历";
	settings_nav_forceView = "强制视图";
	settings_nav_cursorPosition = "光标位置";

	notice_command_not_found = "未找到 {0} 命令";

	/**
	 * navbar
	 */
	navbar_builder_heading = "导航栏配置";
	navbar_align_label = "对齐方式";
	navbar_align_desc = "导航项排列";
	navbar_align_center = "居中";
	navbar_align_justify = "两端对齐";
	navbar_items_heading = "导航项";
	navbar_add_item = "添加导航项";
	navbar_item_label = "标签";
	navbar_item_icon_label = "图标";
	navbar_item_icon_desc = "Lucide 图标名称";
	navbar_item_url_label = "链接";
	navbar_item_url_desc = "内部笔记路径或外部 URL";
	navbar_item_action_label = "命令";
	navbar_item_action_desc = "Obsidian 命令 ID";
	navbar_item_select_command = "选择";
	navbar_item_select_icon = "选择图标";
	navbar_error_empty = "navbar 配置为空";
	navbar_error_invalid_yaml = "navbar 配置不是有效的 YAML 对象";
	navbar_error_no_items = "navbar 至少需要一个导航项";
	navbar_error_yaml_failed = "navbar YAML 解析失败，请检查缩进与字段格式";
	navbar_command_new = "New NavBar";
	navbar_default_title = "导航";
	navbar_desktop_gap_label = "桌面端水平间距";
	navbar_desktop_gap_desc = "导航项之间的水平间距（桌面端）";
	navbar_mobile_gap_label = "移动端水平间距";
	navbar_mobile_gap_desc = "导航项之间的水平间距（移动端）";
	navbar_desktop_row_gap_label = "桌面端行间距";
	navbar_desktop_row_gap_desc = "换行后行与行之间的垂直间距（桌面端）";
	navbar_mobile_row_gap_label = "移动端行间距";
	navbar_mobile_row_gap_desc = "换行后行与行之间的垂直间距（移动端）";

	// ✅ 通用按钮文本
	cancel = "取消";
	confirm = "确定";
}
