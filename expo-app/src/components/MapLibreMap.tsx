import React, { useMemo } from "react";
import { View } from "react-native";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import { Camera, GeoJSONSource, Layer, type LngLatBounds, Map } from "@maplibre/maplibre-react-native";

import { BRAND, useTheme } from "../theme";
import { Fix } from "../location";
import { Txt } from "../ui";

/**
 * The live attendance map, rendered natively.
 *
 * MapLibre draws through the GPU on the device rather than inside a WebView, so
 * panning and zooming are smooth and no JavaScript bridge sits between a new GPS
 * reading and the dot moving. The imagery underneath is still Esri's World
 * Imagery with Carto's labels over it — both serve openly with attribution, so
 * this needs no API key and no billing account.
 */

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const CARTO_LABELS = "https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png";

/** Metres per degree of latitude — near enough constant at this scale. */
const M_PER_DEG = 111_320;

/**
 * The two raster layers, declared as the map's base style.
 *
 * Satellite alone shows roofs; the label layer over it is what makes a building
 * recognisable as *your* building.
 */
const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: { type: "raster", tiles: [ESRI_IMAGERY], tileSize: 256, maxzoom: 19, attribution: "Imagery © Esri" },
    labels: {
      type: "raster",
      tiles: [CARTO_LABELS],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.9 } },
  ],
};

/**
 * A circle on the ground, as a polygon.
 *
 * MapLibre's circle layers are sized in *screen* pixels, so a boundary drawn
 * that way would keep its size as the map zooms and stop describing a real
 * distance. Approximating it as a many-sided polygon keeps it pinned to the
 * ground, which is the whole point of a geofence.
 */
function groundCircle(lat: number, lng: number, radiusM: number, points = 72): GeoJSON.Feature {
  const latScale = radiusM / M_PER_DEG;
  const lngScale = latScale / Math.max(0.2, Math.cos((lat * Math.PI) / 180));

  const ring: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    ring.push([lng + lngScale * Math.cos(angle), lat + latScale * Math.sin(angle)]);
  }

  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

export default function MapLibreMap({
  fence,
  fix,
  inside,
  height,
}: {
  fence: { lat: number; lng: number; radius: number };
  fix: Fix | null;
  inside: boolean;
  height: number;
}) {
  const { c, isDark } = useTheme();

  const fenceColour = isDark ? "#60A5FA" : "#1E3A8A";
  const userColour = inside ? BRAND.green : "#EF4444";

  const fenceShape = useMemo(
    () => groundCircle(fence.lat, fence.lng, fence.radius),
    [fence.lat, fence.lng, fence.radius],
  );

  // The accuracy halo is a ground circle too, so a vague reading looks vague at
  // every zoom instead of shrinking into a confident-looking dot.
  const haloShape = useMemo(
    () => (fix ? groundCircle(fix.lat, fix.lng, Math.max(fix.accuracy, 5)) : null),
    [fix?.lat, fix?.lng, fix?.accuracy], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const meShape = useMemo<GeoJSON.Feature | null>(
    () =>
      fix
        ? { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [fix.lng, fix.lat] } }
        : null,
    [fix?.lat, fix?.lng], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Frame the member and the boundary together, so the gap between them reads.
  const bounds = useMemo<LngLatBounds | null>(() => {
    if (!fix) return null;
    const pad = Math.max(fence.radius, fix.accuracy, 40) / M_PER_DEG;
    return [
      Math.min(fix.lng, fence.lng) - pad,
      Math.min(fix.lat, fence.lat) - pad,
      Math.max(fix.lng, fence.lng) + pad,
      Math.max(fix.lat, fence.lat) + pad,
    ];
  }, [fix?.lat, fix?.lng, fix?.accuracy, fence.lat, fence.lng, fence.radius]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ height, backgroundColor: isDark ? "#0D1730" : "#DDE9FF" }}>
      <Map style={{ flex: 1 }} mapStyle={BASE_STYLE} logo={false} touchRotate={false} touchPitch={false}>
        <Camera
          initialViewState={{ center: [fence.lng, fence.lat], zoom: 17 }}
          {...(bounds ? { bounds, padding: { top: 40, right: 40, bottom: 40, left: 40 } } : {})}
          duration={700}
        />

        {/* The boundary */}
        <GeoJSONSource id="fence" data={fenceShape}>
          <Layer id="fence-fill" type="fill" paint={{ "fill-color": fenceColour, "fill-opacity": 0.15 }} />
          <Layer id="fence-line" type="line" paint={{ "line-color": fenceColour, "line-width": 2 }} />
        </GeoJSONSource>

        {/* How precise the reading is */}
        {haloShape ? (
          <GeoJSONSource id="halo" data={haloShape}>
            <Layer id="halo-fill" type="fill" paint={{ "fill-color": userColour, "fill-opacity": 0.12 }} />
            <Layer id="halo-line" type="line" paint={{ "line-color": userColour, "line-width": 1 }} />
          </GeoJSONSource>
        ) : null}

        {/* The member */}
        {meShape ? (
          <GeoJSONSource id="me" data={meShape}>
            <Layer
              id="me-dot"
              type="circle"
              paint={{
                "circle-radius": 8,
                "circle-color": userColour,
                "circle-stroke-width": 3,
                "circle-stroke-color": "#FFFFFF",
              }}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      {!fix ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 14, alignItems: "center" }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: c.card }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, color: c.mutedForeground }}>
              Finding your location…
            </Txt>
          </View>
        </View>
      ) : null}
    </View>
  );
}
