import React, { useState } from "react";
import { Image, Modal, Pressable, ScrollView, View } from "react-native";

import { BRAND, RADIUS, TintName, useTheme } from "../theme";
import { Assembly, LoginRole, ME, canViewMembers, visibleMembers } from "../data";
import { ChevronRightIcon, FolderIcon, HomeIcon, PlayIcon, ShieldIcon, StopIcon, UsersIcon } from "../icons";
import { Btn, Card, StatusDot, TintTile, Txt, tintFg } from "../ui";
import { FadeIn, PopIn } from "../motion";

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
  onActivate: () => void;
  onTerminate: () => void;
  onOpenAdminHub: () => void;
}) {
  const { c, isDark } = useTheme();
  const [confirmingActivation, setConfirmingActivation] = useState(false);

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
        onPress={sessionActive ? onTerminate : () => setConfirmingActivation(true)}
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
        visible={confirmingActivation}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingActivation(false)}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(7,12,24,0.62)" }}>
          <Pressable
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            onPress={() => setConfirmingActivation(false)}
          />
          <View style={{ width: "100%", maxWidth: 360, padding: 22, borderRadius: RADIUS.xl, backgroundColor: c.card }}>
            <Txt variant="displayExtraBold" style={{ fontSize: 20, color: c.foreground }}>
              Activate attendance?
            </Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, marginTop: 8, color: c.mutedForeground }}>
              This will open attendance for members at {assembly.name}. Are you sure you want to continue?
            </Txt>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Btn
                onPress={() => setConfirmingActivation(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>Cancel</Txt>
              </Btn>
              <Btn
                onPress={() => {
                  setConfirmingActivation(false);
                  onActivate();
                }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: "#16A34A" }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>Activate</Txt>
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
  onOpenMyDashboard,
  sessionStartTime,
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
  onOpenMyDashboard: () => void;
  sessionStartTime: string | null;
  membersPresent: number;
  firstTimers: number;
  onActivateSession: () => void;
  onTerminateSession: () => void;
  onOpenAdminHub: () => void;
  loginRole: LoginRole;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();

  return (
    <ScrollView
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

      
        {/* Today at a glance */}
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 12, marginBottom: 2, color: c.mutedForeground }}>
          Today at a Glance
        </Txt>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {(
            [
              ["47", "Present", "green"],
              ["12", "Absent", "red"],
              ["5", "Visitors", "amber"],
            ] as [string, string, TintName][]
          ).map(([v, label, tint], i) => (
            <PopIn key={i} delay={i * 90} style={{ flex: 1 }}>
            <Card style={{ paddingVertical: 16, alignItems: "center" }}>
              <Txt variant="displayExtraBold" style={{ fontSize: 22, color: tintFg(tint, isDark) }}>
                {v}
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 3, color: c.mutedForeground }}>
                {label}
              </Txt>
            </Card>
            </PopIn>
          ))}
        </View>

        {/* Shortcuts */}
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 12, marginBottom: 2, color: c.mutedForeground }}>
          Quick Access
        </Txt>

        {(
          [
            { label: "My Dashboard", sub: `Welcome back, ${ME.name.split(" ")[0]}`, tint: "blue" as TintName, Icon: HomeIcon, fn: onOpenMyDashboard },
            ...(canViewMembers(loginRole)
              ? [
                  {
                    label: "Church Members",
                    sub: `${visibleMembers(loginRole).length} registered members`,
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
