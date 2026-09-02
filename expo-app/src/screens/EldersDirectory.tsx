import React, { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { BODY, BRAND, RADIUS, useTheme } from "../theme";
import { Elder, elders, leaderFilters } from "../data";
import { ChevronRightIcon, SearchIcon, XIcon } from "../icons";
import { Avatar, Btn, Card, TintTile, Txt, tintFg } from "../ui";
import { FadeIn } from "../motion";

export default function EldersDirectory({
  onSelectElder,
  bottomInset,
}: {
  onSelectElder: (e: Elder) => void;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const active = leaderFilters.find((f) => f.label === activeFilter) ?? leaderFilters[0];

  const filtered = elders.filter((e) => {
    const matchFilter = active.office === "All" || e.office === active.office;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.assembly.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} keyboardShouldPersistTaps="handled">
      {/* Search */}
      {showSearch ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: RADIUS.md,
              backgroundColor: c.muted,
            }}
          >
            <SearchIcon color={c.mutedForeground} />
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder="Search leaders, office, or assembly…"
              placeholderTextColor={c.mutedForeground}
              style={{ flex: 1, fontSize: 14, fontFamily: BODY.regular, color: c.foreground, padding: 0 }}
            />
            {search ? (
              <Btn onPress={() => setSearch("")}>
                <XIcon size={13} color={c.mutedForeground} />
              </Btn>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
      >
        {leaderFilters.map(({ label: f }) => (
          <Btn
            key={f}
            onPress={() => setActiveFilter(f)}
            style={
              activeFilter === f
                ? {
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: isDark ? BRAND.blue : BRAND.navy,
                  }
                : {
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: c.muted,
                                      }
            }
          >
            <Txt variant="bodySemi" style={{ fontSize: 12, color: activeFilter === f ? "#fff" : c.mutedForeground }}>
              {f}
            </Txt>
          </Btn>
        ))}
      </ScrollView>

      {/* Count + search toggle */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Txt variant="bodyMedium" style={{ fontSize: 12, color: c.mutedForeground }}>
          {filtered.length} leader{filtered.length !== 1 ? "s" : ""} found
        </Txt>
        <Btn onPress={() => setShowSearch((s) => !s)}>
          <Txt variant="bodySemi" style={{ fontSize: 12, color: c.primary }}>
            {showSearch ? "Hide Search" : "Search"}
          </Txt>
        </Btn>
      </View>

      {/* Cards */}
      <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
        {filtered.map((elder, i) => (
          <FadeIn key={elder.id} index={i}>
          <Btn onPress={() => onSelectElder(elder)}>
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar
                photo={elder.photo}
                initials={elder.avatar}
                color={elder.avatarColor}
                size={64}
                radius={16}
                borderWidth={2.5}
                borderColor={isDark ? BRAND.goldLight : BRAND.gold}
                fontSize={18}
              />

              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 14, lineHeight: 18, color: c.foreground }}>
                  {elder.name}
                </Txt>
                <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                  {elder.title} — {elder.assembly}
                </Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: isDark ? "#1E3A8A44" : "#EFF6FF",
                    }}
                  >
                    <Txt
                      variant="bodySemi"
                      style={{
                        fontSize: 10,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: isDark ? BRAND.blueLight : BRAND.navy,
                      }}
                    >
                      {elder.assembly}
                    </Txt>
                  </View>
                  <Txt style={{ fontSize: 10, color: c.mutedForeground }}>In service since {elder.since}</Txt>
                </View>
              </View>

              <TintTile tint="amber" size={32} radius={RADIUS.sm}>
                <ChevronRightIcon size={15} color={tintFg("amber", isDark)} />
              </TintTile>
            </Card>
          </Btn>
          </FadeIn>
        ))}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <SearchIcon size={34} color={c.mutedForeground} />
            <Txt variant="bodySemi" style={{ fontSize: 14, marginTop: 12, color: c.foreground }}>
              No leaders found
            </Txt>
            <Txt style={{ fontSize: 12, marginTop: 4, color: c.mutedForeground }}>Try a different filter or search term</Txt>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
