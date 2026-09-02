import React from "react";

import { Fix } from "../location";
import StylisedMap from "./StylisedMap";

/**
 * MapLibre draws through a native module, which the web preview does not have.
 * The preview gets the stylised map instead — plotted from the same coordinates,
 * so the boundary, the distance and which side of it the member is on stay
 * truthful. Only the ground underneath is ours rather than satellite imagery.
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
