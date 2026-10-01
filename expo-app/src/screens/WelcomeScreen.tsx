import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, useTheme } from "../theme";
import { SessionUser, pentecostLogo, welcomeBackground } from "../data";
import { Avatar, Txt, shadow } from "../ui";

/**
 * Drop the honorific and greet by given name — but when that leaves only an
 * initial ("Apostle K. Asante" → "K."), keep the surname so it reads as a name.
 */
function toGreetingName(fullName: string) {
  const withoutTitle = fullName.replace(/^(Elder|Apostle|Deacon|Deaconess|Pastor|Prophet|Sis\.|Bro\.)\s+/i, "").trim();
  const parts = withoutTitle.split(/\s+/);
  const first = parts[0] ?? withoutTitle;
  const isInitial = first.endsWith(".") || first.length <= 2;
  return isInitial ? withoutTitle : first;
}

/**
 * Shown for a beat after the OTP is verified: greets the person by name and
 * photo before handing off to the app.
 */
export default function WelcomeScreen({ user, onDone }: { user: SessionUser; onDone: () => void }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const pop = useRef(new Animated.Value(0.82)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(pop, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [fade, rise, pop, ring, onDone]);

  const greetingName = toGreetingName(user.name);

  return (
    <View style={{ flex: 1, backgroundColor: "#070C18" }}>
      {/*
        The backdrop is sized to the screen in real pixels. Two earlier attempts
        got this wrong on a device: `height: "100%"` resolved against the padded
        parent's content box and left a dark band along the bottom, and stretching
        by insets alone let Android fall back to the asset's intrinsic size, which
        is wider than the screen and so rendered as a magnified crop. An explicit
        `width`/`height` from `useWindowDimensions` is unambiguous everywhere.
      */}
      <Image
        source={welcomeBackground}
        resizeMode="cover"
        style={{ position: "absolute", left: 0, top: 0, width, height }}
      />

      {/* Scrim — dark enough for white type, light enough to see the photograph */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(7,12,24,0.55)", "rgba(7,12,24,0.86)"]
            : ["rgba(16,28,70,0.52)", "rgba(7,12,24,0.86)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Content, padded away from the edges */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingBottom: insets.bottom,
        }}
      >

      {/* Avatar with an expanding halo */}
      <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 132,
            height: 132,
            borderRadius: 66,
            borderWidth: 2,
            borderColor: "#F59E0B",
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
          }}
        />
        <Animated.View style={[{ transform: [{ scale: pop }] }, shadow("lg")]}>
          <Avatar
            photo={user.photo}
            initials={user.avatar}
            color={user.avatarColor}
            size={132}
            radius={66}
            borderWidth={4}
            borderColor="#F59E0B"
            fontSize={44}
          />
        </Animated.View>
      </View>

      <Animated.View style={{ alignItems: "center", opacity: fade, transform: [{ translateY: rise }] }}>
        <Txt variant="bodySemi" style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          Welcome back
        </Txt>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
          <Txt variant="displayExtraBold" style={{ fontSize: 34, color: "#fff", textAlign: "center" }}>
            {greetingName}
          </Txt>
          <Txt style={{ fontSize: 26, lineHeight: 32 }}>👋</Txt>
        </View>

        <Txt variant="bodyMedium" style={{ fontSize: 14, marginTop: 8, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
          {user.subtitle}
        </Txt>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            marginTop: 26,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: RADIUS.pill,
            backgroundColor: "rgba(255,255,255,0.12)",
          }}
        >
          <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Image source={pentecostLogo} style={{ width: 17, height: 17 }} resizeMode="contain" />
          </View>
          <Txt variant="bodySemi" style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
            Royal Assembly
          </Txt>
        </View>
      </Animated.View>

      {/* Loading ticks */}
      <Animated.View style={{ flexDirection: "row", gap: 7, marginTop: 44, opacity: fade }}>
          {[0, 1, 2].map((i) => (
            <LoadingDot key={i} delay={i * 180} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

function LoadingDot({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        Animated.delay(540 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);

  return <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#F59E0B", opacity: v }} />;
}
