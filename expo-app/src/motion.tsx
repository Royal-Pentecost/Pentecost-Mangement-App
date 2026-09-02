import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";

/**
 * Shared motion vocabulary. Everything here drives `transform`/`opacity` so it
 * can run on the native driver; anything that must animate layout says so.
 *
 * Durations are deliberately short — this is a utility app, not a showreel.
 * Entrances land in ~420ms, feedback in ~200ms.
 */
export const DUR = {
  fast: 180,
  base: 320,
  slow: 480,
} as const;

/** Standard ease-out — things arrive quickly then settle. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
/** A little overshoot for things that should feel springy. */
export const EASE_BACK = Easing.bezier(0.34, 1.4, 0.64, 1);

// ─── Entrance ─────────────────────────────────────────────────────────────────

/**
 * Fades and lifts its children into place on mount. `index` staggers a list so
 * rows cascade rather than all appearing at once.
 */
export function FadeIn({
  children,
  index = 0,
  stagger = 55,
  delay = 0,
  from = 14,
  duration = DUR.base,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  stagger?: number;
  delay?: number;
  from?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = Animated.timing(t, {
      toValue: 1,
      duration,
      delay: delay + index * stagger,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    timer.start();
    return () => timer.stop();
  }, [t, index, stagger, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Scales in from slightly small — for hero elements and avatars. */
export function PopIn({
  children,
  delay = 0,
  from = 0.9,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: DUR.slow,
      delay,
      easing: EASE_BACK,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Cross-fades whenever `trigger` changes — used when tab content swaps in place
 * so the switch reads as a transition rather than a jump cut.
 */
export function SwapFade({
  children,
  trigger,
  style,
}: {
  children: React.ReactNode;
  trigger: string | number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset through a zero-length timing rather than `t.setValue(0)`. The value
    // is native-driven, and writing to a native node from JS mid-flight is not
    // honoured reliably — when the write landed but the fade back in did not,
    // this whole view was left at opacity 0 and the page looked blank.
    const anim = Animated.sequence([
      Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(t, { toValue: 1, duration: DUR.base, easing: EASE_OUT, useNativeDriver: true }),
    ]);
    anim.start();

    // An interrupted transition must never strand the content invisible, so the
    // teardown always lands the view back at fully opaque.
    return () => {
      anim.stop();
      t.setValue(1);
    };
  }, [trigger, t]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Counts from zero up to `value`. Returns the live number so the caller keeps
 * full control of typography.
 */
export function useCountUp(value: number, duration = 900, delay = 200) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;
    let timeout: ReturnType<typeof setTimeout>;
    let settle: ReturnType<typeof setTimeout>;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      // Ease-out cubic so the tail slows into the final figure.
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };

    timeout = setTimeout(() => {
      raf.current = requestAnimationFrame(step);
    }, delay);

    // Frames stop arriving while the app is backgrounded, which would strand the
    // figure at zero. Land it on the real number regardless of how many ran.
    settle = setTimeout(() => setShown(value), delay + duration + 60);

    return () => {
      clearTimeout(timeout);
      clearTimeout(settle);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [value, duration, delay]);

  return shown;
}

// ─── Expand / collapse ────────────────────────────────────────────────────────

/**
 * Animates its own height between 0 and the measured content height, so
 * accordions slide instead of snapping. Height cannot use the native driver.
 */
export function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [height, setHeight] = useState(0);
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    const a = Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: DUR.base,
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [open, anim]);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== height) setHeight(h);
  };

  return (
    <Animated.View
      style={{
        height: height === 0 ? undefined : anim.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
        opacity: anim,
        overflow: "hidden",
      }}
    >
      {/* Measured off-flow on the first pass, then reused for the height range. */}
      <View onLayout={onLayout} style={height === 0 ? { position: "absolute", left: 0, right: 0 } : undefined}>
        {children}
      </View>
    </Animated.View>
  );
}

// ─── Ambient ──────────────────────────────────────────────────────────────────

/** Slow breathing scale — for live/"session open" indicators. */
export function Breathe({
  children,
  min = 1,
  max = 1.08,
  duration = 1400,
  style,
}: {
  children: React.ReactNode;
  min?: number;
  max?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  return (
    <Animated.View style={[style, { transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [min, max] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** A sweep of light travelling across a surface — used on the primary CTA. */
export function Sheen({ width, height, radius = 0 }: { width: number; height: number; radius?: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: width * 0.35,
        height,
        borderRadius: radius,
        backgroundColor: "rgba(255,255,255,0.16)",
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.4, width * 1.1] }) },
          { skewX: "-18deg" },
        ],
      }}
    />
  );
}

/**
 * Celebration burst — rings that expand and fade once, then stop. Fired when an
 * attendance mark succeeds.
 */
export function Burst({ size = 120, color = "#22C55E", rings = 3 }: { size?: number; color?: string; rings?: number }) {
  const anims = useMemo(() => Array.from({ length: rings }, () => new Animated.Value(0)), [rings]);

  useEffect(() => {
    const seq = Animated.stagger(
      140,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ),
    );
    seq.start();
    return () => seq.stop();
  }, [anims]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size,
            borderWidth: 2,
            borderColor: color,
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2] }) }],
          }}
        />
      ))}
    </View>
  );
}
