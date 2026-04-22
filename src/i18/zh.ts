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
	homeboard_builder_heading = "样式配置";
	homeboard_tab_basic = "基础设置";
	homeboard_tab_cards = "卡片设置";
	homeboard_block_id = "区块 ID";
	homeboard_block_id_desc = "用于保存拖拽后的列宽。建议保持唯一且稳定。";
	homeboard_title_font_size_placeholder = "标题字号";
	homeboard_columns = "列数";
	homeboard_gap = "间距";
	homeboard_gap_desc = "卡片之间的像素间距";
	homeboard_cards = "卡片";
	homeboard_add_card = "新增卡片";
	homeboard_add_card_desc = "添加一个新的链接卡片";
	homeboard_add_button = "新增";
	homeboard_type = "类型";
	homeboard_type_desc = "当前仅支持链接卡片";
	homeboard_palette = "主题";
	homeboard_palette_desc = "选择内置配色方案";
	homeboard_palette_custom = "自定义配色";
	homeboard_palette_sage = "苔绿晨雾";
	homeboard_palette_mist = "雾蓝纸页";
	homeboard_palette_amber = "琥珀米纸";
	homeboard_palette_plum = "梅紫晚霞";
	homeboard_palette_slate = "石墨冷灰";
	homeboard_background = "背景";
	homeboard_background_desc = "当前卡片自己的背景色";
	homeboard_accent_colors = "强调色";
	homeboard_accent_colors_desc = "分别控制标题、链接和分隔符";
	homeboard_column_span = "列号 / 跨列";
	homeboard_column_span_desc = "列号从 1 开始；span 表示跨几列";
	homeboard_links = "链接";
	homeboard_links_desc = "每行一个，格式：标题 | 笔记路径或 Obsidian 内链";
	homeboard_move_up = "上移";
	homeboard_move_down = "下移";
	homeboard_remove = "删除";
	homeboard_card_label = "卡片";
	homeboard_default_title = "主页";
	homeboard_default_card_title = "链接";
	homeboard_menu_title = "新增 Elements 组件";
	homeboard_insert_command = "插入 Elements（homeboard）代码块";
	homeboard_builder_command = "打开 Elements Builder";
	homeboard_edit_command = "编辑光标所在的 Elements（homeboard）代码块";
	homeboard_menu_insert = "新建卡片";
	elementCard_builder_heading = "样式配置";
	elementCard_tab_basic = "基础设置";
	elementCard_tab_cards = "卡片设置";
	elementCard_block_id = "区块 ID";
	elementCard_block_id_desc = "用于保存拖拽后的列宽。建议保持唯一且稳定。";
	elementCard_title_font_size_placeholder = "标题字号";
	elementCard_columns = "列数";
	elementCard_gap = "间距";
	elementCard_gap_desc = "卡片之间的像素间距";
	elementCard_cards = "卡片";
	elementCard_add_card = "新增卡片";
	elementCard_add_card_desc = "添加一个新的链接卡片";
	elementCard_add_button = "新增";
	elementCard_type = "类型";
	elementCard_type_desc = "当前仅支持链接卡片";
	elementCard_palette = "主题";
	elementCard_palette_desc = "选择内置配色方案";
	elementCard_palette_custom = "自定义配色";
	elementCard_palette_sage = "苔绿晨雾";
	elementCard_palette_mist = "雾蓝纸页";
	elementCard_palette_amber = "琥珀米纸";
	elementCard_palette_plum = "梅紫晚霞";
	elementCard_palette_slate = "石墨冷灰";
	elementCard_background = "背景";
	elementCard_background_desc = "当前卡片自己的背景色";
	elementCard_accent_colors = "强调色";
	elementCard_accent_colors_desc = "分别控制标题、链接和分隔符";
	elementCard_column_span = "列号 / 跨列";
	elementCard_column_span_desc = "列号从 1 开始；span 表示跨几列";
	elementCard_links = "链接";
	elementCard_links_desc = "每行一个，格式：标题 | 笔记路径或 Obsidian 内链";
	elementCard_move_up = "上移";
	elementCard_move_down = "下移";
	elementCard_remove = "删除";
	elementCard_card_label = "卡片";
	elementCard_default_title = "主页";
	elementCard_default_card_title = "链接";
	elementCard_menu_title = "新增 Elements 组件";
	elementCard_insert_command = "插入 Elements（elementCard）代码块";
	elementCard_builder_command = "打开 Elements Builder";
	elementCard_edit_command = "编辑光标所在的 Elements（elementCard）代码块";
	elementCard_menu_insert = "新建卡片";
	notice_open_markdown_first = "请先打开一个 Markdown 笔记。";
	notice_homeboard_update_failed = "更新当前 Elements（homeboard）代码块失败。";
	notice_homeboard_parse_failed = "解析当前 Elements（homeboard）代码块失败。";
	notice_homeboard_cursor_required = "请先把光标放在 Elements（homeboard）代码块内。";
	notice_elementCard_update_failed = "更新当前 Elements（elementCard）代码块失败。";
	notice_elementCard_parse_failed = "解析当前 Elements（elementCard）代码块失败。";
	notice_elementCard_cursor_required = "请先把光标放在 Elements（elementCard）代码块内。";
	notice_no_active_markdown_file = "当前没有激活的 Markdown 文件。";
	notice_heatmap_no_markdown_view = "当前没有激活的 Markdown 视图。";
	notice_heatmap_editor_unsupported = "当前编辑器不支持就地编辑热力图。";
	homeboard_error_empty = "Elements（homeboard）配置为空";
	homeboard_error_empty_recommend = "请先添加 cards 配置";
	homeboard_error_invalid_yaml_object = "Elements（homeboard）配置不是有效的 YAML 对象";
	homeboard_error_card_required = "Elements（homeboard）至少需要一张卡片";
	homeboard_error_card_required_recommend = "请在 cards 中添加 links 卡片";
	homeboard_error_yaml_failed_at_line = "Elements（homeboard）YAML 解析失败，位置在第 {line} 行附近";
	homeboard_error_yaml_failed = "Elements（homeboard）YAML 解析失败，请检查缩进与字段格式";
	elementCard_error_empty = "Elements（elementCard）配置为空";
	elementCard_error_empty_recommend = "请先添加 cards 配置";
	elementCard_error_invalid_yaml_object = "Elements（elementCard）配置不是有效的 YAML 对象";
	elementCard_error_card_required = "Elements（elementCard）至少需要一张卡片";
	elementCard_error_card_required_recommend = "请在 cards 中添加 links 卡片";
	elementCard_error_yaml_failed_at_line = "Elements（elementCard）YAML 解析失败，位置在第 {line} 行附近";
	elementCard_error_yaml_failed = "Elements（elementCard）YAML 解析失败，请检查缩进与字段格式";

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
}
