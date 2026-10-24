import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { SESSION_DAYS, noteSignIn, rememberMember, requestOtp, restoreSession, signOut as clearToken, verifyOtp } from "./api/auth";
import { ApiError, setUnauthorizedHandler } from "./api/client";
import { fetchMember, uploadProfilePhoto } from "./api/resources";
import { ApiMember, ApiRole } from "./api/types";
import { DayBorn, LoginRole, SessionUser } from "./data";

/**
 * Who is signed in.
 *
 * The server decides this now. Privileges arrive on the member's own record
 * rather than being looked up from a table of phone numbers in the app, so a
 * role change takes effect at the next sign-in without shipping a new build.
 *
 * The token is restored on launch, so a member who has signed in once lands
 * straight on their dashboard. Its validity is only proven by the first real
 * request — if the server has revoked it, that request throws an unauthorised
 * `ApiError` and `signOut()` puts them back at the login screen.
 */

export type SessionStatus = "restoring" | "signedOut" | "signedIn";

interface SessionValue {
  status: SessionStatus;
  member: ApiMember | null;
  /** The app's own role vocabulary, mapped from the server's. */
  role: LoginRole;
  /** For the welcome screen and the settings header. */
  user: SessionUser | null;
  dayBorn: DayBorn | null;
  /**
   * True the first time this member signs in on this device.
   *
   * The server exposes no "has signed in before" field on a member, so this is
   * remembered locally and keyed by member id — a second person signing in on
   * the same phone still gets their own welcome.
   */
  firstTime: boolean;
  /** When the member will next have to prove their number. Null when signed out. */
  expiresAt: number | null;
  /** Resolves with the development code, when the server returned one. */
  sendCode: (phone: string) => Promise<string | null>;
  /** Uploads a new profile photograph and updates the session in place. */
  setPhoto: (uri: string) => Promise<void>;
  /**
   * Re-reads the signed-in member from the server — a corrected name, a new
   * day-born group, or a role an admin granted, without signing out.
   */
  refreshMember: () => Promise<void>;
  /** Resolves with the role the server granted, so callers need not read state. */
  signIn: (phone: string, code: string) => Promise<LoginRole>;
  signOut: () => Promise<void>;
}

const SessionCtx = createContext<SessionValue | null>(null);

/** The server's role names are snake_case; the app's are camelCase. */
const ROLES: Record<ApiRole, LoginRole> = {
  member: "member",
  assembly_admin: "admin",
  super_admin: "superAdmin",
};

/**
 * Ghanaian local form, `0XXXXXXXXX`.
 *
 * The server stores whatever it was given and compares it **exactly** at login —
 * there is no normalisation on that side. So the one job here is to make sure a
 * number typed as `+233 24 XXX XXXX`, `23324XXXXXXX` or `024 XXX XXXX` all reach
 * it as the single form the roll was loaded with. Get this wrong and a real
 * member is told their account does not exist.
 */
export function toLocalPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+233")) return "0" + digits.slice(4);
  if (digits.startsWith("233") && digits.length === 12) return "0" + digits.slice(3);
  return digits;
}

/** Initials for the avatar when a member has no photograph. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "")).toUpperCase();
}

const AVATAR_COLOURS = ["#1E3A8A", "#15803D", "#B45309", "#6D28D9", "#0E7490", "#BE185D"];

/** Stable per person, so an avatar does not change colour between screens. */
function avatarColour(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[n % AVATAR_COLOURS.length];
}

/** Monday = 0 … Sunday = 6 on the server; the app names the day. */
const WEEKDAY_NAMES: DayBorn[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("restoring");
  const [member, setMember] = useState<ApiMember | null>(null);
  const [firstTime, setFirstTime] = useState(false);
  /** When this sign-in stops being accepted, in epoch milliseconds. */
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  /**
   * A sign-in lasts 28 days, so the app usually opens straight onto the
   * dashboard. The profile comes back with the token, so this needs no network
   * and works with no signal — the server is only consulted when the member
   * does something that requires it.
   */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await restoreSession();
      if (cancelled) return;

      if (restored) {
        setMember(restored.member);
        setExpiresAt(restored.signedInAt + restored.expiresIn);
        // A restored session is never somebody's first — the welcome belongs to
        // the sign-in that created it.
        setFirstTime(false);
        setStatus("signedIn");
      } else {
        setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once: this is the launch-time restore, not a reaction to state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A token the server no longer accepts ends the session here, rather than
  // leaving every screen to fail on its own.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearToken();
      setMember(null);
      setExpiresAt(null);
      setStatus("signedOut");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const sendCode = useCallback(async (phone: string) => {
    const reply = await requestOtp(toLocalPhone(phone));
    // Only ever surfaced in a development build; production sends a real SMS
    // and the field is absent.
    return __DEV__ ? reply?.debug_code ?? null : null;
  }, []);

  const signIn = useCallback(async (phone: string, code: string): Promise<LoginRole> => {
    const session = await verifyOtp(toLocalPhone(phone), code);

    // Greet a newcomer differently from someone coming back. Checked before the
    // mark is written, or everyone would always look like a returning member.
    if (session.member) {
      setFirstTime((await noteSignIn(session.member.id)).firstTime);
    }

    setMember(session.member);
    setExpiresAt(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    setStatus("signedIn");
    return session.member ? ROLES[session.member.role] ?? "member" : "member";
  }, []);

  const setPhoto = useCallback(
    async (uri: string) => {
      if (!member) throw new Error("Not signed in.");
      // The server's copy is the one every other device reads, so the upload
      // decides the outcome — the local preview only covers the wait.
      const updated = await uploadProfilePhoto(member.id, uri);
      setMember(updated);
      // Stored too, or the old photo came back on the next launch.
      await rememberMember(updated);
    },
    [member],
  );

  const refreshMember = useCallback(async () => {
    if (!member) return;
    try {
      const fresh = await fetchMember(member.id);
      setMember(fresh);
      await rememberMember(fresh);
    } catch {
      // Offline, or the server is asleep: the copy already shown stands.
    }
  }, [member]);

  const signOut = useCallback(async () => {
    await clearToken();
    setMember(null);
    setExpiresAt(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo<SessionValue>(() => {
    const role: LoginRole = member ? ROLES[member.role] ?? "member" : "member";

    const user: SessionUser | null = member
      ? {
          name: member.full_name,
          photo: member.profile_photo ?? "",
          avatar: initials(member.full_name),
          avatarColor: avatarColour(member.member_id || member.full_name),
          subtitle: [member.assembly?.name, member.member_id].filter(Boolean).join(" · "),
        }
      : null;

    const weekday = member?.day_born_group?.weekday;
    const dayBorn = typeof weekday === "number" ? WEEKDAY_NAMES[weekday] ?? null : null;

    return { status, member, role, user, dayBorn, firstTime, expiresAt, sendCode, setPhoto, refreshMember, signIn, signOut };
  }, [status, member, firstTime, expiresAt, sendCode, setPhoto, refreshMember, signIn, signOut]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionCtx);
  if (!v) throw new Error("useSession must be used inside a SessionProvider");
  return v;
}

/** Turns an API failure into something worth showing a member. */
export function describeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}
