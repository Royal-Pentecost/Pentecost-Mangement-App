import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ApiError } from "./api/client";
import {
  colourFor,
  initialsOf,
  markGroupLeaders,
  toElder,
  toMember,
  withMilestones,
  withStats,
} from "./api/adapters";
import {
  fetchDayBornGroups,
  fetchElders,
  fetchMembers,
  fetchMilestones,
  fetchStats,
} from "./api/resources";
import { ApiElder } from "./api/types";
import { Elder, MILESTONE_LABELS, Member } from "./data";
import { useSession } from "./session";

/**
 * The congregation, as the server knows it.
 *
 * One fetch on sign-in rather than a request per screen: the roll is a few
 * hundred rows that change rarely, and a member browsing the directory should
 * not wait on the network for every tap. `refresh()` re-reads it after an admin
 * changes something.
 *
 * Everything the screens need is assembled here, because the server spreads it
 * across four endpoints — members, their attendance figures, their milestones,
 * and the groups that say who leads whom. Assembling it in each screen would
 * mean four round trips per screen and four chances to disagree.
 */

interface DirectoryValue {
  members: Member[];
  elders: Elder[];
  loading: boolean;
  /** Set when the last load failed, phrased for a person. */
  error: string | null;
  refresh: () => Promise<void>;
}

const DirectoryCtx = createContext<DirectoryValue | null>(null);

/** Presiding elder first, then elders, deacons and deaconesses. */
const OFFICE_RANK = ["presiding elder", "elder", "deacon", "deaconess"];

function officeRank(title: string): number {
  const t = title.trim().toLowerCase();
  const i = OFFICE_RANK.indexOf(t);
  return i >= 0 ? i : OFFICE_RANK.length;
}

/**
 * Every office holder, as the Church Leaders directory shows them.
 *
 * The server's leader record names the member and little else — no photograph,
 * no phone, no assembly — so those are read off the member's own record, which
 * is the copy an admin keeps up to date. A leader whose contact line is blank
 * is still reachable on the number they sign in with.
 */
function rankLeaders(apiElders: ApiElder[], members: Member[]): Elder[] {
  const byId = new Map(members.map((m) => [m.id, m]));

  return apiElders
    .map((e) => {
      const leader = toElder(e);
      const person = e.member?.id ? byId.get(e.member.id) : undefined;
      if (!person) return leader;
      return {
        ...leader,
        photo: leader.photo || person.photo,
        phone: leader.phone || person.phone,
        assembly: leader.assembly || person.assembly,
        assemblyId: leader.assemblyId || person.assemblyId,
        avatarColor: person.avatarColor,
      };
    })
    .sort((a, b) => officeRank(a.title) - officeRank(b.title) || a.name.localeCompare(b.name));
}

export function DirectoryProvider({ children }: { children: React.ReactNode }) {
  const { status, member: me } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In parallel: four independent reads, so the slowest one sets the wait.
      const [apiMembers, apiElders, groups, stats, milestones] = await Promise.all([
        fetchMembers(),
        fetchElders(),
        fetchDayBornGroups(),
        fetchStats().catch(() => []),
        fetchMilestones().catch(() => []),
      ]);

      const statsByMember = new Map(stats.map((s) => [s.member?.id ?? "", s]));
      const milestonesByMember = new Map<string, typeof milestones>();
      for (const row of milestones) {
        const key = row.member?.id ?? "";
        const list = milestonesByMember.get(key) ?? [];
        list.push(row);
        milestonesByMember.set(key, list);
      }

      const leaderIds = new Set(
        groups.map((g) => g.leader?.id).filter((id): id is string => Boolean(id)),
      );

      // An office is held by a member, but the server keeps it on the Elder
      // record — so the title is matched back by member id. This is what lets
      // the greeting say "Elder Akomeah" rather than "Richard".
      const titleByMember = new Map<string, string>();
      for (const e of apiElders) {
        if (e.member?.id && e.title) titleByMember.set(e.member.id, e.title);
      }

      const mapped = markGroupLeaders(
        apiMembers.map((m) => {
          const base = toMember(m);
          const withFigures = withStats(base, statsByMember.get(m.id));
          const titled = { ...withFigures, churchTitle: titleByMember.get(m.id) };
          return withMilestones(titled, milestonesByMember.get(m.id) ?? [], MILESTONE_LABELS);
        }),
        leaderIds,
      );

      setMembers(mapped);
      setElders(rankLeaders(apiElders, mapped));
    } catch (e) {
      // A directory that silently shows nothing looks like an empty church.
      setError(
        e instanceof ApiError
          ? e.isOffline
            ? "Could not reach the server. The directory will fill in once you are back online."
            : e.message
          : "Could not load the directory.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once signed in, and drop it on sign-out so the next person does not
  // see the previous one's congregation.
  useEffect(() => {
    if (status === "signedIn") {
      void load();
    } else if (status === "signedOut") {
      setMembers([]);
      setElders([]);
      setError(null);
    }
  }, [status, load]);

  const value = useMemo<DirectoryValue>(() => {
    // The signed-in member may not be in the fetched page set yet — and their
    // own record should always be available to their own dashboard.
    const haveMe = me && members.some((m) => m.id === me.id);
    const all =
      me && !haveMe
        ? [
            ...members,
            {
              ...toMember(me),
              avatar: initialsOf(me.full_name),
              avatarColor: colourFor(me.member_id || me.id),
            },
          ]
        : members;

    return { members: all, elders, loading, error, refresh: load };
  }, [members, elders, loading, error, load, me]);

  return <DirectoryCtx.Provider value={value}>{children}</DirectoryCtx.Provider>;
}

export function useDirectory(): DirectoryValue {
  const v = useContext(DirectoryCtx);
  if (!v) throw new Error("useDirectory must be used inside a DirectoryProvider");
  return v;
}

/** The signed-in member's own record from the directory, if it is loaded. */
export function useMe(): Member | null {
  const { member } = useSession();
  const { members } = useDirectory();
  return useMemo(
    () => (member ? members.find((m) => m.id === member.id) ?? null : null),
    [member, members],
  );
}
