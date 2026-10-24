import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";

import { useDirectory } from "./directory";
import { useSession } from "./session";
import { useContent } from "./store";
import { useTheme } from "./theme";
import { useTodayAttendance } from "./today";

/**
 * Pull-to-refresh, the same on every page.
 *
 * One gesture reloads everything the app shows rather than whatever the
 * current page happens to read — a member who pulls on the dashboard expects
 * the attendance card, the schedule and the leaders to all be current, and
 * they come from four different places. Each page attaches the control and
 * does nothing else.
 */

type Refresher = () => Promise<unknown> | void;

/**
 * Work that lives outside the providers — the open-session check in `App` —
 * joins the refresh by registering here.
 */
const extra = new Set<Refresher>();

export function useOnPullToRefresh(fn: Refresher) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    const run: Refresher = () => latest.current();
    extra.add(run);
    return () => {
      extra.delete(run);
    };
  }, []);
}

/** Reloads everything. Never throws: one source being down must not stop the rest. */
export function useRefreshAll(): () => Promise<void> {
  const { refresh: refreshDirectory } = useDirectory();
  const { refreshContent } = useContent();
  const { refresh: refreshToday } = useTodayAttendance();
  const { refreshMember } = useSession();

  return useCallback(async () => {
    await Promise.allSettled([
      refreshMember(),
      refreshDirectory(),
      refreshContent(),
      refreshToday(),
      ...[...extra].map((fn) => Promise.resolve().then(fn)),
    ]);
  }, [refreshMember, refreshDirectory, refreshContent, refreshToday]);
}

/**
 * The control itself: `<ScrollView refreshControl={usePullToRefresh()}>`.
 *
 * The spinner stays up until every source has answered, and at least briefly —
 * a refresh that returns in 40ms flickers and reads as if nothing happened.
 */
export function usePullToRefresh(): React.ReactElement<RefreshControlProps> {
  const { c, isDark } = useTheme();
  const refreshAll = useRefreshAll();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshAll(), new Promise((r) => setTimeout(r, 600))]);
    setRefreshing(false);
  }, [refreshAll]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // iOS spinner and Android disc, in the app's own colours.
      tintColor={c.primary}
      colors={[c.primary]}
      progressBackgroundColor={isDark ? c.card : "#FFFFFF"}
    />
  );
}
