import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import { BODY, FONT, RADIUS, TINTS, TintName, ms, useTheme } from "./theme";

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
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const scaled: TextStyle | undefined =
    flat && (flat.fontSize != null || flat.lineHeight != null)
      ? {
          ...flat,
          ...(flat.fontSize != null ? { fontSize: ms(flat.fontSize) } : null),
          ...(flat.lineHeight != null ? { lineHeight: ms(flat.lineHeight) } : null),
        }
      : flat;

  return <Text {...rest} style={[{ fontFamily: FAMILY[variant] }, scaled]} />;
}

// ─── Pressable with the web build's active:scale-95 feel ──────────────────────

export function Btn({
  style,
  scale = 0.96,
  disabled,
  children,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scale?: number }) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { transform: [{ scale }], opacity: 0.92 } : null,
      ]}
    >
      {children as React.ReactNode}
    </Pressable>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * In light mode cards read as floating white surfaces with a soft shadow and no
 * hard outline; in dark mode shadows don't register, so a hairline border does
 * the separating instead.
 */
export function Card({
  style,
  children,
  borderColor,
  elevation = "sm",
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  borderColor?: string;
  elevation?: "none" | "sm" | "md";
}) {
  const { c, isDark } = useTheme();
  const outlined = isDark || !!borderColor;

  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: RADIUS.lg,
          borderWidth: outlined ? 1 : 0,
          borderColor: borderColor ?? c.border,
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

/** Soft rounded square that sits behind an icon or emoji. */
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
    <Card style={[{ padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, style]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 15, color: c.foreground }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="bodyMedium" numberOfLines={1} style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
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
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 8 }, style]}>
      <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: c.mutedForeground }}>
        {label}
      </Txt>
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

/** Soft, wide, low-opacity shadows — the reference design barely tints the page. */
export const shadow = (level: "sm" | "md" | "lg" = "sm") => {
  const cfg = {
    sm: { radius: 10, opacity: 0.05, elevation: 1, offset: 2 },
    md: { radius: 18, opacity: 0.07, elevation: 3, offset: 5 },
    lg: { radius: 26, opacity: 0.11, elevation: 7, offset: 9 },
  }[level];

  return Platform.select({
    ios: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: cfg.offset },
      shadowOpacity: cfg.opacity,
      shadowRadius: cfg.radius,
    },
    android: { elevation: cfg.elevation },
    default: {
      shadowColor: "#0F172A",
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
          paddingHorizontal: 8,
          paddingVertical: 2,
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
