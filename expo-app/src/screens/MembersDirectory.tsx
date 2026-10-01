import React, { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { BODY, BRAND, RADIUS, useTheme } from "../theme";
import { LoginRole, ME, Member, memberFilters, visibleMembers } from "../data";
import { ChevronRightIcon, SearchIcon, XIcon } from "../icons";
import { Avatar, Btn, Card, Txt } from "../ui";
import { FadeIn } from "../motion";
import { useContent } from "../store";

export default function MembersDirectory({
  onSelectMember,
  loginRole,
  bottomInset,
}: {
  onSelectMember: (m: Member) => void;
  loginRole: LoginRole;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  const { directory } = useContent();
  const [activeFilter, setActiveFilter] = useState("All Members");
  const [search, setSearch] = useState("");

  // A day-born leader only ever sees their own group.
  const scoped = visibleMembers(loginRole, ME, directory);
  const groupOnly = loginRole === "member";

  const filtered = scoped.filter((m) => {
    const matchFilter =
      activeFilter === "All Members" ||
      // Match the milestone by name, not by position: a member added from the
      // Admin Hub starts with an empty list, and indexing [0] threw on them.
      (activeFilter === "Baptized" && m.milestones.some((ms) => ms.label === "Water Baptism" && ms.done)) ||
      (activeFilter === "Department Leaders" && m.category === "Department Leader");
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.departments.some((d) => d.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} keyboardShouldPersistTaps="handled">
      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: RADIUS.md,
            backgroundColor: c.muted,
          }}
        >
          <SearchIcon color={c.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, ID (#MEM-xxxx), or department..."
            placeholderTextColor={c.mutedForeground}
            style={{ flex: 1, fontSize: 14, fontFamily: BODY.regular, color: c.foreground, padding: 0 }}
          />
          {search ? (
            <Btn onPress={() => setSearch("")}>
              <XIcon size={14} color={c.mutedForeground} />
            </Btn>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
      >
        {memberFilters.map((f) => (
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

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Txt variant="bodyMedium" style={{ fontSize: 12, color: c.mutedForeground }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          {groupOnly ? ` · ${ME.dayBorn}-born group` : ""}
        </Txt>
      </View>

      {/* Cards */}
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {filtered.map((member, i) => (
          <FadeIn key={member.id} index={i}>
          <Btn onPress={() => onSelectMember(member)}>
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View>
                <Avatar
                  photo={member.photo}
                  initials={member.avatar}
                  color={member.avatarColor}
                  size={56}
                  radius={16}
                  fontSize={18}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: BRAND.green,
                    borderWidth: 2,
                    borderColor: c.card,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <Txt variant="displayBold" numberOfLines={1} style={{ flex: 1, fontSize: 14, color: c.foreground }}>
                    {member.name}
                  </Txt>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#16A34A22" : "#DCFCE7",
                    }}
                  >
                    <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.greenLight : "#166534" }}>
                      Active
                    </Txt>
                  </View>
                </View>
                <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                  {member.assembly} · {member.memberId}
                </Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF",
                    }}
                  >
                    <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.blueLight : BRAND.navy }}>
                      {member.category}
                    </Txt>
                  </View>
                  {member.departments[0] ? (
                    <Txt style={{ fontSize: 10, color: c.mutedForeground }}>{member.departments[0]}</Txt>
                  ) : null}
                </View>
              </View>

              <ChevronRightIcon color={c.mutedForeground} />
            </Card>
          </Btn>
          </FadeIn>
        ))}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <SearchIcon size={34} color={c.mutedForeground} />
            <Txt variant="bodySemi" style={{ fontSize: 14, marginTop: 12, color: c.foreground }}>
              No members found
            </Txt>
            <Txt style={{ fontSize: 12, marginTop: 4, color: c.mutedForeground }}>Try a different filter or search term</Txt>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
