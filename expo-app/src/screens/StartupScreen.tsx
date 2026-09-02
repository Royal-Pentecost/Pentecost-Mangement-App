import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../theme";
import { splashMark, splashMarkLight } from "../data";
import { Txt } from "../ui";

/**
 * Ground colours. Each must match the matching `backgroundColor` in app.json's
 * expo-splash-screen config, or the native splash visibly flashes as it hands
 * over to this screen.
 */
export const STARTUP_BG = "#FFFFFF";
export const STARTUP_BG_DARK ="#4166f5";

const ACCENT = "#4166F5";

/** Light mode reads as an ivory page; dark mode as a deep purple night. */
const PALETTE = {
  light: {
    gradient: ["#FFFFFF", "#EDF0FD"] as const,
    mark: splashMarkLight,
    title: "#2A0169",
    rule: ACCENT,
    halo: ACCENT,
    subtitle: "rgba(42,1,105,0.55)",
    footer: "rgba(42,1,105,0.38)",
  },
  dark: {
    gradient: [STARTUP_BG_DARK, "#0D0320"] as const,
    mark: splashMark,
    title: "#FFFFFF",
    rule: "#F0B429",
    halo: "#F0B429",
    subtitle: "rgba(255,255,255,0.55)",
    footer: "rgba(255,255,255,0.4)",
  },
};

/**
 * The first thing the app draws. It picks up from the native splash — same
 * ground, same mark, same size — then animates and fades out into the app, so
 * launch reads as one continuous moment rather than two screens.
 */
export default function StartupScreen({ onDone }: { onDone: () => void }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const p = isDark ? PALETTE.dark : PALETTE.light;

  const markScale = useRef(new Animated.Value(1)).current;
  const markRise = useRef(new Animated.Value(0)).current;
  const ringGrow = useRef(new Animated.Value(0)).current;
  const wordFade = useRef(new Animated.Value(0)).current;
  const wordRise = useRef(new Animated.Value(14)).current;
  const ruleScale = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;

  // The column's height is only known once it has been laid out, and the seal's
  // starting offset depends on it — so the sequence waits for that measurement
  // rather than guessing at the height of two lines of type.
  const [measured, setMeasured] = useState(false);

  const onColumnLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (measured) return;
      const h = e.nativeEvent.layout.height;
      // Drop the seal back down to where the native splash had it: the screen's
      // centre. Half the column, less half the seal, is exactly that distance.
      markRise.setValue(Math.max(0, h / 2 - 100));
      setMeasured(true);
    },
    [markRise, measured],
  );

  useEffect(() => {
    if (!measured) return;
    Animated.sequence([
      Animated.parallel([
        // A slow breath on the mark, so it feels alive without moving position.
        Animated.sequence([
          Animated.timing(markScale, { toValue: 1.07, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(markScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        // The seal settling up into the composition as the type appears beneath it.
        Animated.timing(markRise, { toValue: 0, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        // Two halos, the second trailing the first.
        Animated.timing(ringGrow, { toValue: 1, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(420),
          Animated.parallel([
            Animated.timing(wordFade, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(wordRise, { toValue: 0, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(ruleScale, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
      ]),
      // Hold on the finished mark, with the dots still running.
      Animated.delay(1500),
      Animated.timing(exit, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });

  }, [measured, markScale, markRise, ringGrow, wordFade, wordRise, ruleScale, exit, onDone]);

  // Belt and braces: neither a stalled animation nor a layout pass that never
  // arrives may strand the user on this screen.
  useEffect(() => {
    const failsafe = setTimeout(onDone, 7500);
    return () => clearTimeout(failsafe);
  }, [onDone]);

  return (
    <Animated.View style={{ flex: 1, opacity: exit }}>
      <LinearGradient
        colors={p.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: insets.bottom }}
      >
        {/* Seal, wordmark and dots are one centred column, so the composition sits
            in the middle of the screen as a whole. */}
        <View onLayout={onColumnLayout} style={{ alignItems: "center" }}>
          {/* The seal starts life at the screen's true centre — exactly where the
              native splash left it — then rises into the composition, so the
              hand-off reads as one continuous moment rather than a jump. */}
          <Animated.View
            style={{
              width: 200,
              height: 200,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateY: markRise }],
            }}
          >
            {/* Halo expanding out from behind the seal */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: 130,
                borderWidth: 1,
                borderColor: p.halo,
                opacity: ringGrow.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.28, 0] }),
                transform: [{ scale: ringGrow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.7] }) }],
              }}
            />

            {/* The mark, at the same 200px the native splash used */}
            <Animated.Image
              source={p.mark}
              resizeMode="contain"
              style={{ width: 200, height: 200, transform: [{ scale: markScale }] }}
            />
          </Animated.View>

        <Animated.View
          style={{
            alignItems: "center",
            opacity: wordFade,
            transform: [{ translateY: wordRise }],
          }}
        >
          <Txt
            variant="displayExtraBold"
            style={{ fontSize: 19, letterSpacing: 3.4, textAlign: "center", color: p.title, marginTop: 26 }}
          >
            THE CHURCH OF
          </Txt>
          <Txt
            variant="displayExtraBold"
            style={{ fontSize: 27, letterSpacing: 5.2, textAlign: "center", color: p.title, marginTop: 2 }}
          >
            PENTECOST
          </Txt>

          <Animated.View
            style={{
              height: 1,
              width: 132,
              marginTop: 16,
              backgroundColor: p.rule,
              transform: [{ scaleX: ruleScale }],
            }}
          />

          <Txt
            variant="bodySemi"
            style={{ fontSize: 11, letterSpacing: 2.6, textAlign: "center", color: p.subtitle, marginTop: 16 }}
          >
            ROYAL ASSEMBLY
          </Txt>

          {/* Loading dots — the app is still waking up behind this screen. */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 40 }}>
            {[0, 1, 2].map((i) => (
              <LoadingDot key={i} delay={i * 190} color={p.rule} />
            ))}
          </View>
        </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View style={{ position: "absolute", bottom: insets.bottom + 34, opacity: wordFade }}>
          <Txt variant="bodyMedium" style={{ fontSize: 11, letterSpacing: 1.4, color: p.footer }}>
            ATTENDANCE &amp; MEMBERSHIP APP
          </Txt>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

/** One dot in the loading row, pulsing on a stagger. */
function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const v = useRef(new Animated.Value(0.22)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.22, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);

  return (
    <Animated.View
      style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity: v, transform: [{ scale: v }] }}
    />
  );
}
