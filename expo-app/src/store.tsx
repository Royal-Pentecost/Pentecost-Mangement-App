import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

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
  addMember: (m: { name: string; phone: string; assembly: string; memberId: string }) => void;

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
}

const ContentContext = createContext<ContentState | null>(null);

/** Ids only have to be unique within a session — the backend will own them later. */
let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

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

  const addService = useCallback(
    (s: Omit<ServiceSlot, "id">) => {
      setSchedule((list) => [...list, { ...s, id: nextId("s") }]);
      announce({
        kind: "event",
        title: `${s.name} added to the schedule`,
        body: `${s.day} at ${s.time}${s.venue ? ` — ${s.venue}` : ""}.`,
      });
    },
    [announce],
  );

  const removeService = useCallback((id: string) => {
    setSchedule((list) => list.filter((s) => s.id !== id));
  }, []);

  const addEvent = useCallback(
    (e: Omit<UpcomingEvent, "id" | "tint">) => {
      setEvents((list) => [
        ...list,
        { ...e, id: nextId("ev"), tint: EVENT_TINTS[list.length % EVENT_TINTS.length] },
      ]);
      announce({
        kind: "event",
        title: e.name,
        body: `${e.tag} event on ${e.date}. Tap for details.`,
      });
    },
    [announce],
  );

  const removeEvent = useCallback((id: string) => {
    setEvents((list) => list.filter((e) => e.id !== id));
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
      const initials = m.name
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
          name: m.name,
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
        title: `${m.name} joined the directory`,
        body: `${m.memberId} · ${m.assembly}. Welcome them on Sunday.`,
      });
    },
    [announce],
  );

  const saveGeofence = useCallback((g: Geofence) => setGeofence(g), []);

  /** Pass null when the admin's own position is unknown — the configured fence stands in. */
  const openSessionAt = useCallback((origin: Geofence | null) => setSessionOrigin(origin), []);
  const closeSession = useCallback(() => setSessionOrigin(null), []);

  const logMilestone = useCallback<ContentState["logMilestone"]>((m) => {
    setMilestoneLog((list) => [{ ...m, id: nextId("ms"), at: clockLabel() }, ...list]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }, []);

  /** Empties the member's list. Anything an admin publishes next lands on the empty list. */
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
    ],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>");
  return ctx;
}
