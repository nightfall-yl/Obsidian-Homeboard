import type { App } from "obsidian";
import type { MinimalSettings } from "./settings";
import { removeDarkScheme, removeLightScheme } from "./styles";

export function updateDarkStyle(app: App, settings: MinimalSettings): void {
  document.body.removeClass(
    "theme-light",
    "minimal-dark",
    "minimal-dark-tonal",
    "minimal-dark-black"
  );
  document.body.addClass("theme-dark", settings.darkStyle);
  if (app.vault.getConfig("theme") !== "system") {
    app.setTheme("obsidian");
    app.vault.setConfig("theme", "obsidian");
  }
  app.workspace.trigger("css-change");
}

export function updateLightStyle(app: App, settings: MinimalSettings): void {
  document.body.removeClass(
    "theme-dark",
    "minimal-light",
    "minimal-light-tonal",
    "minimal-light-contrast",
    "minimal-light-white"
  );
  document.body.addClass("theme-light", settings.lightStyle);
  if (app.vault.getConfig("theme") !== "system") {
    app.setTheme("moonstone");
    app.vault.setConfig("theme", "moonstone");
  }
  app.workspace.trigger("css-change");
}

export function updateDarkScheme(settings: MinimalSettings): void {
  removeDarkScheme();
  document.body.addClass(settings.darkScheme);
}

export function updateLightScheme(settings: MinimalSettings): void {
  removeLightScheme();
  document.body.addClass(settings.lightScheme);
}

export function updateTheme(app: App): void {
  if (app.vault.getConfig("theme") === "system") {
    if (document.body.classList.contains("theme-light")) {
      document.body.removeClass("theme-light");
      document.body.addClass("theme-dark");
    } else {
      document.body.removeClass("theme-dark");
      document.body.addClass("theme-light");
    }
  } else {
    if (document.body.classList.contains("theme-light")) {
      document.body.removeClass("theme-light");
      document.body.addClass("theme-dark");
    } else {
      document.body.removeClass("theme-dark");
      document.body.addClass("theme-light");
    }

    const currentTheme = app.vault.getConfig("theme");
    const newTheme = currentTheme === "moonstone" ? "obsidian" : "moonstone";

    app.setTheme(newTheme);
    app.vault.setConfig("theme", newTheme);
  }
  app.workspace.trigger("css-change");
}

export function updateSidebar(settings: MinimalSettings): void {
  const sidebarEl = document.getElementsByClassName("mod-left-split")[0];
  const ribbonEl = document.getElementsByClassName("side-dock-ribbon")[0];
  if (
    sidebarEl &&
    ribbonEl &&
    document.body.classList.contains("theme-light") &&
    settings.lightStyle === "minimal-light-contrast"
  ) {
    sidebarEl.addClass("theme-dark");
    ribbonEl.addClass("theme-dark");
  } else if (sidebarEl && ribbonEl) {
    sidebarEl.removeClass("theme-dark");
    ribbonEl.removeClass("theme-dark");
  }
}