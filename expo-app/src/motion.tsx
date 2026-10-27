import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, LayoutChangeEvent, StyleProp, TextStyle, View, ViewStyle } from "react-native";

// ─── Reduce motion ────────────────────────────────────────────────────────────

/**
 * The phone's own "Reduce motion" / "Remove animations" setting, read once and
 * followed as it changes. Every animation below checks it: entrances land
 * instantly and the ambient loops (sheen, breathing, flicker, waving) stay
 * still. Motion can make some people unwell, and the setting is how they say so.
 */
let reduceMotion = false;
const reduceMotionListeners = new Set<(v: boolean) => void>();
const setReduceMotion = (v: boolean) => {
  reduceMotion = v;
  reduceMotionListeners.forEach((l) => l(v));
};
try {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
} catch {
  /* Not available on this platform — animations stay on. */
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(reduceMotion);
  useEffect(() => {
    reduceMotionListeners.add(setReduced);
    setReduced(reduceMotion);
    return () => {
      reduceMotionListeners.delete(setReduced);
    };
  }, []);
  return reduced;
}

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      t.setValue(1);
      return;
    }
    const timer = Animated.timing(t, {
      toValue: 1,
      duration,
      delay: delay + index * stagger,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    timer.start();
    return () => timer.stop();
  }, [t, index, stagger, delay, duration, reduced]);

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      t.setValue(1);
      return;
    }
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: DUR.slow,
      delay,
      easing: EASE_BACK,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, reduced]);

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
  const reduced = useReducedMotion();

  useEffect(() => {
    // With motion reduced the content simply changes; it stays fully opaque.
    if (reduced) return;
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
  }, [trigger, t, reduced]);

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
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
  }, [value, duration, delay, reduced]);

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
  const reduced = useReducedMotion();

  useEffect(() => {
    const a = Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : DUR.base,
      easing: EASE_OUT,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [open, anim, reduced]);

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, reduced]);

  return (
    <Animated.View style={[style, { transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [min, max] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** A sweep of light travelling across a surface — used on the primary CTA. */
export function Sheen({ width, height, radius = 0 }: { width: number; height: number; radius?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(2200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, reduced]);

  if (reduced) return null;

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
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const seq = Animated.stagger(
      140,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ),
    );
    seq.start();
    return () => seq.stop();
  }, [anims, reduced]);

  if (reduced) return null;

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

// ─── A hand that waves ────────────────────────────────────────────────────────

/**
 * Waves its child, the way a hand actually waves.
 *
 * The motion is a rotation, not a slide: a real wave pivots at the wrist, so the
 * fingers travel a long arc while the base barely moves. `transformOrigin` puts
 * the pivot at the bottom centre — rotating about the middle would make it look
 * like a windscreen wiper.
 *
 * It runs a burst of cycles and then rests, rather than waving forever. A
 * greeting that never stops stops reading as a greeting, and an endless
 * animation keeps the JS thread awake for no reason.
 *
 * The defaults are measured from the reference clip: about two cycles a second,
 * swinging roughly 24° either side of upright.
 */
export function WavingHand({
  children,
  /** Degrees either side of upright. */
  angle = 24,
  /** One cycle is out and back. */
  cycles = 5,
  /** Milliseconds for a single out-and-back. */
  period = 500,
  delay = 350,
}: {
  children: React.ReactNode;
  angle?: number;
  cycles?: number;
  period?: number;
  delay?: number;
}) {
  const swing = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const half = period / 2;
    const out = Animated.timing(swing, {
      toValue: 1,
      duration: half,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    const back = Animated.timing(swing, {
      toValue: -1,
      duration: half,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    const settle = Animated.timing(swing, {
      toValue: 0,
      duration: half,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    const anim = Animated.sequence([
      Animated.delay(delay),
      ...Array.from({ length: cycles }, () => Animated.sequence([out, back])),
      settle,
    ]);

    anim.start();
    return () => anim.stop();
  }, [swing, angle, cycles, period, delay, reduced]);

  return (
    <Animated.View
      style={{
        // The wrist, not the middle of the hand.
        transformOrigin: "bottom center",
        transform: [
          {
            rotate: swing.interpolate({
              inputRange: [-1, 1],
              outputRange: [`-${angle}deg`, `${angle}deg`],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── Typing ───────────────────────────────────────────────────────────────────

/**
 * Reveals text a character at a time, the way it would be typed.
 *
 * Returns the visible slice rather than rendering anything, so the caller keeps
 * its own typography — a greeting set in the display face stays in that face.
 *
 * Driven by a timer, not `requestAnimationFrame`: frames stop arriving when the
 * app is backgrounded, which would leave a half-typed word on screen until the
 * member came back. A failsafe lands the full string regardless, so the text can
 * never be stranded mid-word.
 *
 * The line is measured at its final width by the caller, so nothing reflows as
 * characters appear — text that pushes the layout around while it types reads as
 * a bug rather than an effect.
 */
export function useTypewriter(text: string, speed = 55, delay = 250) {
  const [count, setCount] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      return;
    }
    setCount(0);
    if (!text) return;

    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        setCount((n) => {
          if (n >= text.length) {
            clearInterval(timer);
            return n;
          }
          return n + 1;
        });
      }, speed);
    }, delay);

    // Whatever happens to the timers, the whole line is shown in the end.
    const settle = setTimeout(() => setCount(text.length), delay + text.length * speed + 400);

    return () => {
      clearTimeout(start);
      clearTimeout(settle);
      clearInterval(timer);
    };
  }, [text, speed, delay, reduced]);

  return { shown: text.slice(0, count), done: count >= text.length };
}

/**
 * A cursor that blinks while the line is still being typed, then goes away.
 *
 * Left running after the text has landed it would pull the eye back to a
 * finished sentence for the rest of the session.
 */
export function Caret({ visible, color = "#fff" }: { visible: boolean; color?: string }) {
  const blink = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!visible || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.15, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink, visible, reduced]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ width: 2, height: 22, marginLeft: 3, borderRadius: 1, backgroundColor: color, opacity: blink }}
    />
  );
}

/**
 * Text where every letter pops in on its own.
 *
 * Different from `useTypewriter`, which reveals a slice of a single string: here
 * each character is its own animated node that fades, lifts and scales into
 * place, so the word assembles letter by letter rather than being uncovered.
 *
 * Two things make it behave on a real screen:
 *
 * - **Every character is laid out from the start**, at opacity 0. Animating
 *   opacity rather than adding nodes means the line never reflows and the text
 *   below never jumps as the greeting lands.
 * - **Spaces are rendered, never skipped.** A space with zero opacity still
 *   occupies its width, so words keep their gaps while they arrive.
 *
 * Opacity and transform run on the native driver, so the stagger stays smooth
 * even while the dashboard is still fetching.
 */
export function PoppingText({
  text,
  style,
  /** Milliseconds between one letter and the next. */
  stagger = 38,
  delay = 200,
  duration = 260,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  stagger?: number;
  delay?: number;
  duration?: number;
}) {
  // A newline starts a new row; everything else is a character in the current one.
  const lines = text.split("\n");
  let index = 0;

  return (
    <View>
      {lines.map((line, lineNo) => {
        const chars = [...line];
        return (
          <View key={lineNo} style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {chars.map((ch, i) => (
              <PoppingChar
                key={`${lineNo}-${i}`}
                char={ch}
                style={style}
                delay={delay + index++ * stagger}
                duration={duration}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function PoppingChar({
  char,
  style,
  delay,
  duration,
}: {
  char: string;
  style?: StyleProp<TextStyle>;
  delay: number;
  duration: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: EASE_BACK,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [v, delay, duration, reduced]);

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          ],
        },
      ]}
    >
      {char === " " ? " " : char}
    </Animated.Text>
  );
}

/**
 * A flame that flickers.
 *
 * A streak is the one number on the dashboard that rewards coming back, so its
 * flame is the one thing worth keeping alive. The motion is deliberately small —
 * a slow breath in scale with a slight lean — because a marker that jumps about
 * next to a figure makes the figure harder to read, not easier.
 *
 * Both properties run on the native driver, so it costs nothing while the rest
 * of the dashboard is still loading.
 */
export function Flicker({
  children,
  duration = 1300,
}: {
  children: React.ReactNode;
  duration?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: duration * 0.8, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, reduced]);

  return (
    <Animated.View
      style={{
        transformOrigin: "bottom center",
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
