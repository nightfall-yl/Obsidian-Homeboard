export interface SchemeOption {
  value: string;
  label: string;
}

export const lightSchemeOptions: SchemeOption[] = [
  { value: "minimal-default-light", label: "Default" },
  { value: "minimal-atom-light", label: "Atom" },
  { value: "minimal-ayu-light", label: "Ayu" },
  { value: "minimal-catppuccin-light", label: "Catppuccin" },
  { value: "minimal-eink-light", label: "E-ink (beta)" },
  { value: "minimal-everforest-light", label: "Everforest" },
  { value: "minimal-flexoki-light", label: "Flexoki" },
  { value: "minimal-gruvbox-light", label: "Gruvbox" },
  { value: "minimal-macos-light", label: "macOS" },
  { value: "minimal-nord-light", label: "Nord" },
  { value: "minimal-rose-pine-light", label: "Rosé Pine" },
  { value: "minimal-notion-light", label: "Sky" },
  { value: "minimal-solarized-light", label: "Solarized" },
  { value: "minimal-things-light", label: "Things" },
];

export const darkSchemeOptions: SchemeOption[] = [
  { value: "minimal-default-dark", label: "Default" },
  { value: "minimal-atom-dark", label: "Atom" },
  { value: "minimal-ayu-dark", label: "Ayu" },
  { value: "minimal-catppuccin-dark", label: "Catppuccin" },
  { value: "minimal-dracula-dark", label: "Dracula" },
  { value: "minimal-eink-dark", label: "E-ink (beta)" },
  { value: "minimal-everforest-dark", label: "Everforest" },
  { value: "minimal-flexoki-dark", label: "Flexoki" },
  { value: "minimal-gruvbox-dark", label: "Gruvbox" },
  { value: "minimal-macos-dark", label: "macOS" },
  { value: "minimal-nord-dark", label: "Nord" },
  { value: "minimal-rose-pine-dark", label: "Rosé Pine" },
  { value: "minimal-notion-dark", label: "Sky" },
  { value: "minimal-solarized-dark", label: "Solarized" },
  { value: "minimal-things-dark", label: "Things" },
];

export const lightStyleOptions: SchemeOption[] = [
  { value: "minimal-light", label: "Default" },
  { value: "minimal-light-white", label: "All white" },
  { value: "minimal-light-tonal", label: "Low contrast" },
  { value: "minimal-light-contrast", label: "High contrast" },
];

export const darkStyleOptions: SchemeOption[] = [
  { value: "minimal-dark", label: "Default" },
  { value: "minimal-dark-tonal", label: "Low contrast" },
  { value: "minimal-dark-black", label: "True black" },
];