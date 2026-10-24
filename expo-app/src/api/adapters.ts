import {
  AttendanceLog,
  DayBorn,
  Elder,
  LeaderOffice,
  LoginRole,
  Member,
  MilestoneLabel,
  ServiceSlot,
  UpcomingEvent,
  AppNotification,
  BibleStudy,
  DailyVerse,
  StudyText,
} from "../data";
import {
  ApiAttendanceRecord,
  ApiBibleStudyWeek,
  ApiDailyVerse,
  ApiElder,
  ApiEvent,
  ApiMember,
  ApiMemberAttendanceStat,
  ApiNotification,
  ApiSpiritualMilestone,
  ApiWeeklySchedule,
} from "./types";

/**
 * Translating the server's records into the shapes the screens already render.
 *
 * The two models do not line up field for field, and the gaps are the
 * interesting part:
 *
 * - **Avatars are invented here.** The server stores a photograph or nothing; the
 *   app also wants initials and a colour. Both are derived from the member's own
 *   id so they stay the same on every screen and between launches.
 * - **Attendance figures live on a separate record.** A member carries no score;
 *   `MemberAttendanceStat` does. Merge it in with `withStats` when it has been
 *   fetched, and the member reads zero until then rather than showing a
 *   confident wrong number.
 * - **Milestones are rows, not a checklist.** The server keeps one row per
 *   milestone that happened; the app shows the full list with ticks. `withMilestones`
 *   turns the former into the latter.
 */

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Monday = 0 … Sunday = 6 on the server. */
const WEEKDAY_NAMES: DayBorn[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function weekdayToDayBorn(weekday: number | null | undefined): DayBorn {
  return typeof weekday === "number" ? WEEKDAY_NAMES[weekday] ?? "Sunday" : "Sunday";
}

export function initialsOf(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

const AVATAR_COLOURS = ["#1E3A8A", "#15803D", "#B45309", "#6D28D9", "#0E7490", "#BE185D"];

/** Stable per person: the same member is the same colour everywhere, always. */
export function colourFor(seed: string): string {
  let n = 0;
  for (let i = 0; i < (seed ?? "").length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[n % AVATAR_COLOURS.length];
}

/** "2026-10-22T08:15:00Z" -> "22 Oct 2026". */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The year a record began, for the "in service since" line. */
function yearOf(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : "";
}

// ─── Members ─────────────────────────────────────────────────────────────────

/** The server's role names, in the app's vocabulary. */
const API_ROLE: Record<string, LoginRole> = {
  member: "member",
  assembly_admin: "admin",
  super_admin: "superAdmin",
};

export function toMember(m: ApiMember): Member {
  return {
    id: m.id,
    memberId: m.member_id,
    name: m.full_name,
    assembly: m.assembly?.name ?? "",
    assemblyId: m.assembly?.id ?? "",
    district: "",
    // Not `created_at` — that is the day the roll was imported, which made
    // every member "Member since 2026". The church gave no joining date.
    since: "",
    photo: m.profile_photo ?? "",
    // Lives on the login, not the member row — empty for the two thirds of the
    // roll who have no number on file yet, which is a fact worth showing rather
    // than hiding.
    phone: m.phone_number ?? "",
    email: "",
    avatar: initialsOf(m.full_name),
    avatarColor: colourFor(m.member_id || m.id),
    category: "Baptized",
    // The ministries and departments from the church's roll.
    departments: m.church_roles ?? [],
    residence: m.residence ?? "",
    maritalStatus: m.marital_status ? m.marital_status[0].toUpperCase() + m.marital_status.slice(1) : "",
    // Filled in by `withStats` once the figures have been fetched. Zero here is
    // honest: the app has not been told the score yet.
    attendancePct: 0,
    streak: 0,
    attendanceLogs: [],
    milestones: [],
    elderId: m.assigned_elder?.id ?? "",
    dayBorn: weekdayToDayBorn(m.day_born_group?.weekday),
    role: API_ROLE[m.role] ?? "member",
    sex: m.sex ?? "",
    dateOfBirth: m.date_of_birth ?? null,
    // The server models a group's leader on the group, not the member, so this
    // is resolved by `markGroupLeaders` once the groups are known.
    dayBornLeader: false,
  };
}

/** Flags the members who lead their day-born group. */
export function markGroupLeaders(members: Member[], leaderMemberIds: Set<string>): Member[] {
  return members.map((m) => (leaderMemberIds.has(m.id) ? { ...m, dayBornLeader: true } : m));
}

/** Merges a member's attendance figures in, once they have been fetched. */
export function withStats(member: Member, stat: ApiMemberAttendanceStat | undefined): Member {
  if (!stat) return member;
  const pct = Number(stat.annual_score_percent);
  return {
    ...member,
    attendancePct: Number.isFinite(pct) ? Math.round(pct) : 0,
    streak: stat.current_streak_weeks ?? 0,
    longestStreak: stat.longest_streak_weeks ?? 0,
    attended: stat.sessions_attended ?? 0,
    held: stat.sessions_possible ?? 0,
    avgArrival: stat.average_arrival_minutes ?? null,
  };
}

/** The app shows every milestone with a tick; the server stores only what happened. */
export function withMilestones(
  member: Member,
  rows: ApiSpiritualMilestone[],
  labels: readonly MilestoneLabel[],
): Member {
  const done = new Set(rows.map((r) => r.milestone_type));
  const BY_LABEL: Record<string, string> = {
    "Water Baptism": "baptism",
    Confirmation: "confirmation",
    "Marriage Certification": "certification",
  };
  return {
    ...member,
    milestones: labels.map((label) => ({ label, done: done.has(BY_LABEL[label] as never) })),
  };
}

export function toAttendanceLog(r: ApiAttendanceRecord, serviceName: string): AttendanceLog {
  return {
    date: shortDate(r.marked_at),
    service: serviceName,
    // The server only records attendance that happened; an absence is the
    // absence of a row, so anything here is a presence.
    status: "present",
  };
}

// ─── Leaders ─────────────────────────────────────────────────────────────────

/**
 * The server's office vocabulary is narrower than the church's.
 *
 * It offers `presiding | counseling | other`, while the directory filters by
 * Elder, Deacon and Deaconess — so the real rank is read from the free-text
 * title, falling back to the office when the title says nothing useful.
 */
export function toLeaderOffice(e: ApiElder): LeaderOffice {
  const title = (e.title ?? "").toLowerCase();
  if (title.includes("deaconess")) return "Deaconess";
  if (title.includes("deacon")) return "Deacon";
  return "Elder";
}

export function toElder(e: ApiElder): Elder {
  const name = e.member?.full_name ?? e.title ?? "Leader";
  return {
    id: e.id,
    // The member behind the office — how a leader recognises their own entry.
    memberRef: e.member?.id,
    name,
    title: e.title || "Elder",
    office: toLeaderOffice(e),
    assembly: "",
    assemblyId: "",
    // Not `created_at`: that is when the roll was imported, which would say
    // every leader in the church took office the same year. The server keeps
    // no ordination date, so the line is left off rather than made up.
    since: "",
    photo: e.member?.profile_photo ?? "",
    phone: e.contact_phone ?? "",
    email: e.contact_email ?? "",
    bio: "",
    roles: [],
    officeHours: "",
    avatar: initialsOf(name),
    avatarColor: colourFor(e.member?.member_id || e.id),
  };
}

// ─── Published content ───────────────────────────────────────────────────────

const WEEKDAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** "19:00:00" -> "7:00 PM". */
function clockLabel(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h)) return "";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function toServiceSlot(s: ApiWeeklySchedule): ServiceSlot {
  const start = typeof s.start_weekday === "number" ? WEEKDAY_SHORT[s.start_weekday] : "";
  const end = typeof s.end_weekday === "number" ? WEEKDAY_SHORT[s.end_weekday] : "";
  return {
    id: s.id,
    day: start && end && start !== end ? `${start}-${end}` : start || "",
    name: s.name,
    time: clockLabel(s.time),
    venue: s.location || "",
    cover: s.banner_image ?? undefined,
  };
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toEvent(e: ApiEvent): UpcomingEvent {
  // "Nov 14", month first, built by hand. `toLocaleDateString("en-GB")` gave
  // "14 Nov", and the dashboard tile reads the first word as the month — so
  // every event showed its day where the month belongs. Read from the string
  // rather than through `Date` so no timezone can move it a day either way.
  const [, mm, dd] = e.event_date.split("-").map(Number);
  const date = mm && dd ? `${MONTH_SHORT[mm - 1]} ${dd}` : e.event_date;
  return {
    id: e.id,
    isoDate: e.event_date,
    date,
    name: e.title,
    tag: e.description || (e.scope === "district" ? "District" : "Assembly"),
    cover: e.cover_image ?? undefined,
  };
}

/** Which app-side kind a server notification belongs to. */
const NOTIFICATION_KIND: Record<string, AppNotification["kind"]> = {
  session_open: "attendance",
  event: "event",
  bible_study: "study",
  streak: "attendance",
  elder_availability: "admin",
  system: "admin",
  daily_verse: "verse",
};

export function toNotification(n: ApiNotification, readIds: Set<string>): AppNotification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    time: shortDate(n.created_at),
    kind: NOTIFICATION_KIND[n.notification_type] ?? "admin",
    unread: !readIds.has(n.id),
  };
}

/**
 * The Bible study gap.
 *
 * The app's reader is bilingual by construction — English and Twi blocks, each
 * with aims, questions and a memory verse. The server carries a single title,
 * theme and scripture reference plus an optional PDF, and treats language as a
 * member preference. There is no honest way to synthesise the missing text, so
 * this returns what the server genuinely has and the caller decides what to show.
 */
/** The study text in one language, as the reader needs it. */
export interface StudyBody {
  title: string;
  aims: string[];
  questions: string[];
  memoryVerse: string;
  notes: string;
}

export interface StudyWeek {
  id: string;
  title: string;
  theme: string;
  scripture: string;
  pages: string;
  date: string;
  pdfUrl: string | null;
  published: boolean;
  weekNumber: number;
  /** Keyed by language. Absent languages simply have no entry. */
  text: Partial<Record<"en" | "tw", StudyBody>>;
}

/**
 * The study to show a member, in the language they read.
 *
 * Falls back to English when their language has not been written yet, and to
 * the week's own title when neither has — a member should always see *which*
 * study it is, even if the guide has not been typed out.
 */
export function studyBodyFor(week: StudyWeek, language: "en" | "tw"): StudyBody {
  return (
    week.text[language] ??
    week.text.en ??
    { title: week.title, aims: [], questions: [], memoryVerse: "", notes: "" }
  );
}

export function toStudyWeek(s: ApiBibleStudyWeek): StudyWeek {
  return {
    id: s.id,
    title: s.title,
    theme: s.theme,
    scripture: s.scripture_reference,
    pages: s.page_range ?? "",
    date: s.study_date,
    pdfUrl: s.pdf_file ?? null,
    published: s.is_published ?? false,
    weekNumber: s.week_number,
    text: Object.fromEntries(
      (s.translations ?? []).map((t) => [
        t.language,
        {
          title: t.title || s.title,
          aims: t.aims ?? [],
          questions: t.questions ?? [],
          memoryVerse: t.memory_verse ?? "",
          notes: t.notes ?? "",
        },
      ]),
    ),
  };
}

// ─── Bible study and the daily verse, as the screens read them ───────────────

/**
 * A server week as the app's `BibleStudy`.
 *
 * The week holds the pamphlet facts; the aims, questions and memory verse
 * live in an optional translation per language. A week with no English text
 * still shows its title and scripture, and Twi falls back to English — the
 * same rule the publish form has always used — so a reader never meets a
 * blank card.
 */
export function toBibleStudy(s: ApiBibleStudyWeek): BibleStudy {
  const byLang = new Map((s.translations ?? []).map((t) => [t.language, t]));
  const textFor = (lang: "en" | "tw"): StudyText | null => {
    const t = byLang.get(lang);
    if (!t) return null;
    return {
      title: t.title || s.title,
      chapter: s.scripture_reference,
      aims: t.aims ?? [],
      questions: t.questions ?? [],
      memoryVerse: t.memory_verse ?? "",
      notes: t.notes || undefined,
    };
  };
  const en: StudyText = textFor("en") ?? {
    title: s.title,
    chapter: s.scripture_reference,
    aims: [],
    questions: [],
    memoryVerse: "",
  };
  return {
    id: s.id,
    weekNumber: s.week_number,
    date: s.study_date,
    pages: s.page_range || "—",
    available: s.is_published ?? false,
    cover: s.cover_image ?? undefined,
    theme: s.theme || undefined,
    en,
    tw: textFor("tw") ?? en,
  };
}

export function toDailyVerse(v: ApiDailyVerse): DailyVerse {
  return {
    id: v.id,
    reference: v.reference,
    english: v.english,
    twi: v.twi,
    publishedOn: v.published_on,
  };
}
