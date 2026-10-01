import React, { useState } from "react";
import { Modal, Pressable, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BODY, BRAND, RADIUS, useTheme } from "../theme";
import { AdminTier, Member, adminTierFilters, adminUsers, auditLogs, members, severityColors, tierColors } from "../data";
import { exportTextFile, stampedName, toCsv } from "../files";
import { useContent } from "../store";
import { AlertTriangleIcon, ChevronRightIcon, ChurchIcon, LockIcon, SearchIcon, ShieldIcon, XIcon } from "../icons";
import { Avatar, Btn, Card, Txt } from "../ui";

const BOUNDARIES = ["Royal Assembly", "SMT", "Upper Room", "Grace Temple", "Ayigya District", "Ayigya North"];

export default function SuperAdminHub({ bottomInset }: { bottomInset: number }) {
  const { c, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const compactActions = width < 390;

  const [activeFilter, setActiveFilter] = useState("All Admins");
  const [search, setSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignRole, setAssignRole] = useState<AdminTier>("Assembly Admin");
  const [assignBoundary, setAssignBoundary] = useState("Royal Assembly");
  const [exportingAudit, setExportingAudit] = useState(false);
  const [auditStatus, setAuditStatus] = useState<string | null>(null);

  /** The audit trail is what an auditor asks for, so it has to leave the phone. */
  const exportAudit = async () => {
    if (exportingAudit) return;
    setExportingAudit(true);
    const result = await exportTextFile(
      stampedName("admin-audit-log", "csv"),
      "text/csv",
      toCsv(
        ["When", "Admin", "Action", "Affected Record", "Severity"],
        auditLogs.map((l) => [l.timestamp, l.adminName, l.action, l.affectedRecord, l.severity]),
      ),
    );
    setAuditStatus(result.message);
    setExportingAudit(false);
  };
  const [grantMaster, setGrantMaster] = useState(false);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const { directory, removeMember } = useContent();

  const filtered = adminUsers
    .filter((a) => {
      const matchFilter =
        activeFilter === "All Admins" ||
        (activeFilter === "District Admins" && a.tier === "District Admin") ||
        (activeFilter === "Assembly Admins" && a.tier === "Assembly Admin") ||
        (activeFilter === "Super Admins" && a.tier === "Super Admin");
      const q = search.toLowerCase();
      const matchSearch = !search || a.name.toLowerCase().includes(q) || a.phone.includes(q) || a.assembly.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    })
    .filter((a) => !revokedIds.includes(a.id));

  const memberMatches = directory.filter((m) => m.name.toLowerCase().includes(assignName.toLowerCase()));
  const removableMembers = directory.filter((member) => {
    const query = memberSearch.trim().toLowerCase();
    return !query || member.name.toLowerCase().includes(query) || member.memberId.toLowerCase().includes(query) || member.phone.toLowerCase().includes(query);
  }).slice(0, 8);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
          <Txt style={{ fontSize: 12, lineHeight: 18, color: c.mutedForeground }}>
            Manage administrative privileges, assign admin roles, and monitor system security.
          </Txt>
        </View>

        {/* Privilege summary */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12 }}>
          {[
            { label: "System Admins", value: `${adminUsers.length - revokedIds.length}`, sub: "Active Admins", Icon: ShieldIcon, color: isDark ? BRAND.blue : BRAND.navy },
            { label: "Assemblies Covered", value: "4 of 4", sub: "Assemblies", Icon: ChurchIcon, color: isDark ? BRAND.greenLight : BRAND.greenDark },
            { label: "Security Status", value: "OK", sub: "Operational", Icon: LockIcon, color: isDark ? BRAND.greenLight : BRAND.greenDark },
          ].map((s, i) => (
            <Card key={i} style={{ flex: 1, padding: 12, alignItems: "center" }}>
              <View style={{ marginBottom: 6 }}>
                <s.Icon size={20} color={s.color} />
              </View>
              <Txt variant="displayBlack" style={{ fontSize: 16, color: s.color }}>
                {s.value}
              </Txt>
              <Txt variant="bodySemi" style={{ fontSize: 10, color: c.foreground }}>
                {s.sub}
              </Txt>
              <Txt style={{ fontSize: 9, lineHeight: 12, marginTop: 2, textAlign: "center", color: c.mutedForeground }}>
                {s.label}
              </Txt>
            </Card>
          ))}
        </View>

        {/* Admins directory */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Txt variant="bodySemi" numberOfLines={2} style={{ flex: 1, fontSize: compactActions ? 10 : 11, lineHeight: 15, letterSpacing: compactActions ? 1 : 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
              Active Admins Directory
            </Txt>
            <Btn onPress={() => setShowAssignModal(true)} style={{ flexShrink: 0, paddingHorizontal: compactActions ? 10 : 12, paddingVertical: 8, borderRadius: 12, backgroundColor: BRAND.navy }}>
              <Txt variant="displayBold" style={{ fontSize: compactActions ? 11 : 12, color: "#fff" }}>
                {compactActions ? "+ Assign" : "+ Assign Admin"}
              </Txt>
            </Btn>
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: RADIUS.md,
              marginBottom: 12,
              backgroundColor: c.muted,
            }}
          >
            <SearchIcon color={c.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, phone, or assembly…"
              placeholderTextColor={c.mutedForeground}
              style={{ flex: 1, fontSize: 14, fontFamily: BODY.regular, color: c.foreground, padding: 0 }}
            />
            {search ? (
              <Btn onPress={() => setSearch("")}>
                <XIcon size={14} color={c.mutedForeground} />
              </Btn>
            ) : null}
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} style={{ marginBottom: 16 }}>
            {adminTierFilters.map((f) => (
              <Btn
                key={f}
                onPress={() => setActiveFilter(f)}
                style={
                  activeFilter === f
                    ? { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: isDark ? BRAND.blue : BRAND.navy }
                    : { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.muted, borderWidth: 1, borderColor: c.border }
                }
              >
                <Txt variant="bodySemi" style={{ fontSize: 11, color: activeFilter === f ? "#fff" : c.mutedForeground }}>
                  {f}
                </Txt>
              </Btn>
            ))}
          </ScrollView>

          {/* Admin cards */}
          <View style={{ gap: 10 }}>
            {filtered.map((admin) => {
              const tc = tierColors[admin.tier];
              return (
                <Card key={admin.id} style={{ padding: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Avatar
                      photo={admin.photo}
                      initials={admin.avatar}
                      color={admin.avatarColor}
                      size={56}
                      radius={16}
                      borderWidth={2}
                      borderColor={isDark ? tc.darkText : tc.text}
                      fontSize={16}
                    />
                    <View style={{ flex: 1 }}>
                      <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 14, color: c.foreground }}>
                        {admin.name}
                      </Txt>
                      <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>{admin.phone}</Txt>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? tc.darkBg : tc.bg }}>
                          <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? tc.darkText : tc.text }}>
                            {admin.tier}
                          </Txt>
                        </View>
                        <Txt style={{ fontSize: 10, color: c.mutedForeground }}>{admin.assembly}</Txt>
                      </View>
                    </View>
                    <ChevronRightIcon size={16} color={c.mutedForeground} />
                  </View>

                  {admin.tier !== "Super Admin" ? (
                    <Btn
                      onPress={() => setRevokedIds((ids) => [...ids, admin.id])}
                      style={{
                        marginTop: 10,
                        paddingVertical: 8,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        backgroundColor: isDark ? "#DC262611" : "#FEF2F2",
                        borderWidth: 1.5,
                        borderColor: "#DC262633",
                      }}
                    >
                      <AlertTriangleIcon size={14} color={BRAND.red} />
                      <Txt variant="displayBold" style={{ fontSize: 12, color: BRAND.red }}>
                        Revoke Admin Privileges
                      </Txt>
                    </Btn>
                  ) : null}
                </Card>
              );
            })}

            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <SearchIcon size={30} color={c.mutedForeground} />
                <Txt variant="bodySemi" style={{ fontSize: 14, color: c.foreground }}>
                  No admins found
                </Txt>
              </View>
            ) : null}
          </View>
        </View>

        {/* Permanent member removal */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Card style={{ padding: 14 }} borderColor={isDark ? "#7F1D1D" : "#FECACA"}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AlertTriangleIcon size={20} color={BRAND.red} />
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>Remove a member</Txt>
                <Txt style={{ fontSize: 12, lineHeight: 17, marginTop: 3, color: c.mutedForeground }}>Permanently remove an incorrect or duplicate member record from the app.</Txt>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 10, backgroundColor: c.muted }}>
              <SearchIcon color={c.mutedForeground} />
              <TextInput
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Search member name, ID, or phone"
                placeholderTextColor={c.mutedForeground}
                style={{ flex: 1, padding: 0, color: c.foreground, fontFamily: BODY.regular, fontSize: 13 }}
              />
            </View>
            {memberSearch ? (
              <View style={{ marginTop: 8, gap: 6 }}>
                {removableMembers.map((member) => (
                  <Btn key={member.id} onPress={() => setRemoveTarget(member)} style={{ padding: 10, borderRadius: 10, backgroundColor: isDark ? "#DC262622" : "#FEF2F2" }}>
                    <Txt variant="displayBold" style={{ fontSize: 13, color: c.foreground }}>{member.name}</Txt>
                    <Txt style={{ fontSize: 11, marginTop: 2, color: c.mutedForeground }}>{member.memberId} · {member.phone}</Txt>
                  </Btn>
                ))}
              </View>
            ) : null}
          </Card>
        </View>

        {/* Audit log */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Txt variant="bodySemi" style={{ flex: 1, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
              Admin Activity &amp; Audit Log
            </Txt>
            <Btn
              onPress={exportAudit}
              disabled={exportingAudit}
              style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: c.muted }}
            >
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                {exportingAudit ? "Preparing…" : "Export log"}
              </Txt>
            </Btn>
          </View>

          {auditStatus ? (
            <Card style={{ padding: 11, marginBottom: 10 }}>
              <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
                {auditStatus}
              </Txt>
            </Card>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: isDark ? "#1E293B" : "#F1F3F5",
            }}
          >
            <Txt variant="bodySemi" style={{ width: 72, fontSize: 10, textTransform: "uppercase", color: c.mutedForeground }}>
              When
            </Txt>
            <Txt variant="bodySemi" style={{ flex: 1, fontSize: 10, textTransform: "uppercase", color: c.mutedForeground }}>
              Admin · Action · Record
            </Txt>
          </View>

          <View style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden", borderWidth: 1, borderTopWidth: 0, borderColor: c.border }}>
            {auditLogs.map((log, i) => {
              const sc = severityColors[log.severity];
              return (
                <View
                  key={log.id}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderBottomWidth: i === auditLogs.length - 1 ? 0 : 1,
                    borderBottomColor: c.border,
                    backgroundColor: i % 2 === 0 ? c.card : isDark ? "#ffffff08" : "#00000005",
                  }}
                >
                  <View style={{ width: 72, flexDirection: "row", alignItems: "flex-start", gap: 6, paddingTop: 2 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 4, backgroundColor: sc.dot }} />
                    <Txt style={{ flex: 1, fontSize: 10, lineHeight: 13, color: c.mutedForeground }}>{log.timestamp}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodySemi" numberOfLines={1} style={{ fontSize: 12, color: c.foreground }}>
                      {log.adminName}
                    </Txt>
                    <Txt style={{ fontSize: 10, marginTop: 2, color: c.mutedForeground }}>{log.action}</Txt>
                    <View style={{ alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4, backgroundColor: isDark ? sc.darkBg : sc.bg }}>
                      <Txt variant="bodySemi" style={{ fontSize: 10, color: sc.dot }}>
                        {log.affectedRecord}
                      </Txt>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!removeTarget} transparent animationType="fade" onRequestClose={() => setRemoveTarget(null)}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(7,12,24,0.68)" }}>
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => setRemoveTarget(null)} />
          <View style={{ width: "100%", maxWidth: 360, padding: 22, borderRadius: 22, backgroundColor: c.card }}>
            <AlertTriangleIcon size={26} color={BRAND.red} />
            <Txt variant="displayExtraBold" style={{ fontSize: 20, marginTop: 12, color: c.foreground }}>Remove member permanently?</Txt>
            <Txt style={{ fontSize: 13.5, lineHeight: 20, marginTop: 8, color: c.mutedForeground }}>
              This will remove {removeTarget?.name} and their directory record from this app. This action cannot be undone.
            </Txt>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Btn onPress={() => setRemoveTarget(null)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", backgroundColor: c.muted }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>Cancel</Txt>
              </Btn>
              <Btn
                onPress={() => {
                  if (removeTarget) removeMember(removeTarget.id);
                  setRemoveTarget(null);
                  setMemberSearch("");
                }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", backgroundColor: BRAND.red }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>Remove</Txt>
              </Btn>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign new admin */}
      <Modal visible={showAssignModal} transparent animationType="slide" onRequestClose={() => setShowAssignModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAssignModal(false)} />
          <View style={{ maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.card }}>
            <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ width: 40, height: 4, borderRadius: 2, alignSelf: "center", backgroundColor: c.border }} />

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Txt variant="displayBold" style={{ fontSize: 16, color: c.foreground }}>
                    Assign New Admin
                  </Txt>
                  <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                    Grant administrative privileges to a church member
                  </Txt>
                </View>
                <Btn
                  onPress={() => setShowAssignModal(false)}
                  style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.muted }}
                >
                  <XIcon size={14} color={c.mutedForeground} />
                </Btn>
              </View>

              {/* 1. Member search */}
              <View>
                <Txt variant="bodySemi" style={{ fontSize: 12, marginBottom: 6, color: c.foreground }}>
                  1. Search Member
                </Txt>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: c.muted,
                                      }}
                >
                  <SearchIcon color={c.mutedForeground} />
                  <TextInput
                    value={assignName}
                    onChangeText={setAssignName}
                    placeholder="Search member by name or ID…"
                    placeholderTextColor={c.mutedForeground}
                    style={{ flex: 1, fontSize: 14, fontFamily: BODY.regular, color: c.foreground, padding: 0 }}
                  />
                </View>

                {assignName ? (
                  <View style={{ marginTop: 4, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: c.border, backgroundColor: c.card }}>
                    {memberMatches.slice(0, 3).map((m, i, arr) => (
                      <Btn
                        key={m.id}
                        onPress={() => setAssignName(m.name)}
                        scale={1}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                          borderBottomColor: c.border,
                        }}
                      >
                        <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: m.avatarColor }}>
                          <Txt variant="displayBold" style={{ fontSize: 12, color: "#fff" }}>
                            {m.avatar}
                          </Txt>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Txt variant="bodySemi" style={{ fontSize: 12, color: c.foreground }}>
                            {m.name}
                          </Txt>
                          <Txt style={{ fontSize: 10, color: c.mutedForeground }}>
                            {m.memberId} · {m.assembly}
                          </Txt>
                        </View>
                      </Btn>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* 2. Role */}
              <View>
                <Txt variant="bodySemi" style={{ fontSize: 12, marginBottom: 6, color: c.foreground }}>
                  2. Role Assignment
                </Txt>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["Assembly Admin", "District Admin", "Super Admin"] as AdminTier[]).map((role) => {
                    const tc = tierColors[role];
                    const active = assignRole === role;
                    return (
                      <Btn
                        key={role}
                        onPress={() => setAssignRole(role)}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor: active ? (isDark ? tc.darkBg : tc.bg) : c.muted,
                          borderWidth: 1.5,
                          borderColor: active ? (isDark ? tc.darkText : tc.text) + "66" : c.border,
                        }}
                      >
                        <Txt variant="displayBold" style={{ fontSize: 10, color: active ? (isDark ? tc.darkText : tc.text) : c.mutedForeground }}>
                          {role}
                        </Txt>
                      </Btn>
                    );
                  })}
                </View>
              </View>

              {/* 3. Boundary */}
              <View>
                <Txt variant="bodySemi" style={{ fontSize: 12, marginBottom: 6, color: c.foreground }}>
                  3. Assigned Boundary
                </Txt>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {BOUNDARIES.map((b) => {
                    const active = assignBoundary === b;
                    return (
                      <Btn
                        key={b}
                        onPress={() => setAssignBoundary(b)}
                        style={{
                          width: "47%",
                          flexGrow: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: active ? (isDark ? "#1E3A8A33" : "#EFF6FF") : c.muted,
                          borderWidth: 1,
                          borderColor: active ? (isDark ? "#3B82F655" : "#BFDBFE") : c.border,
                        }}
                      >
                        <Txt variant="bodySemi" style={{ fontSize: 12, color: active ? (isDark ? BRAND.blueLight : BRAND.navy) : c.mutedForeground }}>
                          {b}
                        </Txt>
                      </Btn>
                    );
                  })}
                </View>
              </View>

              {/* 4. Master data toggle */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, backgroundColor: c.muted }}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodySemi" style={{ fontSize: 12, color: c.foreground }}>
                    Grant Master Data Entry &amp; Attendance Control
                  </Txt>
                  <Txt style={{ fontSize: 10, marginTop: 2, color: c.mutedForeground }}>
                    Allows editing all records and managing sessions
                  </Txt>
                </View>
                <Btn
                  onPress={() => setGrantMaster((g) => !g)}
                  scale={1}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    marginLeft: 12,
                    padding: 2,
                    justifyContent: "center",
                    alignItems: grantMaster ? "flex-end" : "flex-start",
                    backgroundColor: grantMaster ? (isDark ? BRAND.blue : BRAND.navy) : c.border,
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" }} />
                </Btn>
              </View>

              {/* 5. Confirm */}
              <Btn
                onPress={() => {
                  setShowAssignModal(false);
                  setAssignName("");
                  setGrantMaster(false);
                }}
                style={{ borderRadius: 16, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={isDark ? [BRAND.navy, BRAND.blue] : [BRAND.navy, "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 16, alignItems: "center" }}
                >
                  <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
                    Confirm &amp; Grant Admin Access
                  </Txt>
                </LinearGradient>
              </Btn>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
