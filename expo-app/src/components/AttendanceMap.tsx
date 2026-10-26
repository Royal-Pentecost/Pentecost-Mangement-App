import React from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";

import { Fix } from "../location";
import GoogleAttendanceMap from "./GoogleAttendanceMap";
import StylisedMap from "./StylisedMap";

/**
 * Picks the map renderer for this phone.
 *
 * Google Maps when it can draw: an installed build made with a
 * GOOGLE_MAPS_API_KEY (see app.config.js), or Expo Go, which carries Google's
 * key itself. A build without a key would show Google's grey "for development
 * purposes only" tiles, so it gets the stylised map instead — plotted from the
 * same coordinates, so the boundary and the distance stay truthful.
 */
const googleReady =
  Constants.expoConfig?.extra?.googleMapsConfigured === true ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

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
  // With no boundary there is nothing to centre the map on.
  if (googleReady && fence) return <GoogleAttendanceMap fence={fence} fix={fix} inside={inside} height={height} />;
  return <StylisedMap fix={fix} fence={fence} inside={inside} height={height} />;
}
