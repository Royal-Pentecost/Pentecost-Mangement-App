import React, { useEffect } from "react";
import { Image, Linking, ScrollView, View } from "react-native";

import { BRAND, RADIUS, useTheme } from "../theme";
import { pentecostLogo } from "../data";
import { useContent } from "../store";
import { parseGeofence, useLocation } from "../location";
import { CheckIcon } from "../icons";
import { Btn, Card, Ping, SectionHeading, StatusDot, Txt, shadow } from "../ui";
import { Breathe, Burst, PopIn, Sheen } from "../motion";
import AttendanceMap from "../components/AttendanceMap";

const MAP_HEIGHT = 280;

/** Metres, rounded the way a person would say it. */
function saySpan(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export default function AttendanceTab({
  sessionActive,
  attendanceMarked,
  onMarkAttendance,
  bottomInset,
}: {
  sessionActive: boolean;
  attendanceMarked: boolean;
  onMarkAttendance: () => void;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  const { geofence } = useContent();
  const { phase, fix, distance, inside, certainty, blockedReason, refresh, startWatching } = useLocation();

  // Follow the phone only while this screen is open — a live GPS stream is the
  // most expensive thing the app can do to a battery.
  useEffect(() => startWatching(), [startWatching]);

  const fence = parseGeofence(geofence);

  // Attendance may be signed only when the session is open, the fix is good
  // enough to trust, and it puts the member inside the boundary.
  const locationOk = inside && certainty !== "poor";
  const canMark = sessionActive && locationOk && !attendanceMarked;

  const label = !sessionActive
    ? "Attendance Session Closed"
    : attendanceMarked
      ? "Attendance Marked"
      : !fix
        ? "Finding your location…"
        : !locationOk
          ? "Out of Range — move inside the auditorium"
          : "Mark Attendance Now";

  const permissionProblem = phase === "denied" || phase === "disabled";
  const userColor = inside ? BRAND.green : "#EF4444";

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      {/* Conditions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Card style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 }}>
            {sessionActive ? (
              <StatusDot size={9} color={BRAND.green} ping />
            ) : (
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#94A3B8" }} />
            )}
            <Txt variant="bodySemi" style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: c.mutedForeground }}>
              Session
            </Txt>
          </View>
          <Txt variant="displayBold" style={{ fontSize: 15, color: sessionActive ? (isDark ? BRAND.greenLight : "#15803D") : c.foreground }}>
            {sessionActive ? "Open" : "Closed"}
          </Txt>
        </Card>

        <Card style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: fix ? userColor : "#94A3B8" }} />
            <Txt variant="bodySemi" style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: c.mutedForeground }}>
              Location
            </Txt>
          </View>
          <Txt variant="displayBold" style={{ fontSize: 15, color: fix ? (inside ? c.primary : c.foreground) : c.foreground }}>
            {!fix ? "Locating…" : inside ? "Inside" : "Outside"}
          </Txt>
          {fix && distance !== null ? (
            <Txt variant="bodyMedium" style={{ fontSize: 11, marginTop: 2, color: c.mutedForeground }}>
              {inside ? `${saySpan(distance)} from centre` : `${saySpan(distance)} away`}
            </Txt>
          ) : null}
        </Card>
      </View>

      {/* Live map */}
      <SectionHeading label="Live Location" />

      <View style={[{ borderRadius: RADIUS.xl, overflow: "hidden" }, shadow("sm")]}>
        <AttendanceMap fence={fence} fix={fix} inside={inside} height={MAP_HEIGHT} />

        {/* Overlay chips */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <View style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: isDark ? "rgba(10,16,32,0.75)" : "rgba(255,255,255,0.9)" }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, color: isDark ? BRAND.blueLight : BRAND.navy }}>
              Royal Assembly
            </Txt>
          </View>
          <View style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: isDark ? "rgba(10,16,32,0.75)" : "rgba(255,255,255,0.9)" }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, color: fix ? (inside ? (isDark ? BRAND.greenLight : "#15803D") : "#EF4444") : c.mutedForeground }}>
              {!fix ? "Locating…" : inside ? "You are inside" : "You are outside"}
            </Txt>
          </View>
        </View>
      </View>

      {/* Accuracy — say how sure we are, rather than implying certainty. */}
      {fix ? (
        <Txt variant="bodyMedium" style={{ fontSize: 11, marginTop: 8, textAlign: "center", color: c.mutedForeground }}>
          {certainty === "confident"
            ? `GPS accurate to about ${saySpan(fix.accuracy)}`
            : certainty === "borderline"
              ? `Accurate to about ${saySpan(fix.accuracy)} — too close to the boundary to be sure`
              : `Weak signal — accurate only to about ${saySpan(fix.accuracy)}`}
        </Txt>
      ) : null}

      {/* Permission problems are the one thing the member can actually fix. */}
      {permissionProblem ? (
        <Card style={{ marginTop: 12, padding: 14 }} borderColor={isDark ? "#7F1D1D" : "#FBD5D5"}>
          <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
            {phase === "disabled" ? "Location is switched off" : "Location permission needed"}
          </Txt>
          <Txt style={{ fontSize: 12.5, lineHeight: 18, marginTop: 4, color: c.mutedForeground }}>
            {phase === "disabled"
              ? "Turn on location services so the app can confirm you are in the auditorium."
              : "The app reads your location only while you mark attendance, to confirm you are inside the auditorium."}
          </Txt>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Btn
              onPress={refresh}
              style={{ flex: 1, paddingVertical: 11, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
            >
              <Txt variant="displayBold" style={{ fontSize: 13, color: c.foreground }}>
                Try Again
              </Txt>
            </Btn>
            <Btn
              onPress={() => { try { void Linking.openSettings(); } catch { /* not available on this platform */ } }}
              style={{ flex: 1, paddingVertical: 11, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: isDark ? BRAND.blue : BRAND.navy }}
            >
              <Txt variant="displayBold" style={{ fontSize: 13, color: isDark ? "#0A1020" : "#fff" }}>
                Open Settings
              </Txt>
            </Btn>
          </View>
        </Card>
      ) : (
        <Btn
          onPress={refresh}
          style={{ marginTop: 10, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
        >
          <Txt variant="bodySemi" style={{ fontSize: 12, color: c.mutedForeground }}>
            Refresh my location
          </Txt>
        </Btn>
      )}

      {/* CTA */}
      <Breathe min={1} max={canMark ? 1.018 : 1} duration={2200} style={{ marginTop: 16 }}>
        <Btn
          onPress={canMark ? onMarkAttendance : undefined}
          disabled={!canMark}
          style={{
            overflow: "hidden",
            paddingVertical: 18,
            paddingHorizontal: 16,
            borderRadius: RADIUS.lg,
            alignItems: "center",
            backgroundColor: canMark ? (isDark ? BRAND.blue : BRAND.navy) : c.muted,
          }}
        >
          <Txt
            variant="displayBold"
            style={{ fontSize: 15, textAlign: "center", lineHeight: 21, color: canMark ? (isDark ? "#0A1020" : "#fff") : c.mutedForeground }}
          >
            {label}
          </Txt>
          {canMark ? <Sheen width={520} height={64} radius={RADIUS.lg} /> : null}
        </Btn>
      </Breathe>

      {/* Why the button is dark, when it is. */}
      {!attendanceMarked && sessionActive && blockedReason ? (
        <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 8, textAlign: "center", color: c.mutedForeground }}>
          {blockedReason}
        </Txt>
      ) : null}

      {attendanceMarked ? (
        <PopIn from={0.94} style={{ marginTop: 12 }}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#16A34A22" : "#E7F8EF" }}>
              <Burst size={110} color={BRAND.green} />
              <CheckIcon size={18} color={BRAND.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="displayBold" style={{ fontSize: 15, color: isDark ? BRAND.greenLight : "#15803D" }}>
                Attendance Recorded
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
                {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} · Royal Assembly
              </Txt>
            </View>
          </Card>
        </PopIn>
      ) : null}

      {/* Session banner */}
      {sessionActive && !attendanceMarked ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14, justifyContent: "center" }}>
          <Ping color={BRAND.green} size={8} />
          <Txt variant="bodyMedium" style={{ fontSize: 12, color: c.mutedForeground }}>
            Attendance is open now
          </Txt>
        </View>
      ) : null}

      {!sessionActive ? (
        <View style={{ alignItems: "center", marginTop: 20, opacity: 0.85 }}>
          <Image source={pentecostLogo} style={{ width: 46, height: 46 }} resizeMode="contain" />
          <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 8, textAlign: "center", color: c.mutedForeground }}>
            No attendance session is open right now
          </Txt>
        </View>
      ) : null}
    </ScrollView>
  );
}
