import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";

import { Geofence } from "./data";

/**
 * Where the member actually is.
 *
 * The rule the app enforces is simple: attendance may only be signed while the
 * admin's session is open *and* the phone is standing inside the geofence that
 * admin drew. Everything needed to decide that lives here, so no screen has to
 * re-derive it and the two can never disagree.
 *
 * Accuracy matters more than it looks. A phone that reports ±80m while standing
 * 60m outside a 100m fence would be waved in on a reading that cannot support
 * the claim, so `certainty` grades the fix and the UI says which way it leans
 * rather than pretending to a precision the hardware does not have.
 */

export type LocationPhase =
  /** Nothing asked for yet — the app has only just opened. */
  | "idle"
  /** Waiting on the OS permission dialog. */
  | "asking"
  /** Permission granted, first fix not in yet. */
  | "locating"
  /** We have a position. */
  | "ready"
  /** The member said no. They can still be signed in manually by an admin. */
  | "denied"
  /** Location services are switched off device-wide. */
  | "disabled"
  /** Permission is fine but no fix arrived (indoors, airplane mode, emulator). */
  | "unavailable";

export interface Fix {
  lat: number;
  lng: number;
  /** Radius of the horizontal 68% confidence circle, in metres. */
  accuracy: number;
  /** When the fix was taken. */
  at: number;
}

export type Certainty =
  /** The fix is precise enough that inside/outside is not in doubt. */
  | "confident"
  /** The accuracy circle straddles the fence — the answer could go either way. */
  | "borderline"
  /** Too coarse to say anything useful. */
  | "poor";

interface LocationValue {
  phase: LocationPhase;
  fix: Fix | null;
  /** Metres from the geofence centre, or null with no fix. */
  distance: number | null;
  /** True only when we have a fix and it sits within the fence. */
  inside: boolean;
  certainty: Certainty;
  /** Human-readable reason the member cannot sign right now, or null if they can. */
  blockedReason: string | null;
  /** Ask again after a denial, or kick off a fresh fix. */
  refresh: () => Promise<void>;
  /** Follow the phone continuously. Returns a stop function. Used by the map. */
  startWatching: () => () => void;
}

const LocationCtx = createContext<LocationValue | null>(null);

/** Metres between two coordinates, by the haversine formula. */
export function distanceMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The geofence is typed by hand in the admin hub, so it arrives as strings. */
export function parseGeofence(g: Geofence): { lat: number; lng: number; radius: number } | null {
  const lat = Number(g.lat);
  const lng = Number(g.lng);
  const radius = Number(g.radius);

  const sane =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(radius) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    radius > 0;

  return sane ? { lat, lng, radius } : null;
}

/** A fix older than this is stale enough to be worth replacing before trusting it. */
const STALE_AFTER = 60_000;

export function LocationProvider({ geofence, children }: { geofence: Geofence; children: React.ReactNode }) {
  const [phase, setPhase] = useState<LocationPhase>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const watchers = useRef(0);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const record = useCallback((p: Location.LocationObject) => {
    setFix({
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      // Android can report a null accuracy; treat that as "unknown but wide".
      accuracy: p.coords.accuracy ?? 999,
      at: p.timestamp,
    });
    setPhase("ready");
  }, []);

  /** Ask for permission and take one reading. Safe to call repeatedly. */
  const acquire = useCallback(async () => {
    try {
      // Web asks for permission on the first read, so there is nothing to enable.
      if (Platform.OS !== "web") {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setPhase("disabled");
          return;
        }
      }

      setPhase((p) => (p === "ready" ? p : "asking"));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPhase("denied");
        return;
      }

      setPhase((p) => (p === "ready" ? p : "locating"));

      // A recent fix comes back instantly and is usually good enough to render
      // the map with; the precise read then refines it a moment later.
      const last = await Location.getLastKnownPositionAsync({ maxAge: STALE_AFTER });
      if (last) record(last);

      const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      record(now);
    } catch {
      // Thrown when there is no provider at all — an emulator with no fake
      // location set, or a browser that refuses silently.
      setPhase((p) => (p === "ready" ? p : "unavailable"));
    }
  }, [record]);

  // Read the member's position as soon as they are in the app, so the
  // attendance screen already knows where they stand when they open it.
  useEffect(() => {
    void acquire();
  }, [acquire]);

  // Coming back from the OS settings screen is the usual way a denial or a
  // switched-off GPS gets fixed, so re-check on foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && (phase === "denied" || phase === "disabled" || phase === "unavailable")) {
        void acquire();
      }
    });
    return () => sub.remove();
  }, [acquire, phase]);

  /**
   * Continuous tracking, reference-counted: the map and any other caller share
   * one OS subscription, and it stops when the last of them lets go. A live
   * GPS stream is expensive, so nothing subscribes unless a screen is showing it.
   */
  const startWatching = useCallback(() => {
    let released = false;
    watchers.current += 1;

    if (watchers.current === 1) {
      void (async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== Location.PermissionStatus.GRANTED) return;

          const sub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
            record,
          );
          // The last watcher may have gone while we were awaiting the handle.
          if (watchers.current === 0) sub.remove();
          else subscription.current = sub;
        } catch {
          /* Falls back to the single fix already taken. */
        }
      })();
    }

    return () => {
      if (released) return;
      released = true;
      watchers.current = Math.max(0, watchers.current - 1);
      if (watchers.current === 0) {
        subscription.current?.remove();
        subscription.current = null;
      }
    };
  }, [record]);

  useEffect(() => () => subscription.current?.remove(), []);

  const fence = useMemo(() => parseGeofence(geofence), [geofence]);

  const { distance, inside, certainty } = useMemo(() => {
    if (!fix || !fence) {
      return { distance: null as number | null, inside: false, certainty: "poor" as Certainty };
    }

    const d = distanceMetres(fix.lat, fix.lng, fence.lat, fence.lng);
    const within = d <= fence.radius;

    // If the accuracy circle reaches across the boundary, the reading cannot
    // settle the question on its own.
    const straddles = Math.abs(d - fence.radius) < fix.accuracy;
    const grade: Certainty = fix.accuracy > 120 ? "poor" : straddles ? "borderline" : "confident";

    return { distance: d, inside: within, certainty: grade };
  }, [fix, fence]);

  const blockedReason = useMemo(() => {
    if (!fence) return "This assembly has no attendance boundary set yet. Ask an admin to set one.";
    if (phase === "denied") return "Location permission is off, so the app cannot confirm you are in the auditorium.";
    if (phase === "disabled") return "Location services are switched off on this phone.";
    if (phase === "unavailable") return "No GPS signal yet. Step near a window or outside for a moment.";
    if (!fix) return "Finding your location…";
    if (certainty === "poor") return "The GPS signal is too weak to confirm where you are.";
    if (!inside) return "You are outside the auditorium boundary.";
    return null;
  }, [fence, phase, fix, inside, certainty]);

  const value = useMemo<LocationValue>(
    () => ({ phase, fix, distance, inside, certainty, blockedReason, refresh: acquire, startWatching }),
    [phase, fix, distance, inside, certainty, blockedReason, acquire, startWatching],
  );

  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export function useLocation(): LocationValue {
  const v = useContext(LocationCtx);
  if (!v) throw new Error("useLocation must be used inside a LocationProvider");
  return v;
}
