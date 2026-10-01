import React from "react";

import { Fix } from "../location";
import StylisedMap from "./StylisedMap";

/**
 * Picks the map renderer for this platform.
 *
 * Expo Go does not bundle MapLibre's native module, so the shared device
 * renderer must not import it. This fallback keeps the attendance boundary and
 * GPS state usable in Expo Go. `MapLibreMap` remains available for a custom
 * development build that includes the native MapLibre plugin.
 */
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
  return <StylisedMap fix={fix} fence={fence} inside={inside} height={height} />;
}
