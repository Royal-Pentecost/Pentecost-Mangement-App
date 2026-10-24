import React, { useMemo, useState } from "react";
import { Animated, ScrollView, StyleProp, View, ViewStyle } from "react-native";

import { BRAND, FONT, RADIUS, useTheme } from "../theme";
import { ME, SessionUser, avatarColors } from "../data";
import { useDirectory, useMe } from "../directory";
import { Avatar, Btn, Card, SectionHeading, Txt, shadow } from "../ui";
import { MedalIcon } from "../icons";
import { EASE_OUT, FadeIn, PopIn } from "../motion";

const STREAKS: Record<number, string> = {
  1: "12 week streak",
  2: "10 week streak",
  3: "9 week streak",
  4: "8 week streak",
  5: "7 week streak",
  6: "6 week streak",
  7: "5 week streak",
};


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
  const { c, isDark } = useTheme();
  const [subTab, setSubTab] = useState<"consistent" | "encourage">("consistent");

  // The board is computed from the congregation's real attendance figures
  // rather than a fixed list, so it reorders itself as the year goes on.
  const { members, loading } = useDirectory();
  const me = useMe();

  const board = useMemo(() => {
    const scored = members
      .map((m) => ({
        id: m.id,
        rank: 0,
        name: m.name,
        avatar: m.avatar,
        photo: m.photo,
        // `total` is the denominator the row renders a percentage from. The
        // server reports a percentage directly, so 100 keeps the arithmetic
        // honest instead of inventing a service count.
        present: m.attendancePct,
        total: 100,
        streak: m.streak,
      }))
      .sort((a, b) => b.present - a.present || a.name.localeCompare(b.name));

    const ranked = scored.map((row, i) => ({ ...row, rank: i + 1 }));

    return {
      consistent: ranked.slice(0, 12),
      // Lowest scores first — the people worth a visit, not a podium.
      needsEncouragement: [...ranked].reverse().slice(0, 12).map((r, i) => ({ ...r, rank: i + 1 })),
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} showsVerticalScrollIndicator={false}>
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
          const pct = Math.round((m.present / m.total) * 100);
          const isFirst = podiumRanks[i] === 1;

          return (
            <PopIn key={m.rank} delay={i * 110} style={{ width: 86, alignItems: "center" }}>
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

        <View style={{ gap: 10 }}>
          {data.map((m, i) => {
            const pct = Math.round((m.present / m.total) * 100);
            const rankMedal = i < 3 ? medalColors[[1, 0, 2][i]] : null;

            return (
              <FadeIn key={m.rank} index={i} delay={200}>
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
                    {STREAKS[m.rank] ?? `${m.rank} week streak`}
                  </Txt>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Txt variant="displayExtraBold" style={{ fontSize: 17, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                    {pct}%
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 11, color: c.mutedForeground }}>
                    {m.present}/{m.total}
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
