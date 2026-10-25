import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import * as Api from "./api/resources";
import { toBibleStudy, toDailyVerse, toEvent, toNotification, toServiceSlot } from "./api/adapters";
import { ApiWeekday } from "./api/types";
import { describeError } from "./session";
import { useSession } from "./session";

import {
  AppNotification,
  BibleStudy,
  StudyText,
  DailyVerse,
  Geofence,
  Lang,
  Member,
  MilestoneLabel,
  MilestoneRecord,
  ManualAttendanceRecord,
  ManualAttendanceReason,
  ServiceSlot,
  Slide,
  UpcomingEvent,
  avatarColors,
  defaultGeofence,
  homeSlides as seedSlides,
} from "./data";

/**
 * Everything an admin can publish lives here rather than in module constants,
 * so a change made in the Admin Hub is on every member's dashboard the moment
 * it is saved. Seeded from `data.ts`; swap the seeds for a fetch when the
 * backend lands and the screens stay as they are.
 */
interface ContentState {
  schedule: ServiceSlot[];
  events: UpcomingEvent[];
  studies: BibleStudy[];
  manualAttendance: ManualAttendanceRecord[];
  notifications: AppNotification[];
  dailyVerse: DailyVerse | null;
  /** Resolves true once every phone can see it; false with `publishError` set. */
  publishDailyVerse: (input: { english: string; twi: string; reference: string }) => Promise<boolean>;
  removeDailyVerse: () => Promise<void>;
  /** The dashboard carousel: the seeded photographs plus every cover an admin has attached. */
  slides: Slide[];
  /** The language members read the study guide in. */
  language: Lang;
  setLanguage: (l: Lang) => void;

  /** Records the Admin Hub creates. The seeds come from `data.ts`. */
  directory: Member[];
  addMember: (m: { firstName: string; middleName: string; lastName: string; phone: string; assembly: string; memberId: string }) => void;
  updateMember: (id: string, patch: Partial<Pick<Member, "name" | "firstName" | "middleName" | "lastName" | "memberId" | "phone" | "assembly">>) => void;
  removeMember: (id: string) => void;

  geofence: Geofence;
  saveGeofence: (g: Geofence) => void;
  /**
   * Where the admin was standing when they opened the current session. Members
   * are checked against this rather than the configured geofence, so attendance
   * is signed at the place the service is actually being held — a convention in
   * a school hall, say — not wherever the fence was last typed in. Null between
   * sessions, when the configured geofence applies again.
   */
  sessionOrigin: Geofence | null;
  openSessionAt: (origin: Geofence | null) => void;
  closeSession: () => void;


  milestoneLog: MilestoneRecord[];
  logMilestone: (m: { member: string; milestone: MilestoneLabel; loggedBy: string }) => void;

  /** Resolves true once the server has it — photo included — and false with `publishError` set. */
  addService: (s: Omit<ServiceSlot, "id">) => Promise<boolean>;
  removeService: (id: string) => void;

  addEvent: (e: Omit<UpcomingEvent, "id" | "tint">) => Promise<boolean>;
  removeEvent: (id: string) => void;

  /** Resolves true once the server has the study, its text and its photo. */
  addStudy: (s: Omit<BibleStudy, "id">) => Promise<boolean>;
  removeStudy: (id: string) => Promise<void>;
  toggleStudy: (id: string) => Promise<void>;

  signAttendance: (input: {
    memberId: string;
    memberName: string;
    service: string;
    status: "present" | "late";
    reason: ManualAttendanceReason;
    signedBy: string;
  }) => void;
  undoAttendance: (id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
  /** Set when a publish failed to reach the server; null once one succeeds. */
  publishError: string | null;
  clearPublishError: () => void;
  /** Re-reads services, events, notifications and the assembly's fence. */
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentState | null>(null);

/** Ids only have to be unique within a session — the backend will own them later. */
let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

/**
 * A weekday from whatever the admin typed.
 *
 * These fields are free text on the publish form, so "Sunday", "SUN", "sun" and
 * "Sundays" all have to mean the same day. Matching only three-letter codes was
 * why a service typed as "Sunday" never reached the server: it parsed to null,
 * and the server rejects a null weekday.
 *
 * Returns null only when there is genuinely no day in the text, which the caller
 * reports rather than sending.
 */
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function toWeekday(label: string): ApiWeekday | null {
  const t = (label || "").trim().toLowerCase();
  if (!t) return null;
  const i = WEEKDAYS.findIndex((d) => t.startsWith(d.slice(0, 3)));
  return i >= 0 ? (i as ApiWeekday) : null;
}

/**
 * Splits "Mon-Wed", "Monday – Wednesday" or plain "Sunday" into its two ends.
 *
 * Any of the dashes a phone keyboard produces counts as a range.
 */
export function toWeekdayRange(label: string): { start: ApiWeekday | null; end: ApiWeekday | null } {
  // A dash, or the word "to" — not the letters t and o, which would split
  // "Monday" on its own "o" and leave nothing a weekday could be read from.
  const [from, to] = (label || "")
    .split(/\s*(?:-|–|—|to)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
  const start = toWeekday(from ?? "");
  return { start, end: to ? toWeekday(to) ?? start : start };
}

/**
 * "7:00 PM", "7pm", "19:00" -> "19:00:00".
 *
 * The server stores a real time field, so a label a person typed has to become
 * one. An unparseable time is reported to the admin rather than sent as
 * midnight — a service claiming to start at 00:00 is worse than one rejected.
 */
export function toApiTime(label: string): string | null {
  const m = (label || "").trim().match(/^(\d{1,2})[:.]?(\d{2})?\s*([AaPp])?\.?\s*[Mm]?\.?$/);
  if (!m) return null;

  let hour = Number(m[1]);
  const mins = Number(m[2] ?? 0);
  const half = m[3]?.toUpperCase();

  if (half === "P" && hour < 12) hour += 12;
  if (half === "A" && hour === 12) hour = 0;
  if (hour > 23 || mins > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

/**
 * The app writes dates the way a person reads them ("12 Nov"); the server wants
 * ISO. A date with no year is taken as this year.
 */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * An event date as typed into the form, as `YYYY-MM-DD` — or null.
 *
 * Parsed by hand. This used `new Date("Sep 14 2026")`, which a desktop browser
 * understands and Hermes — the engine on the phone — does not reliably; when
 * it failed, the code quietly used *today*, so an event typed for September
 * was published for the day it was typed. Unreadable now means "say so".
 *
 * Takes "Sep 14", "14 Sep", "September 14", "14/09", "14-09-2026" and
 * "2026-09-14". With no year, the next occurrence of that day is meant —
 * nobody publishes an upcoming event for last March.
 */
export function parseEventDate(label: string, now = new Date()): string | null {
  const t = (label || "").trim().toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ");
  if (!t) return null;

  let y: number | null = null;
  let m: number | null = null;
  let d: number | null = null;

  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const numeric = t.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  const monthFirst = t.match(/^([a-z]{3,})\.? (\d{1,2})(?:st|nd|rd|th)?(?: (\d{4}))?$/);
  const dayFirst = t.match(/^(\d{1,2})(?:st|nd|rd|th)? ([a-z]{3,})\.?(?: (\d{4}))?$/);
  const monthIndex = (word: string) => {
    const i = MONTHS.indexOf(word.slice(0, 3));
    return i >= 0 ? i + 1 : null;
  };

  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  // Day first, as Ghana writes it: 14/09 is the fourteenth of September.
  else if (numeric) [d, m, y] = [Number(numeric[1]), Number(numeric[2]), numeric[3] ? Number(numeric[3]) : null];
  else if (monthFirst) [m, d, y] = [monthIndex(monthFirst[1]), Number(monthFirst[2]), monthFirst[3] ? Number(monthFirst[3]) : null];
  else if (dayFirst) [d, m, y] = [Number(dayFirst[1]), monthIndex(dayFirst[2]), dayFirst[3] ? Number(dayFirst[3]) : null];

  if (!m || !d || m > 12 || d > 31) return null;
  if (y !== null && y < 100) y += 2000;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let year = y ?? now.getFullYear();
  if (y === null && new Date(year, m - 1, d) < today) year += 1;

  const date = new Date(year, m - 1, d);
  // Rejects 31 September rather than rolling it over into October.
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const EVENT_TINTS = ["amber", "blue", "violet", "green"] as const;

function clockLabel() {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus, member: signedInMember } = useSession();
  /** Published content belongs to an assembly, and the server insists on knowing which. */
  const assemblyId = signedInMember?.assembly?.id ?? null;

  /**
   * Why the last publish did not land.
   *
   * Swallowing this was how a schedule could be "published" to an admin's own
   * screen and never reach the server — the request failed, the catch discarded
   * it, and nobody found out until a member noticed their dashboard was empty.
   */
  const [publishError, setPublishError] = useState<string | null>(null);

  // From the server only — sample data here showed invented services, events
  // and notifications whenever a fetch failed.
  const [schedule, setSchedule] = useState<ServiceSlot[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  // From the server only. The sample studies seeded here were what every
  // dashboard showed — invented weeks beside, or instead of, the real ones.
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [manualAttendance, setManualAttendance] = useState<ManualAttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [language, setLanguage] = useState<Lang>("en");
  const [directory, setDirectory] = useState<Member[]>([]);
  const [geofence, setGeofence] = useState<Geofence>(defaultGeofence);
  const [sessionOrigin, setSessionOrigin] = useState<Geofence | null>(null);
  const [milestoneLog, setMilestoneLog] = useState<MilestoneRecord[]>([]);

  /** Anything published also announces itself, so members see it without hunting. */
  const announce = useCallback((n: Omit<AppNotification, "id" | "time" | "unread">) => {
    setNotifications((list) => [{ ...n, id: nextId("n"), time: "Just now", unread: true }, ...list]);
  }, []);

  /**
   * Pulls published content from the server.
   *
   * Each read is allowed to fail on its own: a broken events endpoint should not
   * empty the weekly schedule as well, so a failure leaves that one list alone
   * rather than blanking the dashboard.
   */
  const clearPublishError = useCallback(() => setPublishError(null), []);

  const refreshContent = useCallback(async () => {
    const [apiSchedules, apiEvents, apiNotifications, apiReads, apiAssembly, apiStudies, apiVerses] = await Promise.all([
      Api.fetchSchedules().catch(() => null),
      Api.fetchEvents().catch(() => null),
      Api.fetchNotifications().catch(() => null),
      Api.fetchNotificationReads().catch(() => []),
      assemblyId ? Api.fetchAssembly(assemblyId).catch(() => null) : Promise.resolve(null),
      Api.fetchStudies().catch(() => null),
      Api.fetchDailyVerses().catch(() => null),
    ]);

    if (apiSchedules) setSchedule(apiSchedules.map(toServiceSlot));
    if (apiEvents) setEvents(apiEvents.map(toEvent));
    // Bible studies and the daily verse used to live only in the publishing
    // admin's app: "published" on their phone, absent from everyone else's.
    if (apiStudies) setStudies(apiStudies.map(toBibleStudy).sort((a, b) => a.date.localeCompare(b.date)));
    if (apiVerses) setDailyVerse(apiVerses[0] ? toDailyVerse(apiVerses[0]) : null);

    // The assembly's standing fence. An admin's edit in the hub was saved to
    // the server but never read back, so every launch began from the seeded
    // default — a point in Sunyani — and that was what the hub showed and what
    // the map drew whenever no session was open.
    if (apiAssembly?.geofence_center_lat && apiAssembly.geofence_center_lng && apiAssembly.geofence_radius_meters) {
      setGeofence({
        lat: apiAssembly.geofence_center_lat,
        lng: apiAssembly.geofence_center_lng,
        radius: String(apiAssembly.geofence_radius_meters),
      });
    }

    if (apiNotifications) {
      // "Read" is a row of its own, because one announcement goes to the whole
      // assembly and each member reads it separately.
      const readIds = new Set((apiReads ?? []).map((r) => r.notification));
      // Cleared ones stay gone after a relaunch; they still exist for everyone else.
      const cleared = new Set((apiReads ?? []).filter((r) => r.dismissed_at).map((r) => r.notification));
      setNotifications(apiNotifications.filter((n) => !cleared.has(n.id)).map((n) => toNotification(n, readIds)));
    }
  }, [assemblyId]);

  /**
   * Published content arrives while the app is already open.
   *
   * An admin adds a service during the week and every other phone has to find
   * out — fetching only at sign-in meant a member who stayed signed in for the
   * full 28 days would never see it. The schedule changes rarely, so this polls
   * far less often than the attendance session does, and it re-reads whenever
   * the app comes back to the foreground, which is when someone is most likely
   * to be looking at it.
   */
  useEffect(() => {
    if (sessionStatus !== "signedIn") return;

    void refreshContent();
    const timer = setInterval(() => void refreshContent(), 5 * 60 * 1000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshContent();
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [sessionStatus, refreshContent]);

  const addService = useCallback(
    async (s: Omit<ServiceSlot, "id">): Promise<boolean> => {
      // Shown immediately so the form feels answered, then reconciled with the
      // server's own record — which carries the id every other device will use.
      setSchedule((list) => [...list, { ...s, id: nextId("s") }]);

      const { start, end } = toWeekdayRange(s.day);
      const time = toApiTime(s.time);

      // The server refuses a null day or time, so say which one is wrong here
      // rather than letting it come back as a field error nobody reads.
      if (start === null || time === null) {
        setPublishError(
          start === null
            ? `Could not read "${s.day}" as a day. Try "Sunday" or "Mon-Wed".`
            : `Could not read "${s.time}" as a time. Try "7:00 PM" or "19:00".`,
        );
        await refreshContent();
        return false;
      }

      {
        try {
          const created = await Api.createSchedule({
            assembly_id: assemblyId ?? undefined,
            name: s.name,
            location: s.venue,
            time,
            start_weekday: start,
            end_weekday: end ?? start,
          });
          // The photograph goes up once the service exists to attach it to.
          // Without this the cover never left the publishing phone.
          if (s.cover) {
            try {
              await Api.uploadScheduleCover(created.id, s.cover);
            } catch (e) {
              setPublishError(`${s.name} was published, but its photo did not upload: ${describeError(e)}`);
              await refreshContent();
              return false;
            }
          }
          setPublishError(null);
          await refreshContent();
        } catch (e) {
          setPublishError(describeError(e));
          // Take back the optimistic row, or the admin sees a service no other
          // phone ever will.
          await refreshContent();
          return false;
        }
      }
      // Announced only once it is real — a notification for a refused publish
      // sent members looking for something that was never there.
      announce({
        kind: "event",
        title: `${s.name} added to the schedule`,
        body: `${s.day} at ${s.time}${s.venue ? ` — ${s.venue}` : ""}.`,
      });
      return true;
    },
    // `assemblyId` belongs here: left out, the callback kept the value from
    // before sign-in finished — none — and the server refused the publish.
    [announce, refreshContent, assemblyId],
  );

  const removeService = useCallback(async (id: string) => {
    setSchedule((list) => list.filter((s) => s.id !== id));
    await Api.deleteSchedule(id).catch(() => {});
  }, []);

  const addEvent = useCallback(
    async (e: Omit<UpcomingEvent, "id" | "tint">): Promise<boolean> => {
      const eventDate = parseEventDate(e.date);
      if (!eventDate) {
        setPublishError(`Could not read "${e.date}" as a date. Try "Sep 14" or "14/09/2026".`);
        return false;
      }

      setEvents((list) => [
        ...list,
        { ...e, id: nextId("ev"), tint: EVENT_TINTS[list.length % EVENT_TINTS.length] },
      ]);

      {
        try {
          const created = await Api.createEvent({
            assembly_id: assemblyId ?? undefined,
            title: e.name,
            description: e.tag,
            event_date: eventDate,
          });
          if (e.cover) {
            try {
              await Api.uploadEventCover(created.id, e.cover);
            } catch (err) {
              setPublishError(`${e.name} was published, but its photo did not upload: ${describeError(err)}`);
              await refreshContent();
              return false;
            }
          }
          setPublishError(null);
          await refreshContent();
        } catch (err) {
          setPublishError(describeError(err));
          // Take back the optimistic row, or the admin sees an event that no
          // other phone ever will.
          await refreshContent();
          return false;
        }
      }
      announce({
        kind: "event",
        title: e.name,
        body: `On ${e.date}. ${e.tag}`,
      });
      return true;
    },
    [announce, refreshContent, assemblyId],
  );

  const removeEvent = useCallback(async (id: string) => {
    setEvents((list) => list.filter((e) => e.id !== id));
    await Api.deleteEvent(id).catch(() => {});
  }, []);

  const addStudy = useCallback(
    async (s: Omit<BibleStudy, "id">): Promise<boolean> => {
      try {
        // The pamphlet facts first, then each language's text, then the photo
        // — each needs the week to exist.
        const week = await Api.createStudy({
          assembly_id: assemblyId ?? undefined,
          week_number: s.weekNumber,
          title: s.en.title,
          scripture_reference: s.en.chapter,
          page_range: s.pages === "\u2014" ? "" : s.pages,
          study_date: s.date,
          theme: s.theme ?? "",
          is_published: s.available,
        });
        const body = (t: StudyText) => ({
          title: t.title,
          aims: t.aims,
          questions: t.questions,
          memory_verse: t.memoryVerse,
          notes: t.notes ?? "",
        });
        await Api.createStudyText({ week: week.id, language: "en", ...body(s.en) });
        // Twi only when it was actually written. The form fills a blank Twi
        // column from the English, and storing that copy would make the
        // English look like the Twi text forever after.
        if (JSON.stringify(body(s.tw)) !== JSON.stringify(body(s.en))) {
          await Api.createStudyText({ week: week.id, language: "tw", ...body(s.tw) });
        }
        if (s.cover) {
          try {
            await Api.uploadStudyCover(week.id, s.cover);
          } catch (e) {
            setPublishError(`Week ${s.weekNumber} was published, but its photo did not upload: ${describeError(e)}`);
            await refreshContent();
            return false;
          }
        }
      } catch (e) {
        setPublishError(describeError(e));
        await refreshContent();
        return false;
      }

      setPublishError(null);
      await refreshContent();
      if (s.available) {
        announce({
          kind: "study",
          title: `Week ${s.weekNumber} Bible study is ready`,
          body: `"${s.en.title}" — ${s.en.chapter}. Tap to read the full guide.`,
        });
      }
      return true;
    },
    [announce, refreshContent, assemblyId],
  );

  const publishDailyVerse = useCallback<ContentState["publishDailyVerse"]>(
    async (input) => {
      try {
        await Api.createDailyVerse({ assembly_id: assemblyId ?? undefined, ...input });
      } catch (e) {
        setPublishError(describeError(e));
        return false;
      }
      setPublishError(null);
      await refreshContent();
      announce({
        kind: "verse",
        title: "Today's verse is here",
        body: `${input.reference} — ${input.english}`,
      });
      return true;
    },
    [announce, refreshContent, assemblyId],
  );

  const removeDailyVerse = useCallback(async () => {
    const current = dailyVerse;
    setDailyVerse(null);
    setNotifications((list) => list.filter((item) => item.kind !== "verse"));
    if (current) await Api.deleteDailyVerse(current.id).catch((e) => setPublishError(describeError(e)));
    // An older verse, if there is one, becomes the current one again.
    await refreshContent();
  }, [dailyVerse, refreshContent]);

  const removeStudy = useCallback(async (id: string) => {
    setStudies((list) => list.filter((s) => s.id !== id));
    await Api.deleteStudy(id).catch((e) => setPublishError(describeError(e)));
    await refreshContent();
  }, [refreshContent]);

  const toggleStudy = useCallback(
    async (id: string) => {
      const target = studies.find((s) => s.id === id);
      if (!target) return;
      const available = !target.available;
      setStudies((list) => list.map((s) => (s.id === id ? { ...s, available } : s)));
      try {
        // On the server, so releasing early reaches every phone, not this one.
        await Api.updateStudy(id, { is_published: available });
      } catch (e) {
        setPublishError(describeError(e));
        await refreshContent();
        return;
      }
      if (available) {
        announce({
          kind: "study",
          title: `Week ${target.weekNumber} Bible study is ready`,
          body: `"${target.en.title}" — ${target.en.chapter}. Tap to read the full guide.`,
        });
      }
    },
    [announce, studies, refreshContent],
  );

  const signAttendance = useCallback<ContentState["signAttendance"]>((input) => {
    setManualAttendance((list) => [
      { ...input, id: nextId("ma"), at: clockLabel() },
      ...list,
    ]);
  }, []);

  const undoAttendance = useCallback((id: string) => {
    setManualAttendance((list) => list.filter((r) => r.id !== id));
  }, []);

  /**
   * A member added from the hub. Only the fields the quick-add form collects are
   * real; the rest start empty so the record is honest about what is known.
   */
  const addMember = useCallback<ContentState["addMember"]>(
    (m) => {
      const fullName = [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ");
      const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

      setDirectory((list) => [
        ...list,
        {
          id: nextId("m"),
          memberId: m.memberId,
          name: [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" "),
          firstName: m.firstName,
          middleName: m.middleName,
          lastName: m.lastName,
          assembly: m.assembly,
          assemblyId: "royal",
          district: "Ayigya District",
          since: String(new Date().getFullYear()),
          photo: "",
          phone: m.phone,
          email: "",
          avatar: initials || "?",
          avatarColor: avatarColors[list.length % avatarColors.length],
          category: "Baptized",
          departments: [],
          attendancePct: 0,
          streak: 0,
          attendanceLogs: [],
          milestones: [],
          elderId: "e1",
          dayBorn: "Sunday",
          dayBornLeader: false,
        },
      ]);

      announce({
        kind: "admin",
        title: `${[m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ")} joined the directory`,
        body: `${m.memberId} · ${m.assembly}. Welcome them on Sunday.`,
      });
    },
    [announce],
  );

  const updateMember = useCallback<ContentState["updateMember"]>((id, patch) => {
    setDirectory((list) => list.map((member) => (member.id === id ? { ...member, ...patch } : member)));
    const changed = Object.keys(patch).join(", ");
    announce({
      kind: "admin",
      title: "Member record corrected",
      body: changed ? `Updated ${changed} on the member record.` : "A member record was corrected.",
    });
  }, [announce]);

  const removeMember = useCallback<ContentState["removeMember"]>((id) => {
    setDirectory((list) => list.filter((member) => member.id !== id));
    announce({ kind: "admin", title: "Member removed", body: "A member record was permanently removed from the directory." });
  }, [announce]);

  const saveGeofence = useCallback((g: Geofence) => setGeofence(g), []);

  /** Pass null when the admin's own position is unknown — the configured fence stands in. */
  const openSessionAt = useCallback((origin: Geofence | null) => setSessionOrigin(origin), []);
  const closeSession = useCallback(() => setSessionOrigin(null), []);

  const logMilestone = useCallback<ContentState["logMilestone"]>((m) => {
    setMilestoneLog((list) => [{ ...m, id: nextId("ms"), at: clockLabel() }, ...list]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    void Api.markNotificationRead(id).catch(() => {});
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((list) => {
      // Only the ones actually unread need a row written.
      for (const n of list) if (n.unread) void Api.markNotificationRead(n.id).catch(() => {});
      return list.map((n) => ({ ...n, unread: false }));
    });
  }, []);

  /**
   * Empties this member's list.
   *
   * Saved per member on the server, so the list stays empty after a relaunch;
   * the announcement still exists for everyone else.
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications((list) => {
      for (const n of list) void Api.markNotificationRead(n.id, true).catch(() => {});
      return [];
    });
  }, []);

  // The four ministries, fixed. Published covers used to be pushed in front of
  // them, so every service or event an admin added took over the slider; they
  // now appear only on their own tile and card.
  const slides = seedSlides;

  const value = useMemo<ContentState>(
    () => ({
      schedule,
      events,
      studies,
      manualAttendance,
      notifications,
      dailyVerse,
      publishDailyVerse,
      removeDailyVerse,
      slides,
      language,
      setLanguage,
      directory,
      addMember,
      updateMember,
      removeMember,
      geofence,
      saveGeofence,
      sessionOrigin,
      openSessionAt,
      closeSession,
      milestoneLog,
      logMilestone,
      addService,
      removeService,
      addEvent,
      removeEvent,
      addStudy,
      removeStudy,
      toggleStudy,
      signAttendance,
      undoAttendance,
      markNotificationRead,
      markAllNotificationsRead,
      clearAllNotifications,
      publishError,
      clearPublishError,
      refreshContent,
    }),
    [
      schedule,
      events,
      studies,
      manualAttendance,
      notifications,
      dailyVerse,
      publishDailyVerse,
      removeDailyVerse,
      slides,
      language,
      setLanguage,
      directory,
      addMember,
      updateMember,
      removeMember,
      geofence,
      saveGeofence,
      sessionOrigin,
      openSessionAt,
      closeSession,
      milestoneLog,
      logMilestone,
      addService,
      removeService,
      addEvent,
      removeEvent,
      addStudy,
      removeStudy,
      toggleStudy,
      signAttendance,
      undoAttendance,
      markNotificationRead,
      markAllNotificationsRead,
      clearAllNotifications,
      publishError,
      clearPublishError,
      refreshContent,
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>");
  return ctx;
}
