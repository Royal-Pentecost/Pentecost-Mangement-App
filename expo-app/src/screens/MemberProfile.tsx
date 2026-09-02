import React, { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND, RADIUS, useTheme } from "../theme";
import { Elder, Member } from "../data";
import { BookIcon, CameraIcon, ChatIcon, CheckIcon, CircleIcon, FlameIcon, HandshakeIcon, IdCardIcon, MusicIcon, PhoneIcon, PrayIcon, UsersIcon } from "../icons";
import { Avatar, Btn, Card, ProgressBar, Pulse, Txt, shadow } from "../ui";
import { SwapFade } from "../motion";

type ProfileTab = "attendance" | "roles" | "milestones";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "attendance", label: "Attendance" },
  { id: "roles", label: "Roles" },
  { id: "milestones", label: "Milestones" },
];

const DEPT_ICONS = [MusicIcon, CameraIcon, HandshakeIcon, PrayIcon, BookIcon, UsersIcon];

export default function MemberProfile({
  member,
  elders,
  bottomInset,
}: {
  member: Member;
  elders: Elder[];
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>("attendance");

  const tabs = TABS;

  const elder = elders.find((e) => e.id === member.elderId);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    present: { bg: isDark ? "#16A34A22" : "#DCFCE7", text: isDark ? BRAND.greenLight : "#166534", label: "Present" },
    absent: { bg: isDark ? "#DC262622" : "#FEE2E2", text: isDark ? BRAND.redLight : BRAND.red, label: "Absent" },
    late: { bg: isDark ? "#D9770622" : "#FEF3C7", text: isDark ? BRAND.goldLight : BRAND.gold, label: "Late" },
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }}>
      {/* Hero */}
      <LinearGradient
        colors={isDark ? ["#1B2C6B", "#0F1B44"] : ["#22357F", "#1B2C6B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.35, y: 1 }}
        style={{ marginHorizontal: 18, marginTop: 18, borderRadius: RADIUS.xl, overflow: "hidden" }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 26, paddingBottom: 20, alignItems: "center" }}>
          <View style={{ marginBottom: 12 }}>
            <Avatar
              photo={member.photo}
              initials={member.avatar}
              color={member.avatarColor}
              size={96}
              radius={16}
              borderWidth={3}
              borderColor={isDark ? BRAND.goldLight : BRAND.gold}
              fontSize={26}
            />
            <View
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#4ADE80",
                borderWidth: 2,
                borderColor: "#1E3A8A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
            </View>
          </View>

          <Txt variant="displayBold" style={{ fontSize: 20, color: "#fff", textAlign: "center" }}>
            {member.name}
          </Txt>
          <Txt style={{ fontSize: 12, marginTop: 2, color: "#BFDBFE" }}>
            {member.assembly} · {member.district}
          </Txt>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: isDark ? "#F59E0B33" : "rgba(255,255,255,0.2)" }}>
              <Txt variant="displayBold" style={{ fontSize: 12, color: isDark ? BRAND.goldLight : "#fff" }}>
                {member.memberId}
              </Txt>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>
              <Txt variant="bodySemi" style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                Member since {member.since}
              </Txt>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick actions */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
        {[
          { key: "call", Icon: PhoneIcon, label: "Call", url: `tel:${member.phone.replace(/\s/g, "")}` },
          { key: "sms", Icon: ChatIcon, label: "SMS", url: `sms:${member.phone.replace(/\s/g, "")}` },
          { key: "id", Icon: IdCardIcon, label: "Digital ID", url: null },
        ].map(({ key, Icon, label, url }) => (
          <Btn
            key={key}
            style={{ flex: 1 }}
            onPress={url ? () => Linking.openURL(url).catch(() => {}) : undefined}
          >
            <Card style={{ alignItems: "center", gap: 7, paddingVertical: 14 }}>
              <Icon size={20} color={c.foreground} />
              <Txt variant="bodySemi" style={{ fontSize: 11, color: c.foreground }}>
                {label}
              </Txt>
            </Card>
          </Btn>
        ))}
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 3, marginHorizontal: 13, marginTop: 16, padding: 4, borderRadius: RADIUS.md, backgroundColor: c.muted }}>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Btn
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              scale={1}
              style={[
                { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
                active ? { backgroundColor: c.card } : null,
                active ? shadow("sm") : null,
              ]}
            >
              <Txt variant="bodySemi" style={{ fontSize: 11, color: active ? c.primary : c.mutedForeground }}>
                {t.label}
              </Txt>
            </Btn>
          );
        })}
      </View>

      <SwapFade trigger={activeTab}>
      <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 12 }}>
        {/* Attendance */}
        {activeTab === "attendance" ? (
          <>
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  Annual Score
                </Txt>
                <Txt variant="displayBold" style={{ fontSize: 24, color: isDark ? BRAND.blue : BRAND.navy }}>
                  {member.attendancePct}%
                </Txt>
              </View>
              <ProgressBar pct={member.attendancePct} fillColor={isDark ? BRAND.blue : BRAND.navy} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Pulse>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FBBF24" }} />
                  </Pulse>
                  <FlameIcon size={14} color={c.accent} />
                  <Txt variant="bodySemi" style={{ fontSize: 12, color: c.foreground }}>
                    {member.streak}-week streak
                  </Txt>
                </View>
                <Txt style={{ fontSize: 12, color: c.mutedForeground }}>Active</Txt>
              </View>
            </Card>

            <Card style={{ overflow: "hidden" }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  Recent Services
                </Txt>
              </View>
              {member.attendanceLogs.map((log, i) => {
                const sc = statusColors[log.status];
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: i === member.attendanceLogs.length - 1 ? 0 : 1,
                      borderBottomColor: c.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodySemi" numberOfLines={1} style={{ fontSize: 12, color: c.foreground }}>
                        {log.service}
                      </Txt>
                      <Txt style={{ fontSize: 10, marginTop: 2, color: c.mutedForeground }}>{log.date}</Txt>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: sc.bg }}>
                      <Txt variant="bodySemi" style={{ fontSize: 10, color: sc.text }}>
                        {sc.label}
                      </Txt>
                    </View>
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        {/* Roles */}
        {activeTab === "roles" ? (
          <Card style={{ padding: 14 }}>
            <Txt variant="displayBold" style={{ fontSize: 14, marginBottom: 12, color: c.foreground }}>
              Ministry &amp; Department Roles
            </Txt>
            <View style={{ gap: 10 }}>
              {member.departments.map((dept, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.muted }}>
                  <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF" }}>
                    <Txt style={{ fontSize: 14 }}>{React.createElement(DEPT_ICONS[i % DEPT_ICONS.length], { size: 15, color: isDark ? BRAND.blueLight : BRAND.navy })}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodySemi" style={{ fontSize: 14, color: c.foreground }}>
                      {dept}
                    </Txt>
                    <Txt style={{ fontSize: 12, color: c.mutedForeground }}>Active Role</Txt>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? "#16A34A22" : "#DCFCE7" }}>
                    <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.greenLight : "#166534" }}>
                      Active
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Milestones */}
        {activeTab === "milestones" ? (
          <Card style={{ padding: 14 }}>
            <Txt variant="displayBold" style={{ fontSize: 14, marginBottom: 12, color: c.foreground }}>
              Spiritual Milestones
            </Txt>
            <View style={{ gap: 12 }}>
              {member.milestones.map((m, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: m.done ? (isDark ? "#16A34A11" : "#F0FDF4") : c.muted,
                    borderWidth: 1,
                    borderColor: m.done ? (isDark ? "#4ADE8033" : "#86EFAC") : c.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: m.done ? (isDark ? "#16A34A33" : "#DCFCE7") : c.muted,
                    }}
                  >
                    {m.done ? <CheckIcon color={isDark ? BRAND.greenLight : BRAND.greenDark} /> : <CircleIcon color={c.mutedForeground} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodySemi" style={{ fontSize: 14, color: m.done ? (isDark ? BRAND.greenLight : "#166534") : c.mutedForeground }}>
                      {m.label}
                    </Txt>
                    <Txt style={{ fontSize: 10, marginTop: 2, color: c.mutedForeground }}>
                      {m.done ? "Verified" : "Not yet completed"}
                    </Txt>
                  </View>
                  {m.done ? (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: isDark ? "#16A34A22" : "#DCFCE7" }}>
                      <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.greenLight : "#166534" }}>
                        Verified
                      </Txt>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Assigned elder */}
        {elder ? (
          <Card style={{ padding: 14 }}>
            <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 12, color: c.mutedForeground }}>
              Day-Born Leader 
            </Txt>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar
                photo={elder.photo}
                initials={elder.avatar}
                color={elder.avatarColor}
                size={48}
                radius={16}
                borderWidth={2}
                borderColor={isDark ? BRAND.goldLight : BRAND.gold}
                fontSize={14}
              />
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  {elder.name}
                </Txt>
                <Txt style={{ fontSize: 12, color: c.mutedForeground }}>{elder.assembly} Assembly</Txt>
              </View>
              <Btn style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: isDark ? "#1E3A8A22" : "#EFF6FF" }}>
                <Txt variant="bodySemi" style={{ fontSize: 12, color: isDark ? BRAND.blueLight : BRAND.navy }}>
                  Contact
                </Txt>
              </Btn>
            </View>
          </Card>
        ) : null}
      </View>
      </SwapFade>
    </ScrollView>
  );
}
