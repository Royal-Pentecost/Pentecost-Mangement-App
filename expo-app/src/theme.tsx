import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark";

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
}

export const lightPalette: Palette = {
  background: "#F3F5FA",
  foreground: "#0F172A",
  card: "#FFFFFF",
  cardForeground: "#0F172A",
  primary: "#1E3A8A",
  primaryForeground: "#FFFFFF",
  secondary: "#EEF2FF",
  secondaryForeground: "#1E3A8A",
  muted: "#EDF0F6",
  // Darker than the old #6B7280 so secondary text clears WCAG AA (4.5:1) on the page background too.
  mutedForeground: "#566174",
  // Deep gold: #D97706 measured only 3.2:1 on white, too faint for gold text.
  accent: "#B45309",
  accentForeground: "#FFFFFF",
  border: "#E2E7F0",
  ring: "#1E3A8A",
};

export const darkPalette: Palette = {
  background: "#0A0F1E",
  foreground: "#F1F5F9",
  card: "#131B2E",
  cardForeground: "#F1F5F9",
  primary: "#7AB3FF",
  primaryForeground: "#0A0F1E",
  secondary: "#1E3A8A",
  secondaryForeground: "#C7DBFF",
  muted: "#1A2338",
  mutedForeground: "#A3B1C6",
  accent: "#FBBF24",
  accentForeground: "#0A0F1E",
  border: "#26324D",
  ring: "#7AB3FF",
};

/** Display font (was 'Outfit' on the web build) */
export const FONT = {
  light: "Outfit_300Light",
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
  black: "Outfit_900Black",
};

/** Body font (was 'Inter' on the web build) */
export const BODY = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
};

/**
 * One dial for how large the whole interface reads. Every font size, icon, and
 * tile passes through `ms()`, so nudging this rescales the app coherently
 * instead of leaving some screens tighter than others.
 *
 * Whatever the scale, `Txt` never renders text below `MIN_TEXT`: at 0.9 the
 * captions and chips came out at 9–11px, too small for many of the
 * congregation's older members.
 */
export const UI_SCALE = 0.9;

/** The smallest text the app draws, in px. Captions and chips round up to it. */
export const MIN_TEXT = 12;

/** Scale a design number by `UI_SCALE`, kept to half-pixels so text stays crisp. */
export const ms = (n: number) => Math.round(n * UI_SCALE * 2) / 2;

/** Corner radii. Softer than before, still tighter than the web build — big radii read as chunky on a phone. */
export const RADIUS = {
  sm: 10,
  md: 13,
  lg: 17,
  xl: 22,
  header: 28,
  pill: 999,
};

/** Horizontal gutter for screen content. */
export const SCREEN_PAD = 16;

/**
 * The one look for every icon tile and for the selected tab: a solid tile with a
 * white icon. Church navy in light mode; in dark mode a deep navy that still
 * stands off the card behind it. It replaced six pastel tints (violet, green,
 * amber…) that made each screen look like a colour swatch rather than one app.
 */
export const ICON_TILE = {
  light: { bg: "#1E3A8A", fg: "#FFFFFF" },
  dark: { bg: "#24325A", fg: "#FFFFFF" },
} as const;

/** Kept as names so call sites read the same; every tint now draws `ICON_TILE`. */
export type TintName = "indigo" | "blue" | "green" | "amber" | "red" | "violet";

const ONE_TILE = { light: ICON_TILE.light.bg, dark: ICON_TILE.dark.bg, fg: ICON_TILE.light.fg, fgDark: ICON_TILE.dark.fg };

export const TINTS: Record<TintName, { light: string; dark: string; fg: string; fgDark: string }> = {
  indigo: ONE_TILE,
  violet: ONE_TILE,
  blue: ONE_TILE,
  green: ONE_TILE,
  amber: ONE_TILE,
  red: ONE_TILE,
};

/**
 * Readable colour for a tint's meaning when it is drawn straight on a card —
 * a green success tick, an amber warning line. Not for icons inside a tile:
 * those are white on `ICON_TILE`, and using that white on a card made the text
 * vanish in light mode.
 */
export const TINT_TEXT: Record<TintName, { light: string; dark: string }> = {
  indigo: { light: "#4338CA", dark: "#A5B4FC" },
  violet: { light: "#7C3AED", dark: "#C4B5FD" },
  blue: { light: "#1E3A8A", dark: "#93C5FD" },
  green: { light: "#15803D", dark: "#6EE7B7" },
  amber: { light: "#B45309", dark: "#FCD34D" },
  red: { light: "#DC2626", dark: "#FCA5A5" },
};

/** Fixed brand colours that do not come from the palette. */
export const BRAND = {
  navy: "#1E3A8A",
  blue: "#3B82F6",
  blueLight: "#93C5FD",
  gold: "#D97706",
  goldLight: "#F59E0B",
  green: "#22C55E",
  greenDark: "#16A34A",
  greenLight: "#4ADE80",
  red: "#DC2626",
  redLight: "#F87171",
  purple: "#7C3AED",
};

interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean;
  c: Palette;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the phone's own setting — app.json declares userInterfaceStyle
  // "automatic", and the startup screen renders before any toggle is reachable.
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const mode: ThemeMode = override ?? (system === "dark" ? "dark" : "light");
  const setMode = setOverride;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      c: mode === "dark" ? darkPalette : lightPalette,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
