import React from "react";

import { Fix } from "../location";
import MapLibreMap from "./MapLibreMap";
import StylisedMap from "./StylisedMap";

/**
 * Picks the map renderer for this platform.
 *
 * On a device that is MapLibre: a real satellite map, drawn natively through the
 * GPU, needing no API key and no billing account. `StylisedMap` is only for the
 * case where there is no boundary and no fix to centre on — nothing to draw yet.
 *
 * The web preview has no MapLibre native module, so `AttendanceMap.web.tsx`
 * resolves there instead and falls back to the stylised map.
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
  const centre = fence ?? (fix ? { lat: fix.lat, lng: fix.lng, radius: 100 } : null);

  if (!centre) return <StylisedMap fix={fix} fence={fence} inside={inside} height={height} />;

  return <MapLibreMap fence={centre} fix={fix} inside={inside} height={height} />;
}
