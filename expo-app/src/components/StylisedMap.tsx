import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";

import { BRAND, useTheme } from "../theme";
import { Fix } from "../location";
import { MapGrid } from "../icons";
import { Txt } from "../ui";

/**
 * The map we draw ourselves, used on the web preview and on any Android build
 * with no Google Maps key. It is not a real map, but it is not a decoration
 * either: the fence and the member's dot are plotted from the same coordinates
 * the real map uses, so the distance and the side of the boundary are truthful.
 */

const FENCE_PX = 190;

/** Metres per degree of latitude — near enough constant for a church car park. */
const M_PER_DEG = 111_320;

export default function StylisedMap({
  fix,
  fence,
  inside,
  height,
}: {
  fix: Fix | null;
  fence: { lat: number; lng: number; radius: number } | null;
  inside: boolean;
  height: number;
}) {
  const { c, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // The dot slides to its new position rather than teleporting on each fix.
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  // Plot the member relative to the fence centre, scaled so the fence radius is
  // half the drawn circle. Clamped, so someone a mile away still shows on-screen.
  let offsetX = 0;
  let offsetY = 0;
  if (fix && fence) {
    const scale = FENCE_PX / 2 / fence.radius; // pixels per metre
    const east = (fix.lng - fence.lng) * M_PER_DEG * Math.cos((fence.lat * Math.PI) / 180);
    const north = (fix.lat - fence.lat) * M_PER_DEG;

    const limit = FENCE_PX * 0.92;
    offsetX = Math.max(-limit, Math.min(limit, east * scale));
    // Screen y grows downward; north is up.
    offsetY = Math.max(-limit, Math.min(limit, -north * scale));
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(x, { toValue: offsetX, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(y, { toValue: offsetY, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [offsetX, offsetY, x, y]);

  const userColor = inside ? BRAND.green : "#EF4444";

  return (
    <View style={{ height, backgroundColor: isDark ? "#0D1730" : "#DDE9FF" }}>
      <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
        <MapGrid width={Math.max(400, screenWidth)} height={height} color={isDark ? BRAND.blue : BRAND.navy} />
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* The geofence */}
        <View
          style={{
            position: "absolute",
            width: FENCE_PX,
            height: FENCE_PX,
            borderRadius: FENCE_PX / 2,
            backgroundColor: isDark ? "rgba(96,165,250,0.10)" : "rgba(30,58,138,0.08)",
            borderWidth: 2,
            borderColor: isDark ? "rgba(96,165,250,0.45)" : "rgba(30,58,138,0.35)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: FENCE_PX - 44,
            height: FENCE_PX - 44,
            borderRadius: (FENCE_PX - 44) / 2,
            borderWidth: 1,
            borderColor: isDark ? "rgba(96,165,250,0.28)" : "rgba(30,58,138,0.2)",
          }}
        />

        {/* The member */}
        {fix ? (
          <Animated.View
            style={{
              position: "absolute",
              transform: [{ translateX: x }, { translateY: y }],
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: userColor,
                borderWidth: 3,
                borderColor: "#fff",
              }}
            />
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: c.card }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, color: c.mutedForeground }}>
              Finding your location…
            </Txt>
          </View>
        )}
      </View>
    </View>
  );
}
