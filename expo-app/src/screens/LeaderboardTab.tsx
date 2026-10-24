import React, { useMemo, useState } from "react";
import { Animated, ScrollView, StyleProp, View, ViewStyle } from "react-native";

import { BRAND, FONT, RADIUS, useTheme } from "../theme";
import { ME, SessionUser, avatarColors } from "../data";
import { useDirectory, useMe } from "../directory";
import { Avatar, Btn, Card, SectionHeading, Txt, shadow } from "../ui";
import { MedalIcon } from "../icons";
import { EASE_OUT, FadeIn, PopIn } from "../motion";
import { arrivalPhrase } from "./MyDashboard";
import { usePullToRefresh } from "../refresh";

interface BoardRow {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  photo: string;
  pct: number;
  attended: number;
  held: number;
  streak: number;
  /** Mean minutes after opening that they sign in; null if they never have. */
  arrival: number | null;
}

/**
 * Presence first, punctuality second.
 *
 * 1. Annual score — the share of services held that they attended.
 * 2. Services attended — two people at 100% are not equal if one has been
 *    to twelve services and the other to one.
 * 3. Arrival — who signs in soonest after the session opens. Early in the
 *    year, when many people share a perfect record, this is what separates
 *    them.
 * 4. Sunday streak, then name, so the order never shuffles between loads.
 */
function byConsistency(a: BoardRow, b: BoardRow): number {
  return (
    b.pct - a.pct ||
    b.attended - a.attended ||
    (a.arrival ?? Infinity) - (b.arrival ?? Infinity) ||
    b.streak - a.streak ||
    a.name.localeCompare(b.name)
  );
}

function rowDetail(m: BoardRow): string {
  const streak = m.streak > 0 ? `${m.streak}-Sunday streak` : "No current streak";
  return m.arrival != null ? `${streak} \u00b7 signs in ${arrivalPhrase(m.arrival)}` : streak;
}


/** A podium block that grows to its final height once, on mount. */
function GrowBar({
  height,
  delay,
  style,
  children,
}: {
  height: number;
  delay: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const h = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Height is a layout property, so no native driver here.
    const a = Animated.timing(h, { toValue: height, duration: 650, delay, easing: EASE_OUT, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [h, height, delay]);

  return <Animated.View style={[style, { height: h, overflow: "hidden" }]}>{children}</Animated.View>;
}

export default function LeaderboardTab({ user, bottomInset }: { user: SessionUser; bottomInset: number }) {
  // Pull down anywhere on this page to reload everything the app shows.
  const pullToRefresh = usePullToRefresh();
  const { c, isDark } = useTheme();
  const [subTab, setSubTab] = useState<"consistent" | "encourage">("consistent");

  // The board is computed from the congregation's real attendance figures
  // rather than a fixed list, so it reorders itself as the year goes on.
  const { members, loading, refreshStats } = useDirectory();
  const me = useMe();

  // The board moves during a service as people sign in; read the latest
  // figures whenever it is opened rather than the ones from sign-in.
  React.useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const board = useMemo(() => {
    const rows: BoardRow[] = members.map((m) => ({
      id: m.id,
      rank: 0,
      name: m.name,
      avatar: m.avatar,
      photo: m.photo,
      pct: m.attendancePct,
      attended: m.attended ?? 0,
      held: m.held ?? 0,
      streak: m.streak,
      arrival: m.avgArrival ?? null,
    }));

    // Only people who have actually come can be "most consistent" — with no
    // attendance yet, an alphabetical list of zeros is not a ranking.
    const consistent = rows
      .filter((r) => r.attended > 0)
      .sort(byConsistency)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    // The people worth a visit: services have been held, and they have missed
    // the most of them. Lowest score first, then fewest attended.
    const needsEncouragement = rows
      .filter((r) => r.held > 0 && r.pct < 100)
      .sort((a, b) => a.pct - b.pct || a.attended - b.attended || a.name.localeCompare(b.name))
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return {
      consistent: consistent.slice(0, 12),
      needsEncouragement: needsEncouragement.slice(0, 12),
      servicesHeld: Math.max(0, ...rows.map((r) => r.held)),
    };
  }, [members]);

  const data = subTab === "consistent" ? board.consistent : board.needsEncouragement;

  // Matched on id now that the board carries real records.
  const isMe = (id: string) => Boolean(me && id === me.id);

  // Podium order: 2nd, 1st, 3rd
  const top3 = [data[1], data[0], data[2]];
  const podiumRanks = [2, 1, 3];
  const medalColors = ["#A8B3C4", "#F0B429", "#CD7C2F"];
  const podiumHeights = [76, 100, 64];

  return (
    <ScrollView refreshControl={pullToRefresh} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} showsVerticalScrollIndicator={false}>
      {/* Segmented control */}
      <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
        <View style={{ flexDirection: "row", padding: 2, borderRadius: RADIUS.md, backgroundColor: c.muted ,alignItems:"center"}}>
          {(
            [
              ["consistent", "Most Consistent"],
              ["encourage", "Lacks Consistency"],
            ] as const
          ).map(([id, label]) => {
            const active = subTab === id;
            return (
              <Btn
                key={id}
                onPress={() => setSubTab(id)}
                scale={1}
                style={[
                  { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: "center" },
                  active ? { backgroundColor: c.card } : null,
                  active && !isDark ? shadow("sm") : null,
                ]}
              >
                <Txt variant="bodySemi" style={{ fontSize: 12.5, color: active ? c.primary : c.mutedForeground }}>
                  {label}
                </Txt>
              </Btn>
            );
          })}
        </View>
      </View>

      {/* Podium */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 14, paddingHorizontal: 16, paddingTop: 28 }}>
        {top3.map((m, i) => {
          if (!m) return <View key={i} style={{ width: 86 }} />;
          const pct = m.pct;
          const isFirst = podiumRanks[i] === 1;

          return (
            <PopIn key={m.id} delay={i * 110} style={{ width: 86, alignItems: "center" }}>
              <View style={{ marginBottom: 6 }}>
                <MedalIcon size={24} color={medalColors[i]} />
              </View>

              <View style={shadow("md")}>
                <Avatar
                  photo={isMe(m.id) ? user.photo || m.photo : m.photo || undefined}
                  initials={m.avatar}
                  color={avatarColors[i % avatarColors.length]}
                  size={isFirst ? 62 : 52}
                  borderWidth={3}
                  borderColor={medalColors[i]}
                  fontSize={isFirst ? 19 : 16}
                />
              </View>

              <Txt variant="bodySemi" numberOfLines={1} style={{ fontSize: 12.5, marginTop: 8, color: c.foreground }}>
                {m.name.split(" ")[0]}
              </Txt>

              <GrowBar
                height={podiumHeights[i]}
                delay={260 + i * 110}
                style={{
                  width: "100%",
                  borderTopLeftRadius: RADIUS.md,
                  borderTopRightRadius: RADIUS.md,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                  backgroundColor: isFirst ? (isDark ? "#3A2A08" : "#FEF6E4") : c.muted,
                }}
              >
                <Txt variant="displayExtraBold" style={{ fontSize: 19, color: isFirst ? (isDark ? "#FBBF24" : "#B45309") : c.mutedForeground }}>
                  {pct}%
                </Txt>
              </GrowBar>
            </PopIn>
          );
        })}
      </View>

      {/* Rankings */}
      <View style={{ paddingHorizontal: 16 }}>
        <SectionHeading label="All Rankings" />

        <Txt style={{ fontSize: 11.5, lineHeight: 16, marginTop: -4, marginBottom: 10, color: c.mutedForeground }}>
          {subTab === "consistent"
            ? "Ranked by attendance this year. When two people are level, whoever usually signs in sooner after the service opens goes first."
            : "Members who have missed the most services this year \u2014 worth a call or a visit."}
        </Txt>

        {data.length === 0 ? (
          <Card style={{ padding: 18, alignItems: "center" }}>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, textAlign: "center", color: c.mutedForeground }}>
              {loading
                ? "Loading attendance\u2026"
                : board.servicesHeld === 0
                  ? "No services have been recorded this year yet. The board fills in after the first one."
                  : subTab === "consistent"
                    ? "Nobody has signed in to a service yet."
                    : "Everyone has attended every service so far."}
            </Txt>
          </Card>
        ) : null}

        <View style={{ gap: 10 }}>
          {data.map((m, i) => {
            const pct = m.pct;
            const rankMedal = i < 3 ? medalColors[[1, 0, 2][i]] : null;

            return (
              <FadeIn key={m.id} index={i} delay={200}>
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 11 }}>
                <View style={{ width: 26, alignItems: "center" }}>
                  {rankMedal ? (
                    <MedalIcon size={21} color={rankMedal} />
                  ) : (
                    <Txt variant="bodySemi" style={{ fontSize: 12.5, color: c.mutedForeground }}>
                      {m.rank}
                    </Txt>
                  )}
                </View>

                <Avatar
                  photo={isMe(m.id) ? user.photo || m.photo : m.photo || undefined}
                  initials={m.avatar}
                  color={avatarColors[i % avatarColors.length]}
                  size={42}
                  fontSize={14}
                />

                <View style={{ flex: 1 }}>
                  <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 14.5, color: c.foreground }}>
                    {m.name}
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                    {rowDetail(m)}
                  </Txt>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Txt variant="displayExtraBold" style={{ fontSize: 17, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                    {pct}%
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 11, color: c.mutedForeground }}>
                    {m.attended}/{m.held}
                  </Txt>
                </View>
              </Card>
              </FadeIn>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
