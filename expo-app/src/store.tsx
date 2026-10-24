import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import * as Api from "./api/resources";
import { toEvent, toNotification, toServiceSlot } from "./api/adapters";
import { ApiWeekday } from "./api/types";
import { describeError } from "./session";
import { useSession } from "./session";

import {
  AppNotification,
  BibleStudy,
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
  bibleStudies as seedStudies,
  defaultGeofence,
  members as seedMembers,
  studyReleased,
  homeSlides as seedSlides,
  notifications as seedNotifications,
  upcomingEvents as seedEvents,
  weeklySchedule as seedSchedule,
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
  publishDailyVerse: (input: { english: string; twi: string; reference: string }) => void;
  removeDailyVerse: () => void;
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

  addService: (s: Omit<ServiceSlot, "id">) => void;
  removeService: (id: string) => void;

  addEvent: (e: Omit<UpcomingEvent, "id" | "tint">) => void;
  removeEvent: (id: string) => void;

  addStudy: (s: Omit<BibleStudy, "id">) => void;
  removeStudy: (id: string) => void;
  toggleStudy: (id: string) => void;

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
function isoDate(label: string): string {
  const parsed = new Date(`${label} ${new Date().getFullYear()}`);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 10)
    : parsed.toISOString().slice(0, 10);
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

  // Seeds show something on first paint; the server's copy replaces them as
  // soon as the member is signed in.
  const [schedule, setSchedule] = useState<ServiceSlot[]>(seedSchedule);
  const [events, setEvents] = useState<UpcomingEvent[]>(seedEvents);
  const [studies, setStudies] = useState<BibleStudy[]>(seedStudies);
  const [manualAttendance, setManualAttendance] = useState<ManualAttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [language, setLanguage] = useState<Lang>("en");
  const [directory, setDirectory] = useState<Member[]>(seedMembers);
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
    const [apiSchedules, apiEvents, apiNotifications, apiReads, apiAssembly] = await Promise.all([
      Api.fetchSchedules().catch(() => null),
      Api.fetchEvents().catch(() => null),
      Api.fetchNotifications().catch(() => null),
      Api.fetchNotificationReads().catch(() => []),
      assemblyId ? Api.fetchAssembly(assemblyId).catch(() => null) : Promise.resolve(null),
    ]);

    if (apiSchedules) setSchedule(apiSchedules.map(toServiceSlot));
    if (apiEvents) setEvents(apiEvents.map(toEvent));

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
      setNotifications(apiNotifications.map((n) => toNotification(n, readIds)));
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
    (s: Omit<ServiceSlot, "id">) => {
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
        return;
      }

      void Api.createSchedule({
        assembly_id: assemblyId ?? undefined,
        name: s.name,
        location: s.venue,
        time,
        start_weekday: start,
        end_weekday: end ?? start,
      })
        .then(() => {
          setPublishError(null);
          return refreshContent();
        })
        .catch((e) => setPublishError(describeError(e)));
      announce({
        kind: "event",
        title: `${s.name} added to the schedule`,
        body: `${s.day} at ${s.time}${s.venue ? ` — ${s.venue}` : ""}.`,
      });
    },
    [announce, refreshContent],
  );

  const removeService = useCallback(async (id: string) => {
    setSchedule((list) => list.filter((s) => s.id !== id));
    await Api.deleteSchedule(id).catch(() => {});
  }, []);

  const addEvent = useCallback(
    (e: Omit<UpcomingEvent, "id" | "tint">) => {
      setEvents((list) => [
        ...list,
        { ...e, id: nextId("ev"), tint: EVENT_TINTS[list.length % EVENT_TINTS.length] },
      ]);

      void Api.createEvent({
        assembly_id: assemblyId ?? undefined,
        title: e.name,
        description: e.tag,
        event_date: isoDate(e.date),
      })
        .then(() => refreshContent())
        .catch((err) => setPublishError(describeError(err)));
      announce({
        kind: "event",
        title: e.name,
        body: `${e.tag} event on ${e.date}. Tap for details.`,
      });
    },
    [announce, refreshContent],
  );

  const removeEvent = useCallback(async (id: string) => {
    setEvents((list) => list.filter((e) => e.id !== id));
    await Api.deleteEvent(id).catch(() => {});
  }, []);

  const addStudy = useCallback(
    (s: Omit<BibleStudy, "id">) => {
      setStudies((list) => [...list, { ...s, id: nextId("b") }]);
      if (s.available) {
        announce({
          kind: "study",
          title: `Week ${s.weekNumber} Bible study is ready`,
          body: `"${s.en.title}" — ${s.en.chapter}. Tap to read the full guide.`,
        });
      }
    },
    [announce],
  );

  const publishDailyVerse = useCallback<ContentState["publishDailyVerse"]>((input) => {
    const publishedOn = new Date().toISOString().slice(0, 10);
    const verse = { ...input, id: nextId("verse"), publishedOn };
    setDailyVerse(verse);
    announce({
      kind: "verse",
      title: "Today's verse is here",
      body: `${verse.reference} — ${verse.english}`,
    });
  }, [announce]);

  const removeDailyVerse = useCallback(() => {
    setDailyVerse(null);
    setNotifications((list) => list.filter((item) => item.kind !== "verse"));
  }, []);

  const removeStudy = useCallback((id: string) => {
    setStudies((list) => list.filter((s) => s.id !== id));
  }, []);

  const toggleStudy = useCallback(
    (id: string) => {
      setStudies((list) => {
        const target = list.find((s) => s.id === id);
        if (target && !target.available) {
          announce({
            kind: "study",
            title: `Week ${target.weekNumber} Bible study is ready`,
            body: `"${target.en.title}" — ${target.en.chapter}. Tap to read the full guide.`,
          });
        }
        return list.map((s) => (s.id === id ? { ...s, available: !s.available } : s));
      });
    },
    [announce],
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
   * Local only, deliberately: the announcement still exists for everyone else,
   * and a member clearing their own view must not delete it for the assembly.
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const slides = useMemo<Slide[]>(() => {
    const published: Slide[] = [
      ...events
        .filter((e) => e.cover)
        .map((e) => ({ id: `sl-${e.id}`, source: { uri: e.cover! }, label: e.name, caption: `${e.tag} · ${e.date}` })),
      ...schedule
        .filter((s) => s.cover)
        .map((s) => ({ id: `sl-${s.id}`, source: { uri: s.cover! }, label: s.name, caption: `${s.day} · ${s.time}` })),
      ...studies
        .filter((s) => s.cover && studyReleased(s))
        .map((s) => ({ id: `sl-${s.id}`, source: { uri: s.cover! }, label: s.en.title, caption: `Week ${s.weekNumber} · ${s.en.chapter}` })),
    ];
    return [...published, ...seedSlides];
  }, [events, schedule, studies]);

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
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>");
  return ctx;
}
