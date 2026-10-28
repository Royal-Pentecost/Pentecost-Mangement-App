import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { BODY, BRAND, FONT, MIN_TEXT, RADIUS, TINTS, TintName, ms, useTheme } from "./theme";

// ─── Text ─────────────────────────────────────────────────────────────────────

type TxtVariant =
  | "body"
  | "bodyMedium"
  | "bodySemi"
  | "display"
  | "displaySemi"
  | "displayBold"
  | "displayExtraBold"
  | "displayBlack";

const FAMILY: Record<TxtVariant, string> = {
  body: BODY.regular,
  bodyMedium: BODY.medium,
  bodySemi: BODY.semibold,
  display: FONT.medium,
  displaySemi: FONT.semibold,
  displayBold: FONT.bold,
  displayExtraBold: FONT.extrabold,
  displayBlack: FONT.black,
};

export function Txt({
  variant = "body",
  style,
  ...rest
}: TextProps & { variant?: TxtVariant }) {
  // Screens state sizes at their design values; the global scale is applied
  // here so the whole app resizes together rather than screen by screen.
  // Nothing renders below MIN_TEXT, and a line height set for the smaller
  // design size grows with it so raised text never clips.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontSize = flat?.fontSize != null ? Math.max(ms(flat.fontSize), MIN_TEXT) : undefined;
  const lineHeight =
    flat?.lineHeight != null ? Math.max(ms(flat.lineHeight), fontSize != null ? Math.ceil(fontSize * 1.25) : 0) : undefined;
  const scaled: TextStyle | undefined =
    flat && (fontSize != null || lineHeight != null)
      ? {
          ...flat,
          ...(fontSize != null ? { fontSize } : null),
          ...(lineHeight != null ? { lineHeight } : null),
        }
      : flat;

  // The phone's own text-size setting still applies — that is how many older
  // members make every app readable — capped so the largest setting enlarges
  // text without breaking the layout around it.
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[{ fontFamily: FAMILY[variant] }, scaled]} />;
}

// ─── Pressable with the web build's active:scale-95 feel ──────────────────────

/** Whether a colour is dark enough to need a white spinner. Unknown counts as dark (gradient buttons are navy). */
function isDarkColor(color: unknown): boolean {
  if (typeof color !== "string") return true;
  const hex = color.match(/^#([0-9a-f]{6})/i)?.[1];
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b < 150;
  }
  const rgba = color.match(/rgba?\(([^)]+)\)/)?.[1]?.split(",").map((n) => parseFloat(n));
  if (rgba && rgba.length >= 3) {
    // A faint wash over the dark glass panels reads as dark.
    if (rgba.length === 4 && rgba[3] < 0.5) return true;
    return 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2] < 150;
  }
  return color !== "transparent" && color !== "white" && color !== "#fff";
}

/**
 * The app's pressable. When `onPress` returns a promise — anything that waits on
 * the server — the button shows a spinner and ignores further taps until it
 * settles, so a slow connection reads as "working", not as a dead button that
 * invites a second tap. `loading` forces the same state from outside.
 */
export function Btn({
  style,
  scale = 0.96,
  disabled,
  loading,
  spinnerColor,
  onPress,
  children,
  ...rest
}: Omit<PressableProps, "onPress"> & {
  style?: StyleProp<ViewStyle>;
  scale?: number;
  loading?: boolean;
  spinnerColor?: string;
  onPress?: (e: GestureResponderEvent) => unknown;
}) {
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);
  const busy = loading || pending;

  const handlePress = (e: GestureResponderEvent) => {
    if (busy || !onPress) return;
    const result = onPress(e);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPending(true);
      (result as Promise<unknown>).catch(() => {}).finally(() => mounted.current && setPending(false));
    }
  };

  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  return (
    <Pressable
      // Announced as a button by the phone's screen reader unless told otherwise.
      accessibilityRole="button"
      {...rest}
      onPress={handlePress}
      disabled={disabled || busy}
      accessibilityState={{ ...rest.accessibilityState, busy, disabled: !!(disabled || busy) }}
      style={({ pressed }) => [
        style,
        pressed && !disabled && !busy ? { transform: [{ scale }], opacity: 0.92 } : null,
      ]}
    >
      {busy ? <View style={{ opacity: 0.25 }} pointerEvents="none">{children as React.ReactNode}</View> : (children as React.ReactNode)}
      {busy ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="small" color={spinnerColor ?? (isDarkColor(flat.backgroundColor) ? "#fff" : BRAND.navy)} />
        </View>
      ) : null}
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * Cards carry no outline in either theme. In light mode they float on a soft
 * shadow; in dark mode the card surface is lighter than the page, which is
 * separation enough. Outlines on every card were a large part of why the app
 * looked machine-made. `borderColor` is accepted for old call sites and ignored.
 */
export function Card({
  style,
  children,
  elevation = "sm",
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  borderColor?: string;
  elevation?: "none" | "sm" | "md";
}) {
  const { c, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: RADIUS.lg,
        },
        !isDark && elevation !== "none" ? shadow(elevation) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Tinted icon tile ─────────────────────────────────────────────────────────

/** Rounded square behind an icon — one colour app-wide (`ICON_TILE`), whatever `tint` is passed. */
export function TintTile({
  tint,
  size = 44,
  radius = RADIUS.md,
  children,
  style,
}: {
  tint: TintName;
  size?: number;
  radius?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useTheme();
  const t = TINTS[tint];

  return (
    <View
      style={[
        {
          width: ms(size),
          height: ms(size),
          borderRadius: ms(radius),
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? t.dark : t.light,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function tintFg(tint: TintName, isDark: boolean) {
  return isDark ? TINTS[tint].fgDark : TINTS[tint].fg;
}

// ─── Row card ─────────────────────────────────────────────────────────────────

/**
 * The app's one list-row shape: leading tile, title + subtitle, optional
 * trailing control. Used by every list so they stay visually identical.
 */
export function RowCard({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  onPress,
  style,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();

  const body = (
    <Card style={[{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, style]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 15, color: c.foreground }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="bodyMedium" numberOfLines={1} style={{ fontSize: 13, marginTop: 3, color: c.mutedForeground }}>
            {subtitle}
          </Txt>
        ) : null}
        {meta}
      </View>
      {trailing}
    </Card>
  );

  return onPress ? <Btn onPress={onPress}>{body}</Btn> : body;
}

// ─── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({ label, trailing, style }: { label: string; trailing?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 3, height: ms(12), borderRadius: 2, backgroundColor: c.accent }} />
        <Txt variant="bodySemi" accessibilityRole="header" style={{ fontSize: 11.5, letterSpacing: 1.1, textTransform: "uppercase", color: c.mutedForeground }}>
          {label}
        </Txt>
      </View>
      {trailing}
    </View>
  );
}

// ─── Animations (replacements for animate-pulse / animate-ping) ───────────────

export function Pulse({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.35, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return <Animated.View style={[style, { opacity: anim }]}>{children}</Animated.View>;
}

/** Expanding ring, the equivalent of Tailwind's animate-ping. */
export function Ping({ size, color, style }: { size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          pointerEvents: "none",
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
        },
        style,
      ]}
    />
  );
}

/** Solid dot with an optional pinging halo. */
export function StatusDot({ size = 12, color, ping = false }: { size?: number; color: string; ping?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
      {ping ? <Ping size={size} color={color} style={{ top: 0, left: 0 }} /> : null}
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

/** Fills from empty on mount, and animates whenever `pct` changes. */
export function ProgressBar({
  pct,
  height = 10,
  trackColor,
  fillColor,
  delay = 250,
  animate = true,
  style,
}: {
  pct: number;
  height?: number;
  trackColor?: string;
  fillColor: string;
  delay?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const target = Math.max(0, Math.min(100, pct));
  const grow = useRef(new Animated.Value(animate ? 0 : target)).current;

  useEffect(() => {
    if (!animate) {
      grow.setValue(target);
      return;
    }
    // Width is a layout property, so this one cannot use the native driver.
    const a = Animated.timing(grow, {
      toValue: target,
      duration: 850,
      delay,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [target, grow, delay, animate]);

  return (
    <View
      style={[
        { height, borderRadius: height / 2, overflow: "hidden", backgroundColor: trackColor ?? c.muted },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: "100%",
          width: grow.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}

// ─── Avatar with remote photo + initials fallback ─────────────────────────────

export function Avatar({
  photo,
  initials,
  color,
  size,
  radius,
  borderColor,
  borderWidth = 0,
  fontSize,
}: {
  photo?: string;
  initials: string;
  color: string;
  size: number;
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const d = ms(size);
  const r = ms(radius ?? size / 2);

  return (
    <View
      style={{
        width: d,
        height: d,
        borderRadius: r,
        overflow: "hidden",
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
        borderWidth,
        borderColor,
      }}
    >
      <Text style={{ fontFamily: FONT.bold, color: "#fff", fontSize: ms(fontSize ?? size * 0.34) }}>{initials}</Text>
      {photo && !failed ? (
        <Image
          source={{ uri: photo }}
          onError={() => setFailed(true)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

// ─── Shadows ──────────────────────────────────────────────────────────────────

/** Navy rather than black, so shadows read as part of the brand instead of grime. */
const SHADOW_TINT = "#1E2A55";

/** Soft, wide, low-opacity shadows — the reference design barely tints the page. */
export const shadow = (level: "sm" | "md" | "lg" = "sm") => {
  const cfg = {
    sm: { radius: 14, opacity: 0.07, elevation: 2, offset: 3 },
    md: { radius: 22, opacity: 0.09, elevation: 4, offset: 6 },
    lg: { radius: 30, opacity: 0.13, elevation: 8, offset: 10 },
  }[level];

  return Platform.select({
    ios: {
      shadowColor: SHADOW_TINT,
      shadowOffset: { width: 0, height: cfg.offset },
      shadowOpacity: cfg.opacity,
      shadowRadius: cfg.radius,
    },
    android: { elevation: cfg.elevation },
    default: {
      shadowColor: SHADOW_TINT,
      shadowOffset: { width: 0, height: cfg.offset },
      shadowOpacity: cfg.opacity,
      shadowRadius: cfg.radius,
    },
  }) as ViewStyle;
};

// ─── Small helpers used across screens ────────────────────────────────────────

export function Pill({
  label,
  bg,
  color,
  borderColor,
  style,
  fontSize = 10,
}: {
  label: string;
  bg: string;
  color: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  fontSize?: number;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: 999,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderWidth: borderColor ? 1 : 0,
          borderColor,
        },
        style,
      ]}
    >
      <Txt variant="bodySemi" style={{ fontSize, color }}>
        {label}
      </Txt>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
      {children}
    </Txt>
  );
}
