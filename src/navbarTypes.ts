export interface NavBarItem {
	label: string;
	icon?: string;
	url?: string;
	action?: string;
}

export type NavBarAlign = "center" | "justify";

export interface NavBarConfig {
	align?: NavBarAlign;
	desktopGap?: string;
	desktopRowGap?: string;
	mobileGap?: string;
	mobileRowGap?: string;
	items: NavBarItem[];
}
