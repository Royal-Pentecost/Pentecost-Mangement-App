import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { fetchRecordsOn, fetchSessionsOn, serverToday } from "./api/resources";
import { ApiAttendanceRecord, ApiAttendanceSession } from "./api/types";
import { useSession } from "./session";

/**
 * Who has signed attendance today, as the server records it.
 *
 * The home screen's "Today at a glance" and the admin's session panel both
 * read from here, so the two cannot disagree. They used to be literals — 47,
 * 12 and 5 on one, 89 and 7 on the other — which looked like a church full of
 * people on a day nobody had signed in.
 *
 * It refreshes on a short interval because attendance is taken live: during a
 * service the count should climb on the admin's screen as members sign, not
 * wait for them to leave and come back.
 */

/** Long enough not to load the server, short enough to feel live in a service. */
const REFRESH_MS = 30_000;

interface TodayValue {
  /** Sessions opened today — empty means no service has been held yet. */
  sessions: ApiAttendanceSession[];
  records: ApiAttendanceRecord[];
  /** Members on the roll who signed in at least one of today's sessions. */
  presentIds: Set<string>;
  /** Marks flagged as a first visit. */
  firstTimers: number;
  loading: boolean;
  /** True once the first load has finished, so "0" is never shown as a guess. */
  loaded: boolean;
  refresh: () => Promise<void>;
  /** Distinct members and first-timers for one session — the admin's panel. */
  countsFor: (sessionId: string | null) => { present: number; firstTimers: number };
}

const TodayCtx = createContext<TodayValue | null>(null);

export function TodayAttendanceProvider({ children }: { children: React.ReactNode }) {
  const { status, role } = useSession();
  // Only admins see these figures, so only their phones ask for them. A
  // congregation of members polling every 30 seconds would be several hundred
  // requests a minute for numbers nobody on those phones looks at.
  const enabled = status === "signedIn" && role !== "member";

  const [sessions, setSessions] = useState<ApiAttendanceSession[]>([]);
  const [records, setRecords] = useState<ApiAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const day = serverToday();
      const [s, r] = await Promise.all([fetchSessionsOn(day), fetchRecordsOn(day)]);
      setSessions(s);
      setRecords(r);
      setLoaded(true);
    } catch {
      // Keep the last figures. A dropped request mid-service is not evidence
      // that everyone went home.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      setRecords([]);
      setLoaded(false);
      return;
    }

    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    // Back from the background: the interval did not run while the app was
    // asleep, so the figures on screen may be from before the service began.
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, refresh]);

  const value = useMemo<TodayValue>(() => {
    const presentIds = new Set(
      records.map((r) => r.member?.id).filter((id): id is string => Boolean(id)),
    );

    const countsFor = (sessionId: string | null) => {
      if (!sessionId) return { present: 0, firstTimers: 0 };
      const mine = records.filter((r) => r.session === sessionId);
      return {
        present: new Set(mine.map((r) => r.member?.id).filter(Boolean)).size,
        firstTimers: mine.filter((r) => r.is_first_timer).length,
      };
    };

    return {
      sessions,
      records,
      presentIds,
      firstTimers: records.filter((r) => r.is_first_timer).length,
      loading,
      loaded,
      refresh,
      countsFor,
    };
  }, [sessions, records, loading, loaded, refresh]);

  return <TodayCtx.Provider value={value}>{children}</TodayCtx.Provider>;
}

export function useTodayAttendance(): TodayValue {
  const v = useContext(TodayCtx);
  if (!v) throw new Error("useTodayAttendance must be used inside a TodayAttendanceProvider");
  return v;
}
