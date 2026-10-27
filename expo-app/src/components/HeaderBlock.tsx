import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SCREEN_PAD, ms, useTheme } from "../theme";
import { Btn, Txt } from "../ui";

/**
 * The solid navy slab that anchors the top of every screen, with its bottom
 * corners rounded off against the page background.
 */
export function HeaderBlock({
  children,
  style,
  paddingBottom = 16,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  paddingBottom?: number;
}) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={isDark ? ["#1A2B66", "#132050", "#0D1838"] : ["#2A47A6", "#1E3A8A", "#172C6B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          paddingTop: insets.top + 8,
          paddingBottom,
          paddingHorizontal: SCREEN_PAD,
          borderBottomLeftRadius: RADIUS.header,
          borderBottomRightRadius: RADIUS.header,
          borderBottomWidth: 2,
          borderBottomColor: "rgba(245,158,11,0.55)",
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

/** Translucent circular control used for the back / action buttons in the header. */
export function HeaderButton({
  onPress,
  children,
  size = 40,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <Btn
      onPress={onPress}
      hitSlop={8}
      style={{
        width: ms(size),
        height: ms(size),
        flexShrink: 0,
        borderRadius: ms(size) / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
      }}
    >
      {children}
    </Btn>
  );
}

/** Small caps eyebrow + bold title, the header's standard text pairing. */
export function HeaderTitle({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      <Txt
        variant="bodySemi"
        numberOfLines={1}
        style={{ fontSize: 10, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,0.74)" }}
      >
        {eyebrow}
      </Txt>
      <Txt
        variant="displayExtraBold"
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
        style={{
          width: "100%",
          fontSize: 17.5,
          lineHeight: 21,
          marginTop: 2,
          textAlign: align,
          color: "#fff",
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Txt>
    </View>
  );
}

/** Pill with a leading dot, e.g. the district chip. */
export function HeaderChip({ label, dotColor = "#F59E0B" }: { label: string; dotColor?: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4.5,
        borderRadius: RADIUS.pill,
        backgroundColor: "rgba(255,255,255,0.14)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
      <Txt variant="bodySemi" style={{ fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: "#fff" }}>
        {label}
      </Txt>
    </View>
  );
}
