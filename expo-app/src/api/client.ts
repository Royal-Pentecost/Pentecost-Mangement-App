import Constants from "expo-constants";
import { Platform } from "react-native";

import { Paginated } from "./types";

/**
 * The one way the app talks to the server.
 *
 * Every screen goes through here rather than calling `fetch` itself, so the base
 * URL, the auth header, timeouts and error shapes are decided once. The backend
 * is Django REST Framework, which means three things worth knowing:
 *
 * - **Auth is `Authorization: Token <key>`**, and the key comes from verifying an
 *   OTP — there is no static API key to ship inside the app. An embedded key
 *   would be extractable from the APK by anyone anyway.
 * - **Lists are paginated**, always `{ count, next, previous, results }`.
 * - **Errors are field-keyed**: `{"phone_number": ["Enter a valid …"]}` rather
 *   than a single message, so `ApiError.message` flattens them into something a
 *   member can actually read.
 */

/**
 * Where the app talks to.
 *
 * In development the host is taken from whatever machine is serving the bundle,
 * because that is the same machine running Django — and its LAN address changes
 * whenever the laptop rejoins a network. Hardcoding one meant a sleeping machine
 * woke up on a new IP and every request failed against an address that no longer
 * existed, with nothing on screen to say why.
 *
 * Release builds always use the hosted server; there is no dev host to borrow.
 */
const HOSTED_API = "https://attendance-backend-g56m.onrender.com";

/** Port the local Django server listens on. */
const DEV_API_PORT = 8000;

function devApiBase(): string | null {
  // The web preview is served from the same machine as Django, and Expo exposes
  // no packager host there — so the browser's own hostname is the right answer.
  if (Platform.OS === "web") {
    const host = globalThis.location?.hostname;
    return host ? `${globalThis.location.protocol}//${host}:${DEV_API_PORT}` : null;
  }

  // "10.132.120.235:8081" — the packager that served this bundle to the phone.
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost;

  const host = hostUri?.split(":")[0];
  if (!host) return null;
  return `http://${host}:${DEV_API_PORT}`;
}

export const API_BASE = __DEV__ ? devApiBase() ?? HOSTED_API : HOSTED_API;

/** Render's free tier sleeps; the first request after idle pays the wake-up cost. */
const DEFAULT_TIMEOUT = 45_000;

export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string[]>;

  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }

  /** True when the token is missing, expired, or has been revoked. */
  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }

  /** True when nothing reached the server at all — no signal, or it is asleep. */
  get isOffline() {
    return this.status === 0;
  }
}

/** Turns DRF's field-keyed errors into one sentence. */
function describe(status: number, body: unknown): { message: string; fields: Record<string, string[]> } {
  if (typeof body === "string" && body.trim()) return { message: body, fields: {} };

  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;

    // The single-message forms DRF uses for auth and permission failures.
    for (const key of ["detail", "message", "error"]) {
      if (typeof o[key] === "string") return { message: o[key] as string, fields: {} };
    }

    const fields: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(o)) {
      if (Array.isArray(v)) fields[k] = v.map(String);
      else if (typeof v === "string") fields[k] = [v];
    }

    const first = Object.values(fields)[0]?.[0];
    if (first) return { message: first, fields };
  }

  return { message: `Request failed (${status})`, fields: {} };
}

/** Set once sign-in succeeds; cleared on sign-out. */
let authToken: string | null = null;

/**
 * Told when the server rejects our token.
 *
 * A session lasts 28 days on this device, but the server can end it sooner —
 * an admin revoking access, or the token being deleted. Without this the app
 * would keep a dead token for the rest of the window and show errors on every
 * screen instead of asking the member to sign in again.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. Use `form` for file uploads instead. */
  body?: unknown;
  /** Sent as multipart, for endpoints that take a photo or a PDF. */
  form?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send without the auth header — only the OTP endpoints need this. */
  anonymous?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : API_BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/**
 * Performs one request and returns the parsed body.
 *
 * Throws `ApiError` for anything that is not a 2xx, including a network failure
 * (status 0) — so callers have exactly one thing to catch.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, form, query, anonymous = false, timeoutMs = DEFAULT_TIMEOUT } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (!anonymous && authToken) headers.Authorization = `Token ${authToken}`;
  // Let the runtime set the multipart boundary; setting it by hand breaks uploads.
  if (body !== undefined && !form) headers["Content-Type"] = "application/json";

  // Time the request out ourselves — a sleeping server otherwise hangs forever.
  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), timeoutMs);
  const signal = options.signal
    ? // Abort when either the caller or the timeout says so.
      (AbortSignal.any?.([options.signal, timer.signal]) ?? timer.signal)
    : timer.signal;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    });
  } catch (e) {
    const aborted = (e as Error)?.name === "AbortError";
    throw new ApiError(
      0,
      aborted
        ? "The server took too long to answer. Check your connection and try again."
        : "Could not reach the server. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* A proxy or error page served HTML; `describe` falls back to the status. */
  }

  if (!response.ok) {
    const { message, fields } = describe(response.status, parsed);
    const error = new ApiError(response.status, message, fields);

    // Only a rejected token ends the session. A 403 on one endpoint usually
    // means this member may not do that particular thing, which is not a
    // reason to sign them out of everything.
    if (response.status === 401 && !anonymous) onUnauthorized?.();

    throw error;
  }

  return parsed as T;
}

/**
 * Walks every page of a list endpoint.
 *
 * Capped, because an unbounded loop against a paginated endpoint is how one
 * mistyped filter turns into thousands of requests.
 */
export async function listAll<T>(
  path: string,
  options: RequestOptions = {},
  maxPages = 20,
): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = buildUrl(path, options.query);

  for (let page = 0; next && page < maxPages; page++) {
    const chunk: Paginated<T> = await request<Paginated<T>>(next, { ...options, query: undefined });
    out.push(...(chunk.results ?? []));
    next = chunk.next;
  }

  return out;
}

/** One page, when the caller wants the count or is rendering a pager. */
export function listPage<T>(path: string, options: RequestOptions = {}): Promise<Paginated<T>> {
  return request<Paginated<T>>(path, options);
}
