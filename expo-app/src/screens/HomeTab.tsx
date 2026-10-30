import React, { useState } from "react";
import { Image, Modal, Pressable, ScrollView, View } from "react-native";

import { BRAND, RADIUS, TintName, useTheme } from "../theme";
import { Assembly, LoginRole, ME, canViewMembers, othersOnly, visibleMembers } from "../data";
import { useDirectory, useMe } from "../directory";
import { ChevronRightIcon, FolderIcon, HomeIcon, PlayIcon, ShieldIcon, StopIcon, UsersIcon } from "../icons";
import { Btn, Card, StatusDot, TintTile, Txt, tintFg } from "../ui";
import { FadeIn, PopIn } from "../motion";
import { useContent } from "../store";
import LatestVideoCard from "../components/LatestVideoCard";
import { useTodayAttendance } from "../today";
import { useSession } from "../session";
import { addressOf } from "../naming";
import { usePullToRefresh } from "../refresh";

// ─── Admin session panel ──────────────────────────────────────────────────────

function AdminPanel({
  assembly,
  sessionActive,
  sessionStartTime,
  membersPresent,
  firstTimers,
  onActivate,
  onTerminate,
  onOpenAdminHub,
}: {
  assembly: Assembly;
  sessionActive: boolean;
  sessionStartTime: string | null;
  membersPresent: number;
  firstTimers: number;
  onActivate: () => void | Promise<void>;
  onTerminate: () => void | Promise<void>;
  onOpenAdminHub: () => void;
}) {
  const { c, isDark } = useTheme();
  // Both buttons ask first: opening lets the whole assembly sign in, and closing
  // shuts out anyone still on their way.
  const [confirming, setConfirming] = useState<"activate" | "terminate" | null>(null);
  const terminating = confirming === "terminate";

  return (
    <Card style={{ padding: 14, gap: 14 }} borderColor={isDark ? BRAND.blue : "#DBE3F7"}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TintTile tint="blue" size={34} radius={RADIUS.sm}>
            <ShieldIcon size={16} color={tintFg("blue", isDark)} />
          </TintTile>
          <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
            Admin Session Panel
          </Txt>
        </View>
        {sessionActive && sessionStartTime ? (
          <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: isDark ? "#14532D44" : "#E7F8EF" }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, color: isDark ? BRAND.greenLight : "#15803D" }}>
              Since {sessionStartTime}
            </Txt>
          </View>
        ) : null}
      </View>

      <View style={{ borderRadius: RADIUS.md, paddingVertical: 14, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: c.muted }}>
        <View style={{ alignItems: "center" }}>
          <Txt variant="displayExtraBold" style={{ fontSize: 24, color: c.primary }}>
            {membersPresent}
          </Txt>
          <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>Members Present</Txt>
        </View>
        <View style={{ width: 1, height: 34, backgroundColor: c.border }} />
        <View style={{ alignItems: "center" }}>
          <Txt variant="displayExtraBold" style={{ fontSize: 24, color: isDark ? BRAND.goldLight : BRAND.gold }}>
            {firstTimers}
          </Txt>
          <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>First Timers</Txt>
        </View>
      </View>

      <Btn
        onPress={() => setConfirming(sessionActive ? "terminate" : "activate")}
        style={{
          paddingVertical: 15,
          borderRadius: RADIUS.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: sessionActive ? "#EF4444" : "#16A34A",
        }}
      >
        {sessionActive ? <StopIcon size={14} /> : <PlayIcon size={14} />}
        <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
          {sessionActive ? "Terminate Attendance Session" : "Activate Attendance Session"}
        </Txt>
      </Btn>

      <Modal
        visible={confirming !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirming(null)}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(7,12,24,0.62)" }}>
          <Pressable
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            onPress={() => setConfirming(null)}
          />
          <View style={{ width: "100%", maxWidth: 360, padding: 22, borderRadius: RADIUS.xl, backgroundColor: c.card }}>
            <Txt variant="displayExtraBold" style={{ fontSize: 20, color: c.foreground }}>
              {terminating ? "Terminate attendance?" : "Activate attendance?"}
            </Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, marginTop: 8, color: c.mutedForeground }}>
              {terminating
                ? `${membersPresent} ${membersPresent === 1 ? "member has" : "members have"} signed in. Once you close it, anyone still arriving at ${assembly.name} cannot mark attendance. This cannot be undone.`
                : `This will open attendance for members at ${assembly.name}. Are you sure you want to continue?`}
            </Txt>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Btn
                onPress={() => setConfirming(null)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>Cancel</Txt>
              </Btn>
              <Btn
                // Waits for the server, so the button spins and the dialog stays
                // up until the session has really opened or closed.
                onPress={async () => {
                  try {
                    await (terminating ? onTerminate() : onActivate());
                  } finally {
                    setConfirming(null);
                  }
                }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: terminating ? "#EF4444" : "#16A34A" }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>{terminating ? "Terminate" : "Activate"}</Txt>
              </Btn>
            </View>
          </View>
        </View>
      </Modal>

      <Btn
        onPress={onOpenAdminHub}
        style={{
          paddingVertical: 13,
          borderRadius: RADIUS.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: isDark ? "#1E3A8A33" : "#EAF1FF",
        }}
      >
        <FolderIcon size={16} color={isDark ? BRAND.blueLight : BRAND.navy} />
        <Txt variant="bodySemi" style={{ fontSize: 13, color: isDark ? BRAND.blueLight : BRAND.navy }}>
          Open Master Data Hub
        </Txt>
      </Btn>
    </Card>
  );
}

// ─── Home tab ─────────────────────────────────────────────────────────────────

export default function HomeTab({
  assembly,
  sessionActive,
  isAdmin,
  onOpenElders,
  onOpenMembers,
  onOpenVideos,
  onOpenMyDashboard,
  sessionStartTime,
  attendanceError,
  membersPresent,
  firstTimers,
  onActivateSession,
  onTerminateSession,
  onOpenAdminHub,
  loginRole,
  bottomInset,
}: {
  assembly: Assembly;
  sessionActive: boolean;
  isAdmin: boolean;
  onOpenElders: () => void;
  onOpenMembers: () => void;
  onOpenVideos: () => void;
  onOpenMyDashboard: () => void;
  sessionStartTime: string | null;
  /** Why opening or closing the session failed — set by the server's reply. */
  attendanceError: string | null;
  membersPresent: number;
  firstTimers: number;
  onActivateSession: () => void;
  onTerminateSession: () => void;
  onOpenAdminHub: () => void;
  loginRole: LoginRole;
  bottomInset: number;
}) {
  // Pull down anywhere on this page to reload everything the app shows.
  const pullToRefresh = usePullToRefresh();
  const { c, isDark } = useTheme();
  // The roll comes from the server; the store no longer owns it.
  const { members: directory, loading: rollLoading } = useDirectory();
  const me = useMe();
  const { member: signedIn, firstTime } = useSession();
  const today = useTodayAttendance();
  const { videos } = useContent();

  // Addressed the way the dashboard greets them — "Elder Ampofo", "Mrs Boakye",
  // or a first name — rather than by the sample member every admin was called.
  const greetingName = me
    ? addressOf(me)
    : (signedIn?.full_name ?? "").trim().split(/\s+/)[0] || "there";
  const greeting = `${firstTime ? "Welcome" : "Welcome back"}, ${greetingName}`;

  // Absent is only meaningful once a service has been held: on a Tuesday with
  // no session, "328 absent" would read as the whole church staying away.
  const heldService = today.sessions.length > 0;
  const presentOnRoll = directory.filter((m) => today.presentIds.has(m.id)).length;
  const glance: [string, string, TintName][] = !today.loaded
    ? [["…", "Present", "green"], ["…", "Absent", "red"], ["…", "First Timers", "amber"]]
    : [
        [String(today.presentIds.size), "Present", "green"],
        [heldService ? String(Math.max(0, directory.length - presentOnRoll)) : "—", "Absent", "red"],
        [String(today.firstTimers), "First Timers", "amber"],
      ];

  // Who signed in, by the sex on their record. Members whose sex was never
  // recorded are in Present but in neither of these, so the two can sum to less.
  const signedMembers = directory.filter((m) => today.presentIds.has(m.id));
  const bySex: [string, string][] = [
    [today.loaded ? String(signedMembers.filter((m) => m.sex === "M").length) : "…", "Men"],
    [today.loaded ? String(signedMembers.filter((m) => m.sex === "F").length) : "…", "Women"],
  ];

  return (
    <ScrollView refreshControl={pullToRefresh}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: 18, paddingBottom: bottomInset + 8 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 18, gap: 12 }}>
        {/* Attendance status */}
        <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          {sessionActive ? (
            <StatusDot size={10} color={BRAND.green} ping />
          ) : (
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#B6BECC" }} />
          )}
          <View style={{ flex: 1 }}>
            <Txt variant="displayBold" style={{ fontSize: 15, color: sessionActive ? (isDark ? BRAND.greenLight : "#15803D") : c.foreground }}>
              {sessionActive ? "Attendance Open" : "Attendance Closed"}
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: sessionActive ? (isDark ? "#86EFAC" : "#16A34A") : c.accent }}>
              {sessionActive ? "Tap the Attendance tab to mark your presence" : "Service has not started — check back soon"}
            </Txt>
          </View>
        </Card>

        {/* A refused open or close used to fail in silence: the panel said
            "Attendance Open" while the server had nothing open and no member
            could sign. The server's own reason goes here instead. */}
        {attendanceError ? (
          <View style={{ padding: 12, borderRadius: RADIUS.md, backgroundColor: isDark ? "#DC262622" : "#FEE2E2" }}>
            <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 18, color: isDark ? "#FCA5A5" : "#B91C1C" }}>
              {attendanceError}
            </Txt>
          </View>
        ) : null}

      
        {/* Today at a glance */}
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 12, marginBottom: 2, color: c.mutedForeground }}>
          Today at a Glance
        </Txt>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {glance.map(([v, label, tint], i) => (
            <PopIn key={i} delay={i * 90} style={{ flex: 1 }}>
            <Card style={{ paddingVertical: 16, alignItems: "center" }}>
              <Txt variant="displayExtraBold" style={{ fontSize: 22, color: c.primary }}>
                {v}
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 3, color: c.mutedForeground }}>
                {label}
              </Txt>
            </Card>
            </PopIn>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {bySex.map(([v, label], i) => (
            <PopIn key={label} delay={(i + 3) * 90} style={{ flex: 1 }}>
            <Card style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Txt variant="bodyMedium" style={{ fontSize: 13, color: c.mutedForeground }}>
                {label} signed in
              </Txt>
              <Txt variant="displayExtraBold" style={{ fontSize: 22, color: c.primary }}>
                {v}
              </Txt>
            </Card>
            </PopIn>
          ))}
        </View>

        <Txt style={{ fontSize: 11.5, lineHeight: 16, color: c.mutedForeground }}>
          First timers are visitors at Royal Assembly for the first time, signed in by an admin through Manual Attendance.
        </Txt>

        {/* Says what the numbers are counting, so a zero reads as "not yet"
            rather than "nobody came". */}
        {today.loaded ? (
          <Txt style={{ fontSize: 11.5, marginTop: -2, color: c.mutedForeground }}>
            {heldService
              ? `Signed in across ${today.sessions.length} session${today.sessions.length === 1 ? "" : "s"} today · updates every 30 seconds`
              : "No attendance session has been opened today"}
          </Txt>
        ) : null}

        {/* Shortcuts */}
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 12, marginBottom: 2, color: c.mutedForeground }}>
          Quick Access
        </Txt>

        {(
          [
            { label: "My Dashboard", sub: greeting, tint: "blue" as TintName, Icon: HomeIcon, fn: onOpenMyDashboard },
            ...(canViewMembers(loginRole)
              ? [
                  {
                    label: "Church Members",
                    // While the roll loads it holds only the viewer, so the count read 0.
                    sub: rollLoading ? "Loading members…" : `${othersOnly(visibleMembers(loginRole, me ?? ME, directory), me?.id).length} registered members`,
                    tint: "green" as TintName,
                    Icon: UsersIcon,
                    fn: onOpenMembers,
                  },
                ]
              : []),
          ]
        ).map((item, i) => (
          <FadeIn key={i} index={i} delay={160}>
          <Btn onPress={item.fn}>
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <TintTile tint={item.tint} size={44}>
                <item.Icon size={19} color={tintFg(item.tint, isDark)} />
              </TintTile>
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
                  {item.label}
                </Txt>
                <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
                  {item.sub}
                </Txt>
              </View>
              <ChevronRightIcon size={16} color={c.mutedForeground} />
            </Card>
          </Btn>
          </FadeIn>
        ))}

        {/* Videos: shown once something is published; the card is the way in. */}
        {videos.length > 0 ? (
          <>
            <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 12, marginBottom: 2, color: c.mutedForeground }}>
              Videos
            </Txt>
            <LatestVideoCard onPress={onOpenVideos} />
          </>
        ) : null}

        {/* Admin panel */}
        {isAdmin ? (
          <View style={{ marginTop: 12 }}>
            <AdminPanel
              assembly={assembly}
              sessionActive={sessionActive}
              sessionStartTime={sessionStartTime}
              membersPresent={membersPresent}
              firstTimers={firstTimers}
              onActivate={onActivateSession}
              onTerminate={onTerminateSession}
              onOpenAdminHub={onOpenAdminHub}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
