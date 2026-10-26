import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { BRAND, RADIUS, useTheme } from "../theme";
import { Fix } from "../location";
import { Btn, Txt } from "../ui";

/**
 * The live attendance map, drawn by Google Maps.
 *
 * The blue dot is Google's own: it follows the phone in real time, turns with
 * it, and draws its accuracy circle, all natively. The church's fixed boundary
 * is a circle on the ground, green while the member is inside it. The camera
 * frames the church and the member together once, then stays where the member
 * puts it — snapping back on every GPS reading would fight their thumb.
 */

/** Metres per degree of latitude — near enough constant at this scale. */
const M_PER_DEG = 111_320;

export default function GoogleAttendanceMap({
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
  const map = useRef<MapView>(null);
  const [satellite, setSatellite] = useState(false);
  // Once the member pans or zooms, the map is theirs.
  const [touched, setTouched] = useState(false);

  const fenceColour = inside ? BRAND.green : isDark ? "#60A5FA" : "#1E3A8A";

  // Frame the church and the member together, so the gap between them reads.
  useEffect(() => {
    if (!fix || touched) return;
    const pad = Math.max(fence.radius, 40) / M_PER_DEG;
    map.current?.fitToCoordinates(
      [
        { latitude: fence.lat + pad, longitude: fence.lng + pad },
        { latitude: fence.lat - pad, longitude: fence.lng - pad },
        { latitude: fix.lat, longitude: fix.lng },
      ],
      { edgePadding: { top: 60, right: 40, bottom: 40, left: 40 }, animated: true },
    );
  }, [fix?.lat, fix?.lng, fence.lat, fence.lng, fence.radius, touched]); // eslint-disable-line react-hooks/exhaustive-deps

  const span = (fence.radius * 5) / M_PER_DEG;

  return (
    <View style={{ height, backgroundColor: isDark ? "#0D1730" : "#DDE9FF" }}>
      <MapView
        ref={map}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        mapType={satellite ? "hybrid" : "standard"}
        initialRegion={{ latitude: fence.lat, longitude: fence.lng, latitudeDelta: span, longitudeDelta: span }}
        showsUserLocation
        showsMyLocationButton
        userLocationPriority="high"
        userLocationUpdateInterval={2000}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        mapPadding={{ top: 48, right: 0, bottom: 0, left: 0 }}
        onPanDrag={() => setTouched(true)}
      >
        {/* The church's fixed boundary */}
        <Circle
          center={{ latitude: fence.lat, longitude: fence.lng }}
          radius={fence.radius}
          strokeWidth={2}
          strokeColor={fenceColour}
          fillColor={inside ? "rgba(22,163,74,0.16)" : "rgba(30,58,138,0.14)"}
        />
        <Marker
          coordinate={{ latitude: fence.lat, longitude: fence.lng }}
          title="Royal Assembly"
          description={`Attendance can be signed within ${Math.round(fence.radius)} m`}
          pinColor={inside ? "green" : "navy"}
        />
      </MapView>

      {/* Map ↔ satellite */}
      <Btn
        onPress={() => setSatellite((s) => !s)}
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: RADIUS.pill,
          backgroundColor: isDark ? "rgba(10,16,32,0.8)" : "rgba(255,255,255,0.94)",
        }}
      >
        <Txt variant="bodySemi" style={{ fontSize: 11, color: isDark ? BRAND.blueLight : BRAND.navy }}>
          {satellite ? "Map" : "Satellite"}
        </Txt>
      </Btn>

      {!fix ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 14, alignItems: "center" }}>
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
