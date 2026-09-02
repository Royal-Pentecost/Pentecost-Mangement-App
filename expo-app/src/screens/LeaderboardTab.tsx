import React, { useState } from "react";
import { Animated, ScrollView, StyleProp, View, ViewStyle } from "react-native";

import { BRAND, FONT, RADIUS, useTheme } from "../theme";
import { ME, SessionUser, avatarColors, leaderboardData } from "../data";
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

  const data = subTab === "consistent" ? leaderboardData.consistent : leaderboardData.needsEncouragement;

  // The signed-in member's own row carries their profile photograph. Matched on
  // name because the seed leaderboard has no member ids; swap to an id compare
  // once the board comes from the backend.
  const isMe = (name: string) => name.trim().toLowerCase() === ME.name.trim().toLowerCase();

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
                  photo={isMe(m.name) ? user.photo : undefined}
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
                  photo={isMe(m.name) ? user.photo : undefined}
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
