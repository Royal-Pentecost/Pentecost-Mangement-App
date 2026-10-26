import React from "react";
import { TurboModuleRegistry } from "react-native";

import { Fix } from "../location";
import StylisedMap from "./StylisedMap";

/**
 * Picks the map renderer for this phone.
 *
 * An installed build (EAS or a local APK) carries MapLibre's native module, so
 * it gets the real satellite map with the member's live GPS dot on it. Expo Go
 * does not bundle that module, and importing the library there throws at load
 * time — so it is required only once the native side is known to exist, and
 * Expo Go keeps the stylised map, plotted from the same coordinates.
 */
type MapLibreMapComponent = typeof import("./MapLibreMap").default;

const NativeMap: MapLibreMapComponent | null = (() => {
  try {
    if (!TurboModuleRegistry.get("MLRNCameraModule")) return null;
    return (require("./MapLibreMap") as { default: MapLibreMapComponent }).default;
  } catch {
    return null;
  }
})();

export default function AttendanceMap({
  fence,
  fix,
  inside,
  height,
}: {
  fence: { lat: number; lng: number; radius: number } | null;
  fix: Fix | null;
  inside: boolean;
  height: number;
}) {
  // With no boundary there is nothing to centre the satellite view on.
  if (NativeMap && fence) return <NativeMap fence={fence} fix={fix} inside={inside} height={height} />;
  return <StylisedMap fix={fix} fence={fence} inside={inside} height={height} />;
}
