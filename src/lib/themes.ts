/**
 * Dashboard theming. A theme is two independent choices:
 *  - an accent (drives buttons, focus rings, charts and the active nav pill)
 *  - a sidebar style (the nav surface)
 * Each accent names a complementary sidebar, so one click gives a matched pair.
 * Colours are written as CSS variables into one <style> tag, so every component keeps using tokens.
 */

export type SidebarId = "wine" | "umber" | "midnight" | "forest" | "graphite" | "soft";

export interface Accent {
  id: string;
  label: string;
  hue: number;
  chroma: number;
  /** Keeps the stock near-black buttons instead of colouring them. */
  neutral?: boolean;
  /** The sidebar that sits opposite this accent on the colour wheel. */
  pair: SidebarId;
}

export interface SidebarStyle {
  id: SidebarId;
  label: string;
  hue: number;
  chroma: number;
  /** "light" styles are pale in light mode; every style is dark in dark mode. */
  tone: "dark" | "light";
}

export const accents: Accent[] = [
  { id: "emerald", label: "Emerald", hue: 165, chroma: 0.11, pair: "wine" },
  { id: "ocean", label: "Ocean", hue: 245, chroma: 0.12, pair: "umber" },
  { id: "saffron", label: "Saffron", hue: 70, chroma: 0.14, pair: "midnight" },
  { id: "rose", label: "Rose", hue: 8, chroma: 0.15, pair: "forest" },
  { id: "graphite", label: "Graphite", hue: 260, chroma: 0.01, neutral: true, pair: "soft" },
];

export const sidebars: SidebarStyle[] = [
  { id: "wine", label: "Wine", hue: 12, chroma: 0.095, tone: "dark" },
  { id: "umber", label: "Umber", hue: 50, chroma: 0.075, tone: "dark" },
  { id: "midnight", label: "Midnight", hue: 255, chroma: 0.09, tone: "dark" },
  { id: "forest", label: "Forest", hue: 160, chroma: 0.075, tone: "dark" },
  { id: "graphite", label: "Graphite", hue: 260, chroma: 0.012, tone: "dark" },
  { id: "soft", label: "Soft", hue: 250, chroma: 0.008, tone: "light" },
];

export interface ThemeChoice {
  accent: string;
  sidebar: SidebarId;
}

export const defaultTheme: ThemeChoice = { accent: "emerald", sidebar: "wine" };

const KEY = "jabali-admin-theme";
const TAG = "jabali-theme";

export function loadTheme(): ThemeChoice {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ThemeChoice> | null;
    const accent = accents.find((a) => a.id === raw?.accent)?.id ?? defaultTheme.accent;
    const sidebar = sidebars.find((s) => s.id === raw?.sidebar)?.id ?? defaultTheme.sidebar;
    return { accent, sidebar };
  } catch {
    return defaultTheme;
  }
}

export function saveTheme(t: ThemeChoice) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* storage unavailable: the theme still applies for this visit */
  }
}

const o = (l: number, c: number, h: number) => `oklch(${l} ${+c.toFixed(4)} ${h})`;

function accentCss(a: Accent, dark: boolean): string {
  const { hue: h, chroma: c } = a;
  const lines = [
    `--ring: ${o(dark ? 0.72 : 0.55, c, h)};`,
    `--chart-1: ${o(dark ? 0.72 : 0.55, c, h)};`,
    `--sidebar-ring: ${o(dark ? 0.72 : 0.55, c, h)};`,
    `--sidebar-primary: ${o(0.8, c * 1.1, h)};`,
    `--sidebar-primary-foreground: ${o(0.2, 0.04, h)};`,
    `--sidebar-active: ${o(dark ? 0.86 : 0.88, c * 0.75, h)};`,
    `--sidebar-active-foreground: ${o(dark ? 0.26 : 0.28, c * 0.7, h)};`,
  ];
  if (!a.neutral) {
    lines.push(
      `--primary: ${o(dark ? 0.74 : 0.47, c, h)};`,
      `--primary-foreground: ${o(dark ? 0.2 : 0.98, dark ? 0.04 : 0.005, h)};`,
    );
  }
  return lines.join("\n  ");
}

function sidebarCss(s: SidebarStyle, dark: boolean): string {
  const { hue: h, chroma: c } = s;
  const pale = s.tone === "light" && !dark;
  const logoDark = pale ? "none" : "block";
  const logoLight = pale ? "block" : "none";
  const surface = pale
    ? { bg: o(0.955, c, h), fg: o(0.3, 0.012, h), hover: o(0.92, c * 1.4, h), hoverFg: o(0.2, 0.012, h), border: o(0.9, c * 1.2, h) }
    : s.tone === "light"
      ? { bg: o(0.2, 0.01, 260), fg: o(0.9, 0.01, 260), hover: o(0.27, 0.012, 260), hoverFg: o(0.98, 0.005, 260), border: "oklch(1 0 0 / 10%)" }
      : dark
        ? { bg: o(0.255, c * 0.9, h), fg: o(0.9, Math.min(c, 0.02), h), hover: o(0.33, c, h), hoverFg: o(0.98, 0.01, h), border: "oklch(1 0 0 / 10%)" }
        : { bg: o(0.33, c, h), fg: o(0.93, Math.min(c, 0.02), h), hover: o(0.4, c * 1.05, h), hoverFg: o(0.98, 0.01, h), border: o(0.42, c * 0.85, h) };
  return [
    `--sidebar: ${surface.bg};`,
    `--sidebar-foreground: ${surface.fg};`,
    `--sidebar-accent: ${surface.hover};`,
    `--sidebar-accent-foreground: ${surface.hoverFg};`,
    `--sidebar-border: ${surface.border};`,
    `--sb-logo-dark: ${logoDark};`,
    `--sb-logo-light: ${logoLight};`,
  ].join("\n  ");
}

export function applyTheme(t: ThemeChoice) {
  const a = accents.find((x) => x.id === t.accent) ?? accents[0];
  const s = sidebars.find((x) => x.id === t.sidebar) ?? sidebars[0];
  const css = `:root {\n  ${accentCss(a, false)}\n  ${sidebarCss(s, false)}\n}\n.dark {\n  ${accentCss(a, true)}\n  ${sidebarCss(s, true)}\n}\n`;
  let el = document.getElementById(TAG) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = TAG;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

/** Swatch colours for the picker, mode-independent. */
export const accentSwatch = (a: Accent) => o(0.55, Math.max(a.chroma, 0.02), a.hue);
export const sidebarSwatch = (s: SidebarStyle) => (s.tone === "light" ? o(0.955, 0.008, 250) : o(0.33, s.chroma, s.hue));
