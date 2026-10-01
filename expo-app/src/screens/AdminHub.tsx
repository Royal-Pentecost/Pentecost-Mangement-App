import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { BODY, BRAND, RADIUS, useTheme } from "../theme";
import {
  LoginRole,
  Member,
  MILESTONE_LABELS,
  MilestoneLabel,
  members,
  visibleRecordSections,
} from "../data";
import { useContent } from "../store";
import { exportPdf, exportTextFile, fromCsv, importTextFile, stampedName, toCsv } from "../files";
import {
  AlertTriangleIcon,
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChurchIcon,
  ClockIcon,
  CorrectMemberIcon,
  CrossIcon,
  FolderIcon,
  PinIcon,
  SearchIcon,
  ShieldIcon,
  SignalIcon,
  UploadIcon,
  UsersIcon,
  XCircleIcon,
  XIcon,
} from "../icons";

import { Btn, Card, Ping, Pulse, TintTile, Txt, tintFg } from "../ui";
import { FadeIn, PopIn } from "../motion";
import { useLocation } from "../location";

/** Record-section icon keys map to line icons. */
const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  users: UsersIcon,
  pin: PinIcon,
  award: AwardIcon,
  cross: CrossIcon,
};

/** A compact input for the forms inside the record cards. */
function MiniField({
  placeholder,
  value,
  onChangeText,
  inputRef,
  keyboardType,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  keyboardType?: "default" | "numeric" | "phone-pad";
}) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 8 }}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={keyboardType}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: RADIUS.sm,
          fontSize: 12.5,
          fontFamily: BODY.medium,
          color: c.foreground,
          backgroundColor: c.card,
        }}
      />
    </View>
  );
}

/** The save button each record form ends with. */
function MiniSave({ label, onPress, color, disabled }: { label: string; onPress: () => void; color: string; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Btn
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{ marginTop: 4, paddingVertical: 9, borderRadius: 12, alignItems: "center", backgroundColor: disabled ? c.muted : color }}
    >
      <Txt variant="displayBold" style={{ fontSize: 12, color: disabled ? c.mutedForeground : "#fff" }}>
        {label}
      </Txt>
    </Btn>
  );
}

function MiniForm({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ marginHorizontal: 12, marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: c.muted }}>
      <Txt variant="bodySemi" style={{ fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, color: c.mutedForeground }}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

export default function AdminHub({
  sessionActive,
  onOpenSuperAdmin,
  onOpenManualAttendance,
  onOpenPublish,
  signedInAs,
  isSuperAdmin,
  loginRole,
  bottomInset,
}: {
  sessionActive: boolean;
  onOpenSuperAdmin: () => void;
  onOpenManualAttendance: () => void;
  onOpenPublish: () => void;
  /** Who is signed in — stamped onto every record created here. */
  signedInAs: string;
  isSuperAdmin: boolean;
  loginRole: LoginRole;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  const { manualAttendance } = useContent();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [correctionMember, setCorrectionMember] = useState<Member | null>(null);
  const [correctionFirstName, setCorrectionFirstName] = useState("");
  const [correctionMiddleName, setCorrectionMiddleName] = useState("");
  const [correctionLastName, setCorrectionLastName] = useState("");
  const [correctionId, setCorrectionId] = useState("");
  const [correctionPhone, setCorrectionPhone] = useState("");
  const [correctionAssembly, setCorrectionAssembly] = useState("");

  const splitMemberName = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] ?? "", middle: parts.length > 2 ? parts.slice(1, -1).join(" ") : "", last: parts.length > 1 ? parts[parts.length - 1] : "" };
  };

  /** Run one file operation at a time and report the result in the banner. */
  const run = async (job: () => Promise<{ ok: boolean; message: string }>) => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    const result = await job();
    setStatus(result);
    setBusy(false);
  };

  /** The full member directory, as a spreadsheet. */
  const exportRecords = () =>
    run(async () =>
      exportTextFile(
        stampedName("member-records", "csv"),
        "text/csv",
        toCsv(
          ["Member ID", "Name", "Assembly", "District", "Phone", "Email", "Category", "Day Born", "Attendance %", "Streak", "Member Since"],
          members.map((m) => [m.memberId, m.name, m.assembly, m.district, m.phone, m.email, m.category, m.dayBorn, m.attendancePct, m.streak, m.since]),
        ),
      ),
    );

  /** Attendance for every member, plus anything an admin signed on their behalf. */
  const exportAttendance = () =>
    run(async () =>
      exportTextFile(
        stampedName("attendance-report", "csv"),
        "text/csv",
        toCsv(
          ["Member ID", "Name", "Date", "Service", "Status", "Signed By"],
          [
            ...members.flatMap((m) =>
              m.attendanceLogs.map((log) => [m.memberId, m.name, log.date, log.service, log.status, ""]),
            ),
            ...manualAttendance.map((r) => [r.memberId, r.memberName, "Today", r.service, r.status, r.signedBy]),
          ],
        ),
      ),
    );

  /** Read a spreadsheet of members back in and report what it contained. */
  const importCsv = () =>
    run(async () => {
      const picked = await importTextFile();
      if (!picked.ok || !picked.content) return { ok: false, message: picked.message };

      const rows = fromCsv(picked.content);
      if (rows.length === 0) return { ok: false, message: `${picked.name} has no data rows` };

      const columns = Object.keys(rows[0]).filter((k) => k !== "");
      const named = rows.filter((r) => (r.Name ?? r.name ?? "").trim() !== "").length;

      return {
        ok: true,
        message: `${picked.name}: ${rows.length} row${rows.length === 1 ? "" : "s"} read, ${named} with a name, across ${columns.length} columns (${columns.slice(0, 4).join(", ")}${columns.length > 4 ? "\u2026" : ""})`,
      };
    });

  /** Attach a photograph to a member record. */
  const uploadPhoto = () =>
    run(async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { ok: false, message: "Photo access was declined" };

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return { ok: false, message: "No photo chosen" };

      return { ok: true, message: `Photo attached (${result.assets[0].fileName ?? "image"}) \u2014 assign it to a member record to save` };
    });

  // ── Record category forms ───────────────────────────────────────────────────
  const {
    directory,
    addMember,
    updateMember,
    geofence,
    saveGeofence,
    milestoneLog,
    logMilestone,
  } = useContent();

  const correctionMatches = directory.filter((member) => {
    const query = correctionSearch.trim().toLowerCase();
    return !query || member.name.toLowerCase().includes(query) || member.memberId.toLowerCase().includes(query) || member.phone.toLowerCase().includes(query);
  }).slice(0, 6);

  const chooseCorrectionMember = (member: Member) => {
    setCorrectionMember(member);
    const names = splitMemberName(member.name);
    setCorrectionFirstName(member.firstName ?? names.first);
    setCorrectionMiddleName(member.middleName ?? names.middle);
    setCorrectionLastName(member.lastName ?? names.last);
    setCorrectionId(member.memberId);
    setCorrectionPhone(member.phone);
    setCorrectionAssembly(member.assembly);
  };

  const saveCorrection = () => {
    if (!correctionMember || !correctionFirstName.trim() || !correctionLastName.trim() || !correctionId.trim()) return;
    const fullName = [correctionFirstName, correctionMiddleName, correctionLastName].map((part) => part.trim()).filter(Boolean).join(" ");
    updateMember(correctionMember.id, {
      name: fullName,
      firstName: correctionFirstName.trim(),
      middleName: correctionMiddleName.trim(),
      lastName: correctionLastName.trim(),
      memberId: correctionId.trim(),
      phone: correctionPhone.trim(),
      assembly: correctionAssembly.trim() || "Royal Assembly",
    });
    setStatus({ ok: true, message: `${fullName}'s member record was corrected.` });
    setCorrectionMember(null);
    setCorrectionSearch("");
    setCorrectionOpen(false);
  };

  // Quick add member
  const nameRef = useRef<TextInput | null>(null);
  const memberIdRef = useRef<TextInput | null>(null);
  const assemblyRef = useRef<TextInput | null>(null);
  const [mFirstName, setMFirstName] = useState("");
  const [mMiddleName, setMMiddleName] = useState("");
  const [mLastName, setMLastName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mAssembly, setMAssembly] = useState("Royal Assembly");
  const [mId, setMId] = useState("");

  const memberReady = mFirstName.trim() !== "" && mLastName.trim() !== "" && mId.trim() !== "";

  const submitMember = () => {
    const fullName = [mFirstName, mMiddleName, mLastName].map((part) => part.trim()).filter(Boolean).join(" ");
    addMember({ firstName: mFirstName.trim(), middleName: mMiddleName.trim(), lastName: mLastName.trim(), phone: mPhone.trim(), assembly: mAssembly.trim() || "Royal Assembly", memberId: mId.trim() });
    setStatus({ ok: true, message: `${fullName} added to the directory as ${mId.trim()}` });
    setMFirstName("");
    setMMiddleName("");
    setMLastName("");
    setMPhone("");
    setMId("");
  };

  // Geofence
  const { fix } = useLocation();
  const latRef = useRef<TextInput | null>(null);
  const [gLat, setGLat] = useState(geofence.lat);
  const [gLng, setGLng] = useState(geofence.lng);
  const [gRadius, setGRadius] = useState(geofence.radius);

  /** Typing coordinates by hand is error-prone; standing in the auditorium is not. */
  const useHerePosition = () => {
    if (!fix) {
      setStatus({ ok: false, message: "No GPS fix yet — step outside for a moment and try again." });
      return;
    }
    setGLat(fix.lat.toFixed(6));
    setGLng(fix.lng.toFixed(6));
    setStatus({ ok: true, message: `Picked up your position, accurate to about ${Math.round(fix.accuracy)}m. Save to apply.` });
  };

  const submitGeofence = () => {
    saveGeofence({ lat: gLat.trim(), lng: gLng.trim(), radius: gRadius.trim() });
    setStatus({ ok: true, message: `Geofence set to ${gLat.trim()}, ${gLng.trim()} · ${gRadius.trim()}m radius` });
  };

  // Milestones
  const milestoneMemberRef = useRef<TextInput | null>(null);
  const [msMember, setMsMember] = useState("");
  const [msTicked, setMsTicked] = useState<MilestoneLabel[]>([]);

  const toggleTick = (label: MilestoneLabel) =>
    setMsTicked((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));

  const submitMilestones = () => {
    const member = msMember.trim();
    msTicked.forEach((milestone) => logMilestone({ member, milestone, loggedBy: signedInAs }));
    setStatus({ ok: true, message: `${msTicked.length} milestone${msTicked.length === 1 ? "" : "s"} recorded for ${member}` });
    setMsMember("");
    setMsTicked([]);
  };

  /** Focus a field inside an open card, so an action button lands somewhere real. */
  const focus = (ref: React.RefObject<TextInput | null>, section: string) => () => {
    setExpandedSection(section);
    setTimeout(() => ref.current?.focus(), 60);
  };

  /** The section buttons that genuinely move data in or out of the app. */
  const SECTION_ACTIONS: Record<string, () => void> = {
    // Members
    "Add New Member": focus(nameRef, "members"),
    "Upload Profile Photo": uploadPhoto,
    "Assign Member ID": focus(memberIdRef, "members"),
    "Set Assembly / District": focus(assemblyRef, "members"),

    // Attendance
    "Set Geofence Coordinates": focus(latRef, "attendance"),
    "Configure Service Times": onOpenPublish,
    "Manual Log Override": onOpenManualAttendance,
    "Export Attendance Report": exportAttendance,


    // Leadership — the roster lives in the super admin console
    "Promote / Assign Elder": onOpenSuperAdmin,
    "Update Contact Details": onOpenSuperAdmin,
    "Assign Ministry Role": onOpenSuperAdmin,
    "Reassign Assembly Boundary": onOpenSuperAdmin,

    // Milestones
    "Log Water Baptism": () => { setMsTicked(["Water Baptism"]); focus(milestoneMemberRef, "milestones")(); },
    "Record Confirmation": () => { setMsTicked(["Confirmation"]); focus(milestoneMemberRef, "milestones")(); },
    "Add Marriage Certificate": () => { setMsTicked(["Marriage Certification"]); focus(milestoneMemberRef, "milestones")(); },
    "Mark Special Ordination": () => { setMsTicked(["Special Ordination"]); focus(milestoneMemberRef, "milestones")(); },
  };

  const overviewStats = [
    { label: "Total Members", value: "1,248", sub: "Records", Icon: UsersIcon, color: isDark ? BRAND.blue : BRAND.navy, bg: isDark ? "#1E3A8A22" : "#EFF6FF" },
    { label: "Incomplete Profiles", value: "14", sub: "Pending", Icon: AlertTriangleIcon, color: isDark ? BRAND.goldLight : BRAND.gold, bg: isDark ? "#D9770622" : "#FEF3C7" },
    {
      label: "Active Sessions",
      value: sessionActive ? "1" : "0",
      sub: sessionActive ? "Live" : "Inactive",
      Icon: SignalIcon,
      color: sessionActive ? (isDark ? BRAND.greenLight : BRAND.greenDark) : isDark ? "#94A3B8" : "#6C757D",
      bg: sessionActive ? (isDark ? "#16A34A22" : "#DCFCE7") : c.muted,
    },
    { label: "Assemblies", value: "4", sub: "Active", Icon: ChurchIcon, color: isDark ? "#A78BFA" : BRAND.purple, bg: isDark ? "#7C3AED22" : "#EDE9FE" },
  ];

  const searchResults = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} keyboardShouldPersistTaps="handled">
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <Txt style={{ fontSize: 12, lineHeight: 18, color: c.mutedForeground }}>
          Admin portal to update, edit, and fill all church database records.
        </Txt>
      </View>

      {/* Overview cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingTop: 12 }}>
        {overviewStats.map((stat, i) => (
          <PopIn key={i} delay={i * 80} style={{ width: "47%", flexGrow: 1 }}>
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: stat.bg }}>
                <stat.Icon size={18} color={stat.color} />
              </View>
              {stat.label === "Incomplete Profiles" ? (
                <Pulse>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? BRAND.goldLight : BRAND.gold }} />
                </Pulse>
              ) : null}
              {stat.label === "Active Sessions" && sessionActive ? (
                <View style={{ width: 8, height: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.green }} />
                  <Ping size={8} color={BRAND.green} style={{ top: 0, left: 0 }} />
                </View>
              ) : null}
            </View>
            <Txt variant="displayBlack" style={{ fontSize: 24, color: stat.color }}>
              {stat.value}
            </Txt>
            <Txt variant="bodySemi" style={{ fontSize: 12, marginTop: 2, color: c.foreground }}>
              {stat.sub}
            </Txt>
            <Txt style={{ fontSize: 10, marginTop: 2, color: c.mutedForeground }}>{stat.label}</Txt>
          </Card>
          </PopIn>
        ))}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search missing data fields across all profiles…"
            placeholderTextColor={c.mutedForeground}
            style={{ flex: 1, fontSize: 14, fontFamily: BODY.regular, color: c.foreground, padding: 0 }}
          />
          {searchQuery ? (
            <Btn onPress={() => setSearchQuery("")}>
              <XIcon size={14} color={c.mutedForeground} />
            </Btn>
          ) : null}
        </View>

        {searchQuery ? (
          <Card style={{ marginTop: 8, overflow: "hidden" }}>
            {searchResults.slice(0, 3).map((m, i, arr) => (
              <View
                key={m.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                  borderBottomColor: c.border,
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: m.avatarColor }}>
                  <Txt variant="displayBold" style={{ fontSize: 12, color: "#fff" }}>
                    {m.avatar}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodySemi" numberOfLines={1} style={{ fontSize: 12, color: c.foreground }}>
                    {m.name}
                  </Txt>
                  <Txt style={{ fontSize: 10, color: c.mutedForeground }}>
                    {m.memberId} · {m.assembly}
                  </Txt>
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? "#D9770622" : "#FEF3C7" }}>
                  <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                    Edit
                  </Txt>
                </View>
              </View>
            ))}
            {searchResults.length === 0 ? (
              <Txt style={{ fontSize: 12, textAlign: "center", paddingVertical: 12, color: c.mutedForeground }}>
                No records match "{searchQuery}"
              </Txt>
            ) : null}
          </Card>
        ) : null}
      </View>

      {/* Result of the last import or export */}
      {status ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
            {status.ok ? (
              <CheckCircleIcon size={19} color={isDark ? BRAND.greenLight : BRAND.greenDark} />
            ) : (
              <XCircleIcon size={19} color={BRAND.red} />
            )}
            <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
              {status.message}
            </Txt>
            <Btn onPress={() => setStatus(null)}>
              <XIcon size={15} color={c.mutedForeground} />
            </Btn>
          </Card>
        </View>
      ) : null}

      {/* Batch actions */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}>
        <Btn onPress={importCsv} disabled={busy} style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
          <LinearGradient
            colors={isDark ? [BRAND.navy, BRAND.blue] : [BRAND.navy, "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            <FolderIcon size={15} color="#fff" />
            <Txt variant="displayBold" style={{ fontSize: 12, color: "#fff" }}>
              Batch Import CSV
            </Txt>
          </LinearGradient>
        </Btn>
        <Btn
          onPress={exportRecords}
          disabled={busy}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "center",
            gap: 7,
            alignItems: "center",
            backgroundColor: isDark ? "#D9770622" : "#FEF3C7",
            borderWidth: 1.5,
            borderColor: isDark ? "#F59E0B44" : BRAND.gold,
          }}
        >
          <UploadIcon size={15} color={isDark ? BRAND.goldLight : BRAND.gold} />
          <Txt variant="displayBold" style={{ fontSize: 12, color: isDark ? BRAND.goldLight : BRAND.gold }}>
            Export Records
          </Txt>
        </Btn>
      </View>

      {/* Admin tools */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
          Admin Tools
        </Txt>

        {[
          {
            id: "manual",
            tint: "violet" as const,
            Icon: SignalIcon,
            title: "Sign Attendance Manually",
            desc: "For members with no phone or no network at the auditorium",
            onPress: onOpenManualAttendance,
          },
          {
            id: "publish",
            tint: "green" as const,
            Icon: UploadIcon,
            title: "Publish Content",
            desc: "Weekly schedule, upcoming events, Bible study, and daily verse",
            onPress: onOpenPublish,
          },
          {
            id: "correct",
            tint: "amber" as const,
            Icon: CorrectMemberIcon,
            title: "Correct Member Data",
            desc: "Fix a member's name, ID, phone number, or assembly",
            onPress: () => setCorrectionOpen(true),
          },
        ].map((tool, i) => (
          <FadeIn key={tool.id} index={i}>
          <Btn onPress={tool.onPress}>
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
              <TintTile tint={tool.tint} size={46}>
                <tool.Icon size={20} color={tintFg(tool.tint, isDark)} />
              </TintTile>
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
                  {tool.title}
                </Txt>
                <Txt style={{ fontSize: 12, lineHeight: 17, marginTop: 2, color: c.mutedForeground }}>
                  {tool.desc}
                </Txt>
              </View>
              <ChevronRightIcon color={c.mutedForeground} />
            </Card>
          </Btn>
          </FadeIn>
        ))}
      </View>

      <Modal visible={correctionOpen} transparent animationType="slide" onRequestClose={() => setCorrectionOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7,12,24,0.62)" }}>
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => setCorrectionOpen(false)} />
          <View style={{ maxHeight: "88%", padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.card }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="displayExtraBold" style={{ fontSize: 20, color: c.foreground }}>Correct Member Data</Txt>
                <Txt style={{ fontSize: 12.5, lineHeight: 18, marginTop: 4, color: c.mutedForeground }}>Search for a member and update incorrect details.</Txt>
              </View>
              <Btn onPress={() => setCorrectionOpen(false)} style={{ padding: 8, borderRadius: 10, backgroundColor: c.muted }}>
                <XIcon size={16} color={c.mutedForeground} />
              </Btn>
            </View>

            <TextInput
              value={correctionSearch}
              onChangeText={setCorrectionSearch}
              placeholder="Search name, member ID, or phone"
              placeholderTextColor={c.mutedForeground}
              style={{ marginTop: 16, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: c.muted, color: c.foreground, fontFamily: BODY.regular, fontSize: 13 }}
            />

            {!correctionMember ? (
              <ScrollView style={{ marginTop: 10 }} keyboardShouldPersistTaps="handled">
                {correctionMatches.map((member) => (
                  <Btn key={member.id} onPress={() => chooseCorrectionMember(member)} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.border }}>
                    <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>{member.name}</Txt>
                    <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>{member.memberId} · {member.phone}</Txt>
                  </Btn>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={{ marginTop: 12 }} keyboardShouldPersistTaps="handled">
                <MiniForm title="Correct fields">
                  <MiniField placeholder="First name" value={correctionFirstName} onChangeText={setCorrectionFirstName} />
                  <MiniField placeholder="Middle name" value={correctionMiddleName} onChangeText={setCorrectionMiddleName} />
                  <MiniField placeholder="Last name" value={correctionLastName} onChangeText={setCorrectionLastName} />
                  <MiniField placeholder="Member ID" value={correctionId} onChangeText={setCorrectionId} />
                  <MiniField placeholder="Phone number" value={correctionPhone} onChangeText={setCorrectionPhone} keyboardType="phone-pad" />
                  <MiniField placeholder="Assigned assembly" value={correctionAssembly} onChangeText={setCorrectionAssembly} />
                  <MiniSave label="Save correction" onPress={saveCorrection} disabled={!correctionFirstName.trim() || !correctionLastName.trim() || !correctionId.trim()} color={BRAND.gold} />
                </MiniForm>
                <Btn onPress={() => setCorrectionMember(null)} style={{ paddingVertical: 12, alignItems: "center" }}>
                  <Txt variant="bodySemi" style={{ fontSize: 13, color: c.primary }}>Choose a different member</Txt>
                </Btn>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Record categories */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
          Record Categories
        </Txt>

        {visibleRecordSections(loginRole).map((section, sectionIndex) => {
          const isOpen = expandedSection === section.id;
          const accentColor = isDark ? section.darkColor : section.color;

          return (
            <FadeIn key={section.id} index={sectionIndex}>
            <Card style={{ overflow: "hidden" }} borderColor={isOpen ? accentColor + "66" : c.border}>
              <Btn
                onPress={() => setExpandedSection(isOpen ? null : section.id)}
                scale={1}
                style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: accentColor + "18" }}>
                  {React.createElement(SECTION_ICONS[section.icon] ?? UsersIcon, { size: 20, color: accentColor })}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Txt variant="displayBold" style={{ flex: 1, fontSize: 14, lineHeight: 18, color: c.foreground }}>
                      {section.title}
                    </Txt>
                    {section.pending > 0 ? (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? "#D9770622" : "#FEF3C7" }}>
                        <Txt variant="bodySemi" style={{ fontSize: 10, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                          {section.pending} pending
                        </Txt>
                      </View>
                    ) : null}
                  </View>

                  <Txt numberOfLines={1} style={{ fontSize: 11, marginTop: 2, color: c.mutedForeground }}>
                    {section.desc}
                  </Txt>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: c.muted }}>
                      <View style={{ height: "100%", width: `${section.pct}%`, borderRadius: 3, backgroundColor: accentColor }} />
                    </View>
                    <Txt variant="bodySemi" style={{ fontSize: 10, color: accentColor }}>
                      {section.pct}%
                    </Txt>
                  </View>
                </View>

                <ChevronDownIcon open={isOpen} color={c.mutedForeground} />
              </Btn>

              {isOpen ? (
                <View style={{ borderTopWidth: 1, borderTopColor: c.border }}>
                  <View style={{ padding: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {section.actions.map((action, i) => (
                      <Btn
                        key={i}
                        onPress={SECTION_ACTIONS[action]}
                        disabled={busy}
                        style={{
                          width: "47%",
                          flexGrow: 1,
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: accentColor + "0F",
                          borderWidth: 1,
                          borderColor: accentColor + "33",
                        }}
                      >
                        <Txt variant="bodySemi" style={{ fontSize: 11, lineHeight: 15, color: accentColor }}>
                          {action}
                        </Txt>
                      </Btn>
                    ))}
                  </View>

                  {section.id === "members" ? (
                    <MiniForm title={`Quick Add Member — ${directory.length} on file`}>
                      <MiniField placeholder="First name" value={mFirstName} onChangeText={setMFirstName} inputRef={nameRef} />
                      <MiniField placeholder="Middle name" value={mMiddleName} onChangeText={setMMiddleName} />
                      <MiniField placeholder="Last name" value={mLastName} onChangeText={setMLastName} />
                      <MiniField placeholder="Phone number" value={mPhone} onChangeText={setMPhone} inputRef={undefined} keyboardType="phone-pad" />
                      <MiniField placeholder="Member ID (e.g. MEM-0731)" value={mId} onChangeText={setMId} inputRef={memberIdRef} />
                      <MiniField placeholder="Assigned assembly" value={mAssembly} onChangeText={setMAssembly} inputRef={assemblyRef} />
                      <MiniSave
                        label={memberReady ? `Add ${mFirstName.trim()}` : "First, last name and membership ID required"}
                        onPress={submitMember}
                        disabled={!memberReady}
                        color={accentColor}
                      />
                    </MiniForm>
                  ) : null}

                  {section.id === "attendance" ? (
                    <MiniForm title="Geofence Config">
                      <MiniField placeholder="Latitude (e.g. 7.3407)" value={gLat} onChangeText={setGLat} inputRef={latRef} keyboardType="numeric" />
                      <MiniField placeholder="Longitude (e.g. -2.3340)" value={gLng} onChangeText={setGLng} keyboardType="numeric" />
                      <MiniField placeholder="Radius in metres (e.g. 100)" value={gRadius} onChangeText={setGRadius} keyboardType="numeric" />
                      <Btn
                        onPress={useHerePosition}
                        style={{
                          paddingVertical: 11,
                          borderRadius: RADIUS.md,
                          alignItems: "center",
                          marginBottom: 8,
                          backgroundColor: c.muted,
                        }}
                      >
                        <Txt variant="bodySemi" style={{ fontSize: 12.5, color: accentColor }}>
                          {fix ? "Use where I'm standing now" : "Waiting for GPS…"}
                        </Txt>
                      </Btn>
                      <MiniSave label="Save Geofence Settings" onPress={submitGeofence} color={accentColor} />
                    </MiniForm>
                  ) : null}

                  {section.id === "milestones" ? (
                    <MiniForm title={`Mark Milestone — ${milestoneLog.length} recorded`}>
                      <MiniField placeholder="Member ID or name" value={msMember} onChangeText={setMsMember} inputRef={milestoneMemberRef} />

                      {MILESTONE_LABELS.map((label) => {
                        const done = msTicked.includes(label);
                        return (
                          <Btn
                            key={label}
                            onPress={() => toggleTick(label)}
                            scale={1}
                            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}
                          >
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                borderWidth: 2,
                                alignItems: "center",
                                justifyContent: "center",
                                borderColor: done ? accentColor : c.border,
                                backgroundColor: done ? accentColor + "22" : "transparent",
                              }}
                            >
                              {done ? <CheckIcon size={12} color={accentColor} strokeWidth={3} /> : null}
                            </View>
                            <Txt style={{ fontSize: 12, color: done ? c.foreground : c.mutedForeground }}>{label}</Txt>
                          </Btn>
                        );
                      })}

                      <MiniSave
                        label={
                          msMember.trim() === ""
                            ? "Member required"
                            : msTicked.length === 0
                              ? "Tick at least one"
                              : `Save ${msTicked.length} Milestone${msTicked.length === 1 ? "" : "s"}`
                        }
                        onPress={submitMilestones}
                        disabled={msMember.trim() === "" || msTicked.length === 0}
                        color={accentColor}
                      />
                    </MiniForm>
                  ) : null}

                </View>
              ) : null}
            </Card>
            </FadeIn>
          );
        })}
      </View>

      {/* Super admin gateway */}
      {loginRole === "superAdmin" ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Btn onPress={onOpenSuperAdmin} style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: isDark ? "#DC262655" : BRAND.red }}>
            <LinearGradient
              colors={isDark ? ["#450a0a", "#1E293B"] : ["#FEF2F2", "#FEE2E2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 16 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#DC262622" : "#FCA5A5" }}>
                <ShieldIcon size={20} color={BRAND.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: BRAND.red }}>
                  Super Admin Control Center
                </Txt>
                <Txt style={{ fontSize: 12, marginTop: 2, color: isDark ? BRAND.redLight : "#991B1B" }}>
                  {isSuperAdmin ? "Access granted — tap to open" : "Restricted — super admin only"}
                </Txt>
              </View>
              <ChevronRightIcon color={BRAND.red} />
            </LinearGradient>
          </Btn>
        </View>
      ) : null}
    </ScrollView>
  );
}
