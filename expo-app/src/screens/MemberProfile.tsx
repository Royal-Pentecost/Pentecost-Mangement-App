import React, { useEffect, useState } from "react";
import * as Api from "../api/resources";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND, RADIUS, useTheme } from "../theme";
import { Elder, Member, classForDayBorn, presence } from "../data";
import { BookIcon, CameraIcon, ChatIcon, CheckIcon, CircleIcon, FlameIcon, HandshakeIcon, MapPinIcon, MusicIcon, PhoneIcon, PrayIcon, ShieldIcon, UsersIcon, WhatsappIcon } from "../icons";
import { contactLinks, openContact } from "../contact";
import { Avatar, Btn, Card, ProgressBar, Pulse, Txt, shadow } from "../ui";
import { SwapFade } from "../motion";
import { usePullToRefresh } from "../refresh";

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
  // Pull down anywhere on this page to reload everything the app shows.
  const pullToRefresh = usePullToRefresh();
  const { c, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>("attendance");

  const tabs = TABS;

  const elder = elders.find((e) => e.id === member.elderId);
  const links = contactLinks(member.phone);
  const elderLinks = contactLinks(elder?.phone);
  const accessLabel = member.role === "superAdmin" ? "Super admin" : member.role === "admin" ? "Assembly admin" : null;
  // The directory was loaded a while ago; re-read this one person's "last seen"
  // every 30 seconds so the badge is true while the profile is open.
  const [lastSeenAt, setLastSeenAt] = useState(member.lastSeenAt ?? null);
  useEffect(() => {
    let stopped = false;
    const check = () =>
      void Api.fetchMember(member.id)
        .then((m) => !stopped && setLastSeenAt(m.last_seen_at ?? null))
        .catch(() => {});
    check();
    const timer = setInterval(check, 30_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [member.id]);
  const online = presence(lastSeenAt);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    present: { bg: isDark ? "#16A34A22" : "#DCFCE7", text: isDark ? BRAND.greenLight : "#166534", label: "Present" },
    absent: { bg: isDark ? "#DC262622" : "#FEE2E2", text: isDark ? BRAND.redLight : BRAND.red, label: "Absent" },
    late: { bg: isDark ? "#D9770622" : "#FEF3C7", text: isDark ? BRAND.goldLight : BRAND.gold, label: "Late" },
  };

  return (
    <ScrollView refreshControl={pullToRefresh} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }}>
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
            {/* Online dot: only while they have the app open. */}
            {online.active ? (
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
            ) : null}
          </View>

          <Txt variant="displayBold" style={{ fontSize: 20, color: "#fff", textAlign: "center" }}>
            {member.name}
          </Txt>
          <Txt style={{ fontSize: 12, marginTop: 2, color: "#BFDBFE" }}>
            {[member.assembly, member.residence].filter(Boolean).join(" \u00b7 ")}
          </Txt>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: online.active ? "#4ADE80" : "rgba(255,255,255,0.4)" }} />
            <Txt variant="bodySemi" style={{ fontSize: 11.5, color: online.active ? "#BBF7D0" : "rgba(255,255,255,0.7)" }}>
              {online.label}
            </Txt>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: isDark ? "#F59E0B33" : "rgba(255,255,255,0.2)" }}>
              <Txt variant="displayBold" style={{ fontSize: 12, color: isDark ? BRAND.goldLight : "#fff" }}>
                {member.memberId}
              </Txt>
            </View>
            {/* Their office in the church — "Elder", "Deaconess" — or "Member". The
                "Member since" chip it replaces showed the year the roll was
                imported for everyone. */}
            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>
              <Txt variant="bodySemi" style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                {member.churchTitle || "Member"}
              </Txt>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick actions — the same three on every profile. Most of the roll has
          no number yet; those buttons say so instead of doing nothing. */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
        {[
          { key: "call", render: () => <PhoneIcon size={20} color={links ? c.foreground : c.mutedForeground} />, label: "Call", url: links?.call },
          { key: "sms", render: () => <ChatIcon size={20} color={links ? c.foreground : c.mutedForeground} />, label: "SMS", url: links?.sms },
          { key: "whatsapp", render: () => <WhatsappIcon size={20} />, label: "WhatsApp", url: links?.whatsapp },
        ].map(({ key, render, label, url }) => (
          <Btn key={key} style={{ flex: 1, opacity: url ? 1 : 0.45 }} onPress={url ? () => openContact(url) : undefined} disabled={!url}>
            <Card style={{ alignItems: "center", gap: 7, paddingVertical: 14 }}>
              {render()}
              <Txt variant="bodySemi" style={{ fontSize: 11, color: url ? c.foreground : c.mutedForeground }}>
                {label}
              </Txt>
            </Card>
          </Btn>
        ))}
      </View>
      {!links ? (
        <Txt style={{ fontSize: 11.5, marginTop: 8, textAlign: "center", color: c.mutedForeground }}>
          No phone number on file for {member.name.split(" ")[0]} yet
        </Txt>
      ) : null}

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
                    {member.streak}-Sunday streak
                  </Txt>
                </View>
                <Txt style={{ fontSize: 12, color: c.mutedForeground }}>
                  {member.attended ?? 0} of {member.held ?? 0} Sundays
                </Txt>
              </View>
            </Card>

            <Card style={{ overflow: "hidden" }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  Recent Services
                </Txt>
              </View>
              {member.attendanceLogs.length === 0 ? (
                <Txt style={{ fontSize: 12.5, padding: 16, color: c.mutedForeground }}>No services recorded yet</Txt>
              ) : null}
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
          <>
          {/* Their standing in the church, from the roll. */}
          <Card style={{ padding: 14, gap: 10 }}>
            <Txt variant="displayBold" style={{ fontSize: 14, marginBottom: 2, color: c.foreground }}>
              Role in Church
            </Txt>
            {[
              { key: "office", Icon: ShieldIcon, label: "Office", value: member.churchTitle || "Member" },
              {
                key: "group",
                Icon: UsersIcon,
                label: "Day-born group",
                value: member.dayBorn
                  ? `${classForDayBorn(member.dayBorn).akan} (${member.dayBorn}-born)${member.dayBornLeader ? " \u00b7 leads the group" : ""}`
                  : "Not recorded",
              },
              ...(accessLabel ? [{ key: "access", Icon: ShieldIcon, label: "App access", value: accessLabel }] : []),
              { key: "home", Icon: MapPinIcon, label: "Residence", value: member.residence || "Not recorded" },
              { key: "marital", Icon: UsersIcon, label: "Marital status", value: member.maritalStatus || "Not recorded" },
            ].map(({ key, Icon, label, value }) => (
              <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.muted }}>
                <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF" }}>
                  <Icon size={15} color={isDark ? BRAND.blueLight : BRAND.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt style={{ fontSize: 11.5, color: c.mutedForeground }}>{label}</Txt>
                  <Txt variant="bodySemi" style={{ fontSize: 14, marginTop: 1, color: c.foreground }}>
                    {value}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>

          <Card style={{ padding: 14 }}>
            <Txt variant="displayBold" style={{ fontSize: 14, marginBottom: 12, color: c.foreground }}>
              Ministry &amp; Department Roles
            </Txt>
            {member.departments.length === 0 ? (
              <Txt style={{ fontSize: 12.5, color: c.mutedForeground }}>No ministry or department role recorded</Txt>
            ) : null}
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
                    <Txt style={{ fontSize: 12, color: c.mutedForeground }}>Serves in</Txt>
                  </View>
                </View>
              ))}
            </View>
          </Card>
          </>
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
              {elderLinks ? (
                <Btn
                  onPress={() => openContact(elderLinks.call)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: isDark ? "#1E3A8A22" : "#EFF6FF" }}
                >
                  <Txt variant="bodySemi" style={{ fontSize: 12, color: isDark ? BRAND.blueLight : BRAND.navy }}>
                    Call
                  </Txt>
                </Btn>
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>
      </SwapFade>
    </ScrollView>
  );
}
