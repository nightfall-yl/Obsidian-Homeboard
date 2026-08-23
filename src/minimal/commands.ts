import { MinimalManager } from "./manager";
import {
  lightStyles,
  darkStyles,
  tableWidthStyles,
  imgWidthStyles,
  iframeWidthStyles,
  chartWidthStyles,
  mapWidthStyles,
} from "./constants";
import { lightSchemeOptions, darkSchemeOptions } from "./schemes";

export function registerAllCommands(manager: MinimalManager): void {
  registerFontCommands(manager);
  registerCycleCommands(manager);
  registerToggleCommands(manager);
  registerLightModeCommands(manager);
  registerDarkModeCommands(manager);
  registerLightSchemeCommands(manager);
  registerDarkSchemeCommands(manager);
}

function registerFontCommands(manager: MinimalManager): void {
  manager.registerCommand("increase-body-font-size", "Increase body font size", () => {
    manager.settings.textNormal = manager.settings.textNormal + 0.5;
    void manager.saveSettings();
    manager.setFontSize();
  });

  manager.registerCommand("decrease-body-font-size", "Decrease body font size", () => {
    manager.settings.textNormal = manager.settings.textNormal - 0.5;
    void manager.saveSettings();
    manager.setFontSize();
  });
}

function cycleCommand(
  manager: MinimalManager,
  id: string,
  name: string,
  key: "darkStyle" | "lightStyle" | "tableWidth" | "imgWidth" | "iframeWidth" | "chartWidth" | "mapWidth",
  list: string[]
): void {
  manager.registerCommand(id, name, () => {
    const idx = list.indexOf(manager.settings[key]);
    const next = list[(idx + 1) % list.length]!;
    manager.settings[key] = next;
    void manager.saveSettings();
    if (key === "darkStyle") manager.updateDarkStyle();
    else if (key === "lightStyle") manager.updateLightStyle();
    else manager.refresh();
  });
}

function registerCycleCommands(manager: MinimalManager): void {
  cycleCommand(manager, "toggle-minimal-dark-cycle", "Cycle between dark mode styles", "darkStyle", darkStyles);
  cycleCommand(manager, "toggle-minimal-light-cycle", "Cycle between light mode styles", "lightStyle", lightStyles);
  cycleCommand(manager, "cycle-minimal-table-width", "Cycle between table width options", "tableWidth", tableWidthStyles);
  cycleCommand(manager, "cycle-minimal-image-width", "Cycle between image width options", "imgWidth", imgWidthStyles);
  cycleCommand(manager, "cycle-minimal-iframe-width", "Cycle between iframe width options", "iframeWidth", iframeWidthStyles);
  cycleCommand(manager, "cycle-minimal-chart-width", "Cycle between chart width options", "chartWidth", chartWidthStyles);
  cycleCommand(manager, "cycle-minimal-map-width", "Cycle between map width options", "mapWidth", mapWidthStyles);
}

type BooleanSettingKey =
  | "bordersToggle"
  | "colorfulHeadings"
  | "colorfulFrame"
  | "focusMode"
  | "imgGrid";

function toggleCommand(
  manager: MinimalManager,
  id: string,
  name: string,
  key: BooleanSettingKey
): void {
  manager.registerCommand(id, name, () => {
    manager.settings[key] = !manager.settings[key];
    void manager.saveSettings();
    manager.refresh();
  });
}

function registerToggleCommands(manager: MinimalManager): void {
  toggleCommand(manager, "toggle-hidden-borders", "Toggle sidebar borders", "bordersToggle");
  toggleCommand(manager, "toggle-colorful-headings", "Toggle colorful headings", "colorfulHeadings");
  toggleCommand(manager, "toggle-minimal-focus-mode", "Toggle focus mode", "focusMode");
  toggleCommand(manager, "toggle-minimal-colorful-frame", "Toggle colorful window frame", "colorfulFrame");
  toggleCommand(manager, "toggle-minimal-img-grid", "Toggle image grids", "imgGrid");
  manager.registerCommand("toggle-minimal-switch", "Switch between light and dark mode", () => {
    manager.updateTheme();
  });
}

function registerLightModeCommands(manager: MinimalManager): void {
  const modes: Array<[string, string, string]> = [
    ["minimal-light", "toggle-minimal-light-default", "Use light mode (default)"],
    ["minimal-light-white", "toggle-minimal-light-white", "Use light mode (all white)"],
    ["minimal-light-tonal", "toggle-minimal-light-tonal", "Use light mode (low contrast)"],
    ["minimal-light-contrast", "toggle-minimal-light-contrast", "Use light mode (high contrast)"],
  ];
  modes.forEach(([styleValue, id, name]) => {
    manager.registerCommand(id, name, () => {
      manager.settings.lightStyle = styleValue;
      void manager.saveSettings();
      manager.updateLightStyle();
    });
  });
}

function registerDarkModeCommands(manager: MinimalManager): void {
  const modes: Array<[string, string, string]> = [
    ["minimal-dark", "toggle-minimal-dark-default", "Use dark mode (default)"],
    ["minimal-dark-tonal", "toggle-minimal-dark-tonal", "Use dark mode (low contrast)"],
    ["minimal-dark-black", "toggle-minimal-dark-black", "Use dark mode (true black)"],
  ];
  modes.forEach(([styleValue, id, name]) => {
    manager.registerCommand(id, name, () => {
      manager.settings.darkStyle = styleValue;
      void manager.saveSettings();
      manager.updateDarkStyle();
    });
  });
}

function registerLightSchemeCommands(manager: MinimalManager): void {
  lightSchemeOptions.forEach(({ value, label }) => {
    manager.registerCommand(`toggle-minimal-${value.replace("minimal-", "").replace("-light", "")}-light`, `Switch light color scheme to ${label} (light)`, () => {
      manager.settings.lightScheme = value;
      void manager.saveSettings();
      manager.updateLightScheme();
      manager.updateLightStyle();
    });
  });
}

function registerDarkSchemeCommands(manager: MinimalManager): void {
  darkSchemeOptions.forEach(({ value, label }) => {
    manager.registerCommand(`toggle-minimal-${value.replace("minimal-", "").replace("-dark", "")}-dark`, `Switch dark color scheme to ${label} (dark)`, () => {
      manager.settings.darkScheme = value;
      void manager.saveSettings();
      manager.updateDarkScheme();
      manager.updateDarkStyle();
    });
  });
}