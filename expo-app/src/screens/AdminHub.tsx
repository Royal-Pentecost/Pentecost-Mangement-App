import React, { useRef, useState } from "react";
import { GH_PREFIX, fromStoredNumber, ghanaDigits, toLocalNumber } from "../phone";
import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { BODY, BRAND, ICON_TILE, RADIUS, useTheme } from "../theme";
import {
  LoginRole,
  Member,
  MILESTONE_LABELS,
  MilestoneLabel,
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

import { Btn, Card, Ping, Pulse, TintTile, Txt, tintFg, useKeyboardHeight } from "../ui";
import { FadeIn, PopIn } from "../motion";
import { useLocation } from "../location";
import { useDirectory } from "../directory";

import * as Api from "../api/resources";
import { describeError, useSession } from "../session";
import { usePullToRefresh } from "../refresh";

/** The app's milestone labels, in the server's vocabulary. */
const MILESTONE_TYPE: Record<string, "baptism" | "confirmation" | "certification" | "other"> = {
  "Water Baptism": "baptism",
  Confirmation: "confirmation",
  "Marriage Certification": "certification",
};

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
  prefix,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  keyboardType?: "default" | "numeric" | "phone-pad";
  /** Fixed text shown before the input, e.g. "+233". */
  prefix?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 8, flexDirection: "row", alignItems: "center", borderRadius: RADIUS.sm, backgroundColor: c.card }}>
      {prefix ? (
        <Txt variant="bodySemi" style={{ fontSize: 12.5, paddingLeft: 12, color: c.mutedForeground }}>
          {prefix}
        </Txt>
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          paddingHorizontal: prefix ? 8 : 12,
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

/**
 * A labelled pair of choices, sitting on the same surface as `MiniField`.
 *
 * Not `ChipRow`: that one fills an unselected chip with `c.muted`, which is
 * exactly the colour a `MiniForm` is drawn on — inside one, the pills vanish
 * and the options read as two stray words.
 */
function MiniChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 8 }}>
      <Txt style={{ fontSize: 11, marginBottom: 6, color: c.mutedForeground }}>{label}</Txt>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((o) => {
          const active = o.id === value;
          return (
            <Btn
              key={o.id}
              onPress={() => onChange(o.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: RADIUS.sm,
                alignItems: "center",
                borderWidth: 1,
                borderColor: active ? BRAND.navy : c.border,
                backgroundColor: active ? BRAND.navy : c.card,
              }}
            >
              <Txt variant="bodySemi" style={{ fontSize: 12.5, color: active ? "#fff" : c.mutedForeground }}>
                {o.label}
              </Txt>
            </Btn>
          );
        })}
      </View>
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

/**
 * "14/09/1998" → "1998-09-14", the form the server stores. Blank stays blank
 * ("not known"); anything that is not a real past date comes back null so the
 * form can say so instead of sending something the server rejects.
 */
function toIsoDate(typed: string): string | null {
  const t = typed.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{4})$/);
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || year < 1900 || date.getTime() > Date.now()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "1998-09-14" → "14/09/1998", how Ghana writes a date. */
function fromIsoDate(iso?: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : "";
}

/**
 * "Royal Youth Choir, Church Secretary" → a list. The Evangelism Ministry is
 * left out because every member is in it — the server adds it to every record.
 */
function parseRoles(text: string): string[] {
  return text
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r && r.toLowerCase() !== "evangelism ministry");
}

const MARITAL_OPTIONS: { id: Api.MaritalStatus; label: string }[] = [
  { id: "single", label: "Single" },
  { id: "married", label: "Married" },
  { id: "widowed", label: "Widowed" },
  { id: "divorced", label: "Divorced" },
];

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
  // Pull down anywhere on this page to reload everything the app shows.
  const pullToRefresh = usePullToRefresh();
  const { c, isDark } = useTheme();
  const { manualAttendance } = useContent();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const [correctionSearch, setCorrectionSearch] = useState("");
  const [correctionMember, setCorrectionMember] = useState<Member | null>(null);
  const [correctionFirstName, setCorrectionFirstName] = useState("");
  const [correctionMiddleName, setCorrectionMiddleName] = useState("");
  const [correctionLastName, setCorrectionLastName] = useState("");
  const [correctionPhone, setCorrectionPhone] = useState("");
  const [correctionSex, setCorrectionSex] = useState<"M" | "F" | "">("");
  const [correctionDob, setCorrectionDob] = useState("");
  const [correctionResidence, setCorrectionResidence] = useState("");
  const [correctionMarital, setCorrectionMarital] = useState<Api.MaritalStatus | "">("");
  const [correctionRoles, setCorrectionRoles] = useState("");

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

  /**
   * Every member on the roll with their attendance figures, as a spreadsheet —
   * read fresh from the server, not from what this screen happens to hold.
   */
  const exportRecords = () =>
    run(async () => {
      try {
        const [members, stats] = await Promise.all([Api.exportMembers(), Api.exportStats()]);
        const year = new Date().getFullYear();
        const statFor = new Map(stats.filter((s) => s.year === year && s.member).map((s) => [s.member!.id, s]));
        const rows = members
          .slice()
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
          .map((m) => {
            const s = statFor.get(m.id);
            return [
              m.member_id, m.full_name, m.phone_number ?? "", m.sex ?? "", m.date_of_birth ?? "",
              m.day_born_group?.name ?? "", m.residence ?? "", m.marital_status ?? "", (m.church_roles ?? []).join("; "),
              m.role.replace("_", " "), m.assembly?.name ?? "",
              s ? Number(s.annual_score_percent).toFixed(0) : "", s ? s.sessions_attended : "", s ? s.sessions_possible : "",
              s ? s.current_streak_weeks : "", s ? s.longest_streak_weeks : "",
            ];
          });
        const out = await exportTextFile(
          stampedName("member-records", "csv"),
          "text/csv",
          toCsv(
            ["Member ID", "Name", "Phone", "Sex", "Date of Birth", "Day-Born Group", "Residence", "Marital Status", "Church Roles",
             "App Role", "Assembly", `Sunday Attendance % (${year})`, "Sundays Attended", "Sundays Held", "Current Sunday Streak", "Best Streak"],
            rows,
          ),
        );
        return out.ok ? { ok: true, message: `${rows.length} member records exported. ${out.message}` } : out;
      } catch (e) {
        return { ok: false, message: describeError(e) };
      }
    });

  /** One row per attendance mark — who signed into which service, when, and how. */
  const exportAttendance = () =>
    run(async () => {
      try {
        const [sessions, records] = await Promise.all([Api.exportSessions(), Api.exportRecords()]);
        const sessionFor = new Map(sessions.map((s) => [s.id, s]));
        const minutes = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 60000);
        const rows = records
          .map((r) => ({ r, s: sessionFor.get(r.session) }))
          .sort((a, b) => (b.s?.opened_at ?? "").localeCompare(a.s?.opened_at ?? "") || (a.r.member?.full_name ?? "").localeCompare(b.r.member?.full_name ?? ""))
          .map(({ r, s }) => [
            s?.opened_at.slice(0, 10) ?? "", s?.service_name ?? "", s?.opened_at.slice(11, 16) ?? "",
            r.member?.member_id ?? "", r.member?.full_name ?? "",
            r.method === "manual" ? "Manual (admin)" : "GPS", r.marked_at.slice(11, 16),
            s ? minutes(s.opened_at, r.marked_at) : "", r.method === "manual" ? "" : r.distance_from_center_meters,
            r.is_first_timer ? "Yes" : "No", r.recorded_by?.full_name ?? "", r.note ?? "",
          ]);
        const out = await exportTextFile(
          stampedName("attendance-report", "csv"),
          "text/csv",
          toCsv(
            ["Date", "Service", "Service Opened", "Member ID", "Name", "Signed In By", "Signed In At", "Minutes After Start",
             "Distance From Church (m)", "First Timer", "Recorded By", "Note"],
            rows,
          ),
        );
        return out.ok
          ? { ok: true, message: `${rows.length} attendance marks across ${sessions.length} services exported. ${out.message}` }
          : out;
      } catch (e) {
        return { ok: false, message: describeError(e) };
      }
    });

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
  //
  // Read before the correction form below, which searches the real roll rather
  // than the seeded `directory` — correcting a record only means something if
  // the record is the one the server holds.
  const { members: liveMembers, loading: directoryLoading, refresh: refreshDirectory } = useDirectory();

  const {
    geofence,
    saveGeofence,
    milestoneLog,
    logMilestone,
  } = useContent();

  // Searched against the roll the server holds, not the seeds. With 328 names
  // an empty box would otherwise list the first six alphabetically, which is
  // never who the admin came to correct — so it asks for a search first.
  const correctionQuery = correctionSearch.trim().toLowerCase();
  const correctionMatches = correctionQuery
    ? liveMembers
        .filter(
          (member) =>
            member.name.toLowerCase().includes(correctionQuery) ||
            member.memberId.toLowerCase().includes(correctionQuery) ||
            member.phone.includes(correctionQuery),
        )
        .slice(0, 8)
    : [];

  const chooseCorrectionMember = (member: Member) => {
    setCorrectionMember(member);
    const names = splitMemberName(member.name);
    setCorrectionFirstName(member.firstName ?? names.first);
    setCorrectionMiddleName(member.middleName ?? names.middle);
    setCorrectionLastName(member.lastName ?? names.last);
    setCorrectionPhone(fromStoredNumber(member.phone));
    setCorrectionSex(member.sex === "M" || member.sex === "F" ? member.sex : "");
    setCorrectionDob(fromIsoDate(member.dateOfBirth));
    setCorrectionResidence(member.residence ?? "");
    setCorrectionMarital((member.maritalStatus?.toLowerCase() as Api.MaritalStatus) || "");
    setCorrectionRoles(parseRoles((member.departments ?? []).join(", ")).join(", "));
  };

  const [savingCorrection, setSavingCorrection] = useState(false);

  /**
   * Writes the correction to the server.
   *
   * It used to write to local state only, so a fixed name was right on this
   * phone until the app was closed and wrong on everyone else's the whole time.
   * The record belongs to the server; this sends it there and re-reads the
   * roll, so what the admin sees afterwards is what was actually stored.
   *
   * `member_id` is not sent — it is the church's own identifier and read-only
   * on the server. Renaming one would break every attendance record pointing
   * at it, so a wrong id is a conversation with the church, not a form field.
   */
  const saveCorrection = async () => {
    if (!correctionMember || !correctionFirstName.trim() || !correctionLastName.trim()) return;
    const fullName = [correctionFirstName, correctionMiddleName, correctionLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    const dob = toIsoDate(correctionDob);
    if (dob === null) {
      setStatus({ ok: false, message: "Date of birth must be a real date written DD/MM/YYYY, e.g. 14/09/1998." });
      return;
    }

    setSavingCorrection(true);
    try {
      const saved = await Api.updateMemberRecord(correctionMember.id, {
        full_name: fullName,
        // Sent even when blank: an empty box means "remove the login", which is
        // how an admin undoes a number typed against the wrong person.
        phone_number: toLocalNumber(correctionPhone),
        sex: correctionSex,
        date_of_birth: dob,
        residence: correctionResidence.trim(),
        marital_status: correctionMarital,
        church_roles: parseRoles(correctionRoles),
      });
      await refreshDirectory();

      // The server's copy, not what was typed — "+233 24 XXX XXXX" is stored as
      // "024XXXXXXX", and the stored form is the one the member signs in with.
      const phoneNote = saved.phone_number
        ? ` They sign in with ${saved.phone_number}.`
        : " They have no phone number on file.";
      setStatus({ ok: true, message: `${fullName}'s record was corrected.${phoneNote}` });
      setCorrectionMember(null);
      setCorrectionSearch("");
      setCorrectionOpen(false);
    } catch (e) {
      // Kept open with the typed values intact — a rejected number is usually
      // a typo, and closing the sheet would make them find the member again.
      setStatus({ ok: false, message: describeError(e) });
    } finally {
      setSavingCorrection(false);
    }
  };

  // Quick add member
  const nameRef = useRef<TextInput | null>(null);
  const memberIdRef = useRef<TextInput | null>(null);
  const [mFirstName, setMFirstName] = useState("");
  const [mMiddleName, setMMiddleName] = useState("");
  const [mLastName, setMLastName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mId, setMId] = useState("");
  const [mSex, setMSex] = useState<"M" | "F" | "">("");
  const [mDob, setMDob] = useState("");
  const [mResidence, setMResidence] = useState("");
  const [mMarital, setMMarital] = useState<Api.MaritalStatus | "">("");
  const [mRoles, setMRoles] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // The member ID is no longer required — the server allocates the next free
  // one. Asking an admin to invent it was how two people adding members during
  // the same service ended up guessing the same number.
  const memberReady = mFirstName.trim() !== "" && mLastName.trim() !== "";

  const submitMember = async () => {
    const fullName = [mFirstName, mMiddleName, mLastName].map((part) => part.trim()).filter(Boolean).join(" ");
    const dob = toIsoDate(mDob);
    if (dob === null) {
      setStatus({ ok: false, message: "Date of birth must be a real date written DD/MM/YYYY, e.g. 14/09/1998." });
      return;
    }

    // Added on the server, so the member exists for every device — adding them
    // only in local state would lose them on the next launch.
    setAddingMember(true);
    try {
      const created = await Api.createMemberRecord({
        member_id: mId.trim() || undefined,
        full_name: fullName,
        phone_number: toLocalNumber(mPhone) || undefined,
        sex: mSex,
        // The server places them in their day-born group from this date.
        date_of_birth: dob,
        residence: mResidence.trim(),
        marital_status: mMarital,
        church_roles: parseRoles(mRoles),
      });
      await refreshDirectory();
      setStatus({
        ok: true,
        message:
          `${fullName} added as ${created.member_id}.` +
          (mPhone
            ? ` They can sign in with ${toLocalNumber(mPhone)}.`
            : " Add a phone number when you have one so they can sign in."),
      });
    } catch (e) {
      // The typed values stay put: a rejected phone number or a taken ID is a
      // correction to make, not a reason to retype the whole person.
      setStatus({ ok: false, message: describeError(e) });
      return;
    } finally {
      setAddingMember(false);
    }
    setMFirstName("");
    setMMiddleName("");
    setMLastName("");
    setMPhone("");
    setMSex("");
    setMDob("");
    setMResidence("");
    setMMarital("");
    setMRoles("");
    setMId("");
  };

  // Geofence
  const { fix } = useLocation();
  const { member: verifiedMember } = useSession();
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

  const submitGeofence = async () => {
    saveGeofence({ lat: gLat.trim(), lng: gLng.trim(), radius: gRadius.trim() });

    // The boundary belongs to the assembly on the server; saving it only on this
    // phone would leave every other device measuring against the old centre.
    const assemblyId = verifiedMember?.assembly?.id;
    if (assemblyId) {
      try {
        await Api.updateAssembly(assemblyId, {
          geofence_center_lat: gLat.trim(),
          geofence_center_lng: gLng.trim(),
          geofence_radius_meters: Number(gRadius.trim()) || 100,
        });
      } catch (e) {
        setStatus({ ok: false, message: describeError(e) });
        return;
      }
    }

    setStatus({ ok: true, message: `Geofence set to ${gLat.trim()}, ${gLng.trim()} · ${gRadius.trim()}m radius` });
  };

  // Milestones
  const milestoneMemberRef = useRef<TextInput | null>(null);
  const [msMember, setMsMember] = useState("");
  const [msTicked, setMsTicked] = useState<MilestoneLabel[]>([]);

  const toggleTick = (label: MilestoneLabel) =>
    setMsTicked((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));

  const submitMilestones = async () => {
    const member = msMember.trim();
    msTicked.forEach((milestone) => logMilestone({ member, milestone, loggedBy: signedInAs }));

    // Match the typed name or id against the real roll, so the milestone lands
    // on a record rather than a string.
    const target = liveMembers.find(
      (m) =>
        m.memberId.toLowerCase() === member.toLowerCase() ||
        m.name.toLowerCase() === member.toLowerCase(),
    );
    if (!target) {
      setStatus({ ok: false, message: `No member matches "${member}".` });
      return;
    }

    try {
      await Promise.all(
        msTicked.map((label) =>
          Api.createMilestone({
            member: target.id as never,
            milestone_type: MILESTONE_TYPE[label] ?? "other",
            date_occurred: new Date().toISOString().slice(0, 10),
          }),
        ),
      );
      await refreshDirectory();
    } catch (e) {
      setStatus({ ok: false, message: describeError(e) });
      return;
    }
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
    "Correct Member Record": () => setCorrectionOpen(true),

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

  // Counts come from the roll the server holds, not a figure typed in once.
  const incompleteCount = liveMembers.filter((m) => !m.phone || !m.dayBorn).length;

  const overviewStats = [
    {
      label: "Total Members",
      value: directoryLoading ? "…" : liveMembers.length.toLocaleString(),
      sub: "Records",
      Icon: UsersIcon,
      color: isDark ? BRAND.blue : BRAND.navy,
      bg: isDark ? "#1E3A8A22" : "#EFF6FF",
    },
    {
      // "Incomplete" means the office still has work to do on the record —
      // most of the roll arrived without a phone number or a birth date.
      label: "Incomplete Profiles",
      value: directoryLoading ? "…" : String(incompleteCount),
      sub: "Pending",
      Icon: AlertTriangleIcon,
      color: isDark ? BRAND.goldLight : BRAND.gold,
      bg: isDark ? "#D9770622" : "#FEF3C7",
    },
    {
      label: "Active Sessions",
      value: sessionActive ? "1" : "0",
      sub: sessionActive ? "Live" : "Inactive",
      Icon: SignalIcon,
      color: sessionActive ? (isDark ? BRAND.greenLight : BRAND.greenDark) : isDark ? "#94A3B8" : "#6C757D",
      bg: sessionActive ? (isDark ? "#16A34A22" : "#DCFCE7") : c.muted,
    },
    { label: "Assemblies", value: "1", sub: "Active", Icon: ChurchIcon, color: isDark ? "#A78BFA" : BRAND.purple, bg: isDark ? "#7C3AED22" : "#EDE9FE" },
  ];

  const searchResults = liveMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ScrollView refreshControl={pullToRefresh} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset }} keyboardShouldPersistTaps="handled">
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
              {/* Same tile as every icon in the app; the figure beside it carries the colour. */}
              <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? ICON_TILE.dark.bg : ICON_TILE.light.bg }}>
                <stat.Icon size={18} color={isDark ? ICON_TILE.dark.fg : ICON_TILE.light.fg} />
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
            desc: "Fix a member's name, or give them the phone number they sign in with",
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
          {/* A fixed height, not maxHeight: a short result list used to shrink
              the sheet down into the keyboard's space, hiding the matches. Tall,
              the search box and its results stay near the top, above the keys. */}
          <View style={{ height: "90%", padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: c.card }}>
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
              <ScrollView style={{ marginTop: 10 }} contentContainerStyle={{ paddingBottom: keyboardHeight + 16 }} keyboardShouldPersistTaps="handled">
                {correctionMatches.map((member) => (
                  <Btn key={member.id} onPress={() => chooseCorrectionMember(member)} style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.border }}>
                    <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>{member.name}</Txt>
                    <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                      {member.memberId} · {member.phone || "no phone on file"}
                    </Txt>
                  </Btn>
                ))}

                {/* Three states, not one: nothing typed, nothing found, and the
                    roll still loading all read differently to an admin. */}
                {correctionMatches.length === 0 ? (
                  <Txt style={{ fontSize: 12.5, lineHeight: 19, paddingVertical: 18, textAlign: "center", color: c.mutedForeground }}>
                    {directoryLoading
                      ? "Loading the roll…"
                      : !correctionQuery
                        ? `Type a name, member ID, or phone number to search ${liveMembers.length.toLocaleString()} members.`
                        : `No member matches “${correctionSearch.trim()}”.`}
                  </Txt>
                ) : null}
              </ScrollView>
            ) : (
              <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: keyboardHeight + 16 }} keyboardShouldPersistTaps="handled">
                {/* The member ID is the church's own identifier and every
                    attendance record points at it, so it is shown rather than
                    offered as a field. */}
                <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: c.muted }}>
                  <Txt style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: c.mutedForeground }}>Correcting</Txt>
                  <Txt variant="displayBold" style={{ fontSize: 15, marginTop: 3, color: c.foreground }}>{correctionMember.name}</Txt>
                  <Txt style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>{correctionMember.memberId} · {correctionMember.assembly}</Txt>
                </View>

                <MiniForm title="Correct fields">
                  <MiniField placeholder="First name" value={correctionFirstName} onChangeText={setCorrectionFirstName} />
                  <MiniField placeholder="Middle name" value={correctionMiddleName} onChangeText={setCorrectionMiddleName} />
                  <MiniField placeholder="Last name" value={correctionLastName} onChangeText={setCorrectionLastName} />
                  <MiniField placeholder="Phone number (blank removes their login)" value={correctionPhone} onChangeText={(t) => setCorrectionPhone(ghanaDigits(t))} keyboardType="phone-pad" prefix={GH_PREFIX} />
                  <MiniChoice
                    label="Sex"
                    options={[{ id: "M" as const, label: "Male" }, { id: "F" as const, label: "Female" }]}
                    value={correctionSex}
                    onChange={(v) => setCorrectionSex(correctionSex === v ? "" : v)}
                  />
                  <MiniField placeholder="Date of birth — DD/MM/YYYY" value={correctionDob} onChangeText={setCorrectionDob} />
                  <MiniField placeholder="Residence (e.g. Ayigya Zongo)" value={correctionResidence} onChangeText={setCorrectionResidence} />
                  <MiniChoice
                    label="Marital status"
                    options={MARITAL_OPTIONS}
                    value={correctionMarital}
                    onChange={(v) => setCorrectionMarital(correctionMarital === v ? "" : v)}
                  />
                  <MiniField placeholder="Ministries & roles, separated by commas" value={correctionRoles} onChangeText={setCorrectionRoles} />
                  <Txt style={{ fontSize: 11, marginBottom: 8, color: c.mutedForeground }}>
                    Evangelism Ministry is on every member's record automatically.
                  </Txt>
                  <MiniSave
                    label={savingCorrection ? "Saving…" : "Save correction"}
                    onPress={saveCorrection}
                    disabled={savingCorrection || !correctionFirstName.trim() || !correctionLastName.trim()}
                    color={BRAND.gold}
                  />
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
                    <MiniForm title={`Quick Add Member — ${directoryLoading ? "…" : liveMembers.length.toLocaleString()} on file`}>
                      <MiniField placeholder="First name" value={mFirstName} onChangeText={setMFirstName} inputRef={nameRef} />
                      <MiniField placeholder="Middle name" value={mMiddleName} onChangeText={setMMiddleName} />
                      <MiniField placeholder="Last name" value={mLastName} onChangeText={setMLastName} />
                      <MiniField placeholder="Phone number (optional — gives them a login)" value={mPhone} onChangeText={(t) => setMPhone(ghanaDigits(t))} keyboardType="phone-pad" prefix={GH_PREFIX} />

                      {/* Sex decides how the app addresses them — "Mr Mensah"
                          rather than "Kwame" for an adult member. Tapping the
                          chosen one again clears it, because the roll really
                          does contain people whose sex was never recorded. */}
                      <MiniChoice
                        label="Sex — sets how the app addresses them (optional)"
                        options={[{ id: "M" as const, label: "Male" }, { id: "F" as const, label: "Female" }]}
                        value={mSex}
                        onChange={(v) => setMSex(mSex === v ? "" : v)}
                      />

                      {/* The register's details. All optional, so a visitor can
                          be added with just a name and completed later through
                          "Correct a member record". */}
                      <MiniField placeholder="Date of birth — DD/MM/YYYY (sets their day-born group)" value={mDob} onChangeText={setMDob} />
                      <MiniField placeholder="Residence (e.g. Ayigya Zongo)" value={mResidence} onChangeText={setMResidence} />
                      <MiniChoice
                        label="Marital status (optional)"
                        options={MARITAL_OPTIONS}
                        value={mMarital}
                        onChange={(v) => setMMarital(mMarital === v ? "" : v)}
                      />
                      <MiniField placeholder="Ministries & roles, separated by commas (e.g. Royal Youth Choir)" value={mRoles} onChangeText={setMRoles} />
                      <Txt style={{ fontSize: 11, marginBottom: 8, color: c.mutedForeground }}>
                        Evangelism Ministry is added for every member automatically.
                      </Txt>

                      <MiniField placeholder="Member ID (optional — allocated for you)" value={mId} onChangeText={setMId} inputRef={memberIdRef} />
                      <MiniSave
                        label={
                          addingMember
                            ? "Adding…"
                            : memberReady
                              ? `Add ${mFirstName.trim()}`
                              : "First and last name required"
                        }
                        onPress={submitMember}
                        disabled={!memberReady || addingMember}
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
