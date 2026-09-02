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
  background: "#F5F6FA",
  foreground: "#111827",
  card: "#FFFFFF",
  cardForeground: "#111827",
  primary: "#1E3A8A",
  primaryForeground: "#FFFFFF",
  secondary: "#EFF6FF",
  secondaryForeground: "#1E3A8A",
  muted: "#F3F4F8",
  mutedForeground: "#6B7280",
  accent: "#D97706",
  accentForeground: "#FFFFFF",
  border: "#ECEFF4",
  ring: "#1E3A8A",
};

export const darkPalette: Palette = {
  background: "#0A1020",
  foreground: "#F1F5F9",
  card: "#141C2E",
  cardForeground: "#F1F5F9",
  primary: "#60A5FA",
  primaryForeground: "#0A1020",
  secondary: "#1E3A8A",
  secondaryForeground: "#BFDBFE",
  muted: "#1B2437",
  mutedForeground: "#93A2B8",
  accent: "#FBBF24",
  accentForeground: "#0A1020",
  border: "#243049",
  ring: "#60A5FA",
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
 */
export const UI_SCALE = 0.86;

/** Scale a design number by `UI_SCALE`, kept to half-pixels so text stays crisp. */
export const ms = (n: number) => Math.round(n * UI_SCALE * 2) / 2;

/** Corner radii. Tighter than the web build — big radii read as chunky on a phone. */
export const RADIUS = {
  sm: 9,
  md: 12,
  lg: 15,
  xl: 20,
  header: 24,
  pill: 999,
};

/** Horizontal gutter for screen content. */
export const SCREEN_PAD = 16;

/** Soft tinted surfaces used behind icons and day badges. */
export type TintName = "indigo" | "blue" | "green" | "amber" | "red" | "violet";

export const TINTS: Record<TintName, { light: string; dark: string; fg: string; fgDark: string }> = {
  indigo: { light: "#EEF0FF", dark: "#312E8122", fg: "#4338CA", fgDark: "#A5B4FC" },
  violet: { light: "#F3EEFF", dark: "#7C3AED22", fg: "#7C3AED", fgDark: "#C4B5FD" },
  blue: { light: "#EAF1FF", dark: "#1E3A8A33", fg: "#1E3A8A", fgDark: "#93C5FD" },
  green: { light: "#E7F8EF", dark: "#16A34A22", fg: "#15803D", fgDark: "#6EE7B7" },
  amber: { light: "#FEF4E4", dark: "#D9770622", fg: "#B45309", fgDark: "#FCD34D" },
  red: { light: "#FEECEC", dark: "#DC262622", fg: "#DC2626", fgDark: "#FCA5A5" },
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
  mode: ThemeMode;
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
