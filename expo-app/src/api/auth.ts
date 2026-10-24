import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { request, setAuthToken } from "./client";
import { ApiMember, RequestOtpBody, RequestOtpResponse, VerifyOtpBody, VerifyOtpResponse } from "./types";

/**
 * Signing in.
 *
 * The phone number is the whole of the identity — the server sends a one-time
 * code to it and hands back a token plus the member's profile. Privileges come
 * with that profile (`role`), so the app no longer decides who is an admin from
 * a table of phone numbers; the server does.
 *
 * The token is kept in the device keystore, not in plain storage: it is a
 * standing credential for someone's church record.
 */

const TOKEN_KEY = "pentecost.auth.token";
/** The signed-in profile, so a restored session needs no network. */
const MEMBER_KEY = "pentecost.auth.member";
/** When the member last proved their phone number. */
const ISSUED_KEY = "pentecost.auth.issuedAt";

/** SecureStore has no web implementation, so the preview falls back to localStorage. */
const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* A refused keystore must not block signing in. */
    }
  },
  async clear(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      /* Nothing to do — the in-memory token is cleared regardless. */
    }
  },
};

/**
 * Sends a one-time code to this number.
 *
 * Returns the server's reply because a development server running the console
 * backend puts the code in it (`debug_code`) rather than sending an SMS. A real
 * deployment never includes that field, so passing it along is safe — but what
 * the app *does* with it must still be gated on `__DEV__`.
 */
export function requestOtp(phoneNumber: string): Promise<RequestOtpResponse> {
  const payload: RequestOtpBody = { phone_number: phoneNumber };
  return request<RequestOtpResponse>("/api/v1/auth/request-otp/", {
    method: "POST",
    body: payload,
    anonymous: true,
  });
}

export interface Session {
  token: string;
  member: ApiMember | null;
}

/** Exchanges the code for a token, and keeps that token for next time. */
export async function verifyOtp(phoneNumber: string, code: string): Promise<Session> {
  const payload: VerifyOtpBody = { phone_number: phoneNumber, code };
  const body = await request<VerifyOtpResponse>("/api/v1/auth/verify-otp/", {
    method: "POST",
    body: payload,
    anonymous: true,
  });

  if (!body?.token) {
    throw new Error("Signed in, but the server returned no auth token.");
  }

  setAuthToken(body.token);
  await storage.set(TOKEN_KEY, body.token);
  await storage.set(ISSUED_KEY, String(Date.now()));
  if (body.member) await storage.set(MEMBER_KEY, JSON.stringify(body.member));

  return { token: body.token, member: body.member ?? null };
}

/**
 * Restores a previous sign-in, if there is one.
 *
 * Returns the token so the caller can decide whether to show the login screen;
 * the token's validity is only proven by the first real request, which will
 * throw an unauthorised `ApiError` if the server has since revoked it.
 */
/**
 * How long a sign-in lasts before the member has to prove the number again.
 *
 * A congregation marks attendance once a week; asking for an SMS code every
 * visit would be four codes a month per member, each one costing the church.
 * Four weeks covers that comfortably and still bounds how long a lost phone
 * keeps access.
 */
export const SESSION_DAYS = 28;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export interface RestoredSession {
  token: string;
  member: ApiMember | null;
  /** When the member last proved their number. */
  signedInAt: number;
  /** Milliseconds until they will have to do it again. */
  expiresIn: number;
}

/**
 * Brings back a previous sign-in, if it is still within its 28 days.
 *
 * The profile is stored alongside the token rather than re-fetched, so the app
 * opens straight onto the dashboard instead of showing a login screen while a
 * request is in flight — and still works with no signal.
 *
 * An expired session is cleared here rather than left to fail on the first
 * request: a member should be asked to sign in, not shown an error.
 */
export async function restoreSession(): Promise<RestoredSession | null> {
  const token = await storage.get(TOKEN_KEY);
  if (!token) return null;

  const stamp = Number(await storage.get(ISSUED_KEY));
  const signedInAt = Number.isFinite(stamp) && stamp > 0 ? stamp : 0;
  const age = Date.now() - signedInAt;

  if (!signedInAt || age >= SESSION_MS) {
    await signOut();
    return null;
  }

  let member: ApiMember | null = null;
  try {
    const raw = await storage.get(MEMBER_KEY);
    member = raw ? (JSON.parse(raw) as ApiMember) : null;
  } catch {
    // A corrupt profile is not worth refusing the session over; the directory
    // re-reads it on the next fetch anyway.
  }

  setAuthToken(token);
  return { token, member, signedInAt, expiresIn: SESSION_MS - age };
}

/** Prefix for the per-member "has signed in on this device before" mark. */
const SEEN_KEY = "pentecost.seen";

/**
 * Records that this member has signed in here, and says whether they had
 * before. Keyed by member id, so a second person signing in on the same phone
 * still gets their own first-time welcome.
 */
/**
 * Keeps the stored copy of the member in step with the server.
 *
 * The session restores this copy on launch, so without it a new photo, a
 * corrected name or a changed role would be undone the next time the app
 * opened — the refreshed record lived only in memory.
 */
export async function rememberMember(member: ApiMember): Promise<void> {
  await storage.set(MEMBER_KEY, JSON.stringify(member));
}

export async function noteSignIn(memberId: string): Promise<{ firstTime: boolean }> {
  const key = `${SEEN_KEY}.${memberId}`;
  const seen = await storage.get(key);
  await storage.set(key, new Date().toISOString());
  return { firstTime: seen === null };
}

/** Forgets the token on this device. */
export async function signOut(): Promise<void> {
  setAuthToken(null);
  await storage.clear(TOKEN_KEY);
  await storage.clear(MEMBER_KEY);
  await storage.clear(ISSUED_KEY);
}

/**
 * Re-reads one member's record, for refreshing a stale profile.
 *
 * There is no `/members/me/` on this API, so the caller passes the id that came
 * back with the token. If the backend grows a "me" route later, this is the one
 * place that changes.
 */
export function fetchMember(id: string): Promise<ApiMember> {
  return request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`);
}
