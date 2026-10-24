import { listAll, request } from "./client";
import {
  ApiActivityLog,
  ApiAssembly,
  ApiAttendanceRecord,
  ApiAttendanceSession,
  ApiBibleStudyWeek,
  ApiDayBornGroup,
  ApiElder,
  ApiEvent,
  ApiMember,
  ApiMemberAttendanceStat,
  ApiNotification,
  ApiNotificationRead,
  ApiSpiritualMilestone,
  ApiWeeklySchedule,
} from "./types";

/**
 * Every endpoint the app uses, in one place.
 *
 * Reads go through `listAll`, which walks the paginated pages — the roll is
 * already 328 members and the server returns them in pages, so a single-page
 * fetch would quietly show a fraction of the congregation.
 */

// ─── People ──────────────────────────────────────────────────────────────────

export const fetchMembers = () => listAll<ApiMember>("/api/v1/accounts/members/");
export const fetchMember = (id: string) =>
  request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`);

export const fetchElders = () => listAll<ApiElder>("/api/v1/accounts/elders/");
export const fetchDayBornGroups = () => listAll<ApiDayBornGroup>("/api/v1/accounts/day-born-groups/");
export const fetchAssemblies = () => listAll("/api/v1/accounts/assemblies/");

/**
 * Adds a member to the roll.
 *
 * A member is a person; a user is a login. Sending `phone_number` creates both,
 * and omitting it adds someone to the roll with no way to sign in — which is
 * the normal case here, since most of the congregation has no number on file.
 *
 * Leave `member_id` out and the server allocates the next free `MEM-###`. Only
 * send one when transcribing an id the church already uses, or two admins
 * adding people at the same time will collide on a number they each guessed.
 *
 * `role` above `member` is refused unless the caller is a super admin; promote
 * through `setMemberRole` instead, which is audited.
 */
export const createMemberRecord = (body: {
  member_id?: string;
  full_name: string;
  phone_number?: string;
  sex?: "M" | "F" | "";
  date_of_birth?: string;
  role?: "member" | "assembly_admin" | "super_admin";
}) =>
  request<ApiMember>("/api/v1/accounts/members/", {
    method: "POST",
    // Blank strings are omitted rather than sent: the server reads "" on
    // `date_of_birth` as a malformed date, not as "not known".
    body: Object.fromEntries(
      Object.entries({ ...body, role: body.role ?? "member" }).filter(([, v]) => v !== "" && v != null),
    ),
  });

/**
 * Corrects a member's record.
 *
 * Everything the Admin Hub can fix goes through here except `role`. Sending
 * `phone_number` gives a member their first login or moves it to a new SIM;
 * sending it empty removes the login but keeps the person on the roll.
 */
export const updateMemberRecord = (
  id: string,
  body: {
    full_name?: string;
    phone_number?: string;
    sex?: "M" | "F" | "";
    date_of_birth?: string;
    day_born_group_id?: string | null;
    assigned_elder_id?: string | null;
  },
) =>
  request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    // An empty `date_of_birth` means "not known" and has to go as null; the
    // server reads "" as a malformed date and rejects the whole correction.
    // An empty `phone_number` is different — that one really does mean "remove
    // the login", so it is sent as it was typed.
    body: { ...body, ...(body.date_of_birth === "" ? { date_of_birth: null } : {}) },
  });

/** Removes a member from the roll, and their login with them. */
export const deleteMemberRecord = (id: string) =>
  request<void>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`, { method: "DELETE" });

/**
 * Grants or revokes administrative privileges.
 *
 * A plain PATCH cannot do this: `role` is read-only on the member serializer so
 * nobody can promote themselves, and the server answers 200 while quietly
 * ignoring the field — which would leave the hub reporting a change that never
 * happened. This endpoint is the one that actually applies it, and only a super
 * admin may call it.
 */
export const setMemberRole = (id: string, role: "member" | "assembly_admin" | "super_admin") =>
  request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/set-role/`, {
    method: "POST",
    body: { role },
  });

/** The assembly's standing geofence, used between sessions. */
export const updateAssembly = (
  id: string,
  body: {
    geofence_center_lat?: string;
    geofence_center_lng?: string;
    geofence_radius_meters?: number;
  },
) =>
  request(`/api/v1/accounts/assemblies/${encodeURIComponent(id)}/`, { method: "PATCH", body });

/**
 * Uploads a member's profile photograph.
 *
 * Sent as multipart rather than JSON because `profile_photo` is an ImageField —
 * the server wants the file, not a path. On a phone the picker hands back a
 * `file://` URI, which React Native turns into a real upload when given as
 * `{ uri, name, type }`; in the browser the same URI is a blob that has to be
 * fetched first. Both arrive at the server as an ordinary file part.
 */
export async function uploadProfilePhoto(memberId: string, uri: string): Promise<ApiMember> {
  const form = new FormData();
  const name = uri.split("/").pop()?.split("?")[0] || "photo.jpg";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "jpg";
  const type = `image/${ext === "jpg" ? "jpeg" : ext}`;

  if (uri.startsWith("blob:") || uri.startsWith("data:")) {
    const blob = await (await fetch(uri)).blob();
    form.append("profile_photo", blob, name);
  } else {
    // React Native's own multipart shape; `as never` because the DOM typings
    // for FormData do not describe it.
    form.append("profile_photo", { uri, name, type } as never);
  }

  return request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(memberId)}/`, {
    method: "PATCH",
    form,
  });
}

/** Patches a member. Used for the member's own settings. */
export const updateMember = (id: string, body: Partial<ApiMember> | FormData) =>
  body instanceof FormData
    ? request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`, {
        method: "PATCH",
        form: body,
      })
    : request<ApiMember>(`/api/v1/accounts/members/${encodeURIComponent(id)}/`, {
        method: "PATCH",
        body,
      });

// ─── Attendance ──────────────────────────────────────────────────────────────

export const fetchSessions = () => listAll<ApiAttendanceSession>("/api/v1/attendance/sessions/");

/** The session currently taking attendance, if any. */
export async function fetchOpenSession(): Promise<ApiAttendanceSession | null> {
  const sessions = await fetchSessions();
  return sessions.find((s) => s.is_active && !s.closed_at) ?? null;
}

export interface OpenSessionInput {
  assembly: string;
  service_name: string;
  /**
   * Where the admin is standing. Leave it out and the server uses the
   * assembly's own fence — which is what should happen whenever the admin's
   * GPS is too vague to anchor a service on.
   */
  centre?: { lat: number; lng: number };
  /** Leave out to use the assembly's configured radius. */
  radius?: number;
}

/**
 * Opens attendance for every phone in the assembly.
 *
 * This used to send `assembly` (the server reads `assembly_id`) and the raw GPS
 * reading as a string — "6.689231874512365" — into a column that holds six
 * decimal places. Either alone was a 400, so no session ever reached the
 * server: the admin's own phone showed "Attendance Open" from local state while
 * every member's phone asked the server, found nothing open, and kept the
 * button dark.
 */
export const openSession = (input: OpenSessionInput) =>
  request<ApiAttendanceSession>("/api/v1/attendance/sessions/", {
    method: "POST",
    body: {
      assembly_id: input.assembly,
      service_name: input.service_name,
      ...(input.centre
        ? {
            // Six places is ~11cm — finer than any phone fix, and all the
            // column holds.
            geofence_center_lat: input.centre.lat.toFixed(6),
            geofence_center_lng: input.centre.lng.toFixed(6),
          }
        : {}),
      ...(input.radius ? { geofence_radius_meters: Math.round(input.radius) } : {}),
    },
  });

/** The assembly's standing fence, as the server holds it. */
export const fetchAssembly = (id: string) =>
  request<ApiAssembly>(`/api/v1/accounts/assemblies/${encodeURIComponent(id)}/`);

export const closeSession = (id: string) =>
  request<ApiAttendanceSession>(`/api/v1/attendance/sessions/${encodeURIComponent(id)}/close/`, {
    method: "POST",
  });

export const fetchRecords = () => listAll<ApiAttendanceRecord>("/api/v1/attendance/records/");

/**
 * Today, as the server counts days.
 *
 * The server keeps UTC and filters `?date=` against it. Ghana is on UTC too, so
 * on a member's phone the two agree anyway — but a phone set to another zone
 * would otherwise ask for the wrong day late in the evening.
 */
export function serverToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sessions opened on one day — a handful, where the full list grows forever. */
export const fetchSessionsOn = (date: string) =>
  listAll<ApiAttendanceSession>("/api/v1/attendance/sessions/", { query: { date } });

/**
 * Every attendance mark taken in a session opened on `date`.
 *
 * Filtered on the server: the unfiltered list is every mark the church has
 * ever taken, and `listAll` stops at a few hundred rows — so after a few weeks
 * of services today's marks would fall past the cap and read as nobody.
 */
export const fetchRecordsOn = (date: string) =>
  listAll<ApiAttendanceRecord>("/api/v1/attendance/records/", { query: { date } });

/**
 * One attendance mark — either a member signing for themselves by GPS, or an
 * admin signing on someone's behalf.
 *
 * A GPS mark sends **where the phone is**, not how far it thinks it is from the
 * centre. The server measures the distance itself and refuses a mark outside
 * the fence; `distance_from_center_meters` is read-only there. This used to send
 * a self-measured distance and no coordinates, and the server rejected every
 * self sign-in for want of `lat`/`lng` — which is why members could not mark
 * attendance from the app.
 */
export type MarkAttendanceInput =
  | { method: "gps"; session: string; lat: number; lng: number; is_first_timer?: boolean }
  | { method: "manual"; session: string; member: string; note?: string; is_first_timer?: boolean };

export function markAttendance(input: MarkAttendanceInput) {
  // The server names write-side foreign keys with an `_id` suffix and returns
  // them without one; sending `session` was silently a missing `session_id`.
  const body =
    input.method === "gps"
      ? {
          session_id: input.session,
          method: "gps",
          // Six places is the server's precision — about 11cm — and more digits
          // fail its decimal validation.
          lat: input.lat.toFixed(6),
          lng: input.lng.toFixed(6),
          is_first_timer: input.is_first_timer,
        }
      : {
          session_id: input.session,
          member_id: input.member,
          method: "manual",
          note: input.note,
          is_first_timer: input.is_first_timer,
        };
  return request<ApiAttendanceRecord>("/api/v1/attendance/records/", { method: "POST", body });
}

export const undoAttendance = (id: string) =>
  request<void>(`/api/v1/attendance/records/${encodeURIComponent(id)}/`, { method: "DELETE" });

export const fetchStats = () =>
  listAll<ApiMemberAttendanceStat>("/api/v1/attendance/stats/");

// ─── Published content ───────────────────────────────────────────────────────

export const fetchSchedules = () => listAll<ApiWeeklySchedule>("/api/v1/content/schedules/");
export const fetchEvents = () => listAll<ApiEvent>("/api/v1/content/events/");
export const fetchStudies = () => listAll<ApiBibleStudyWeek>("/api/v1/content/bible-study-weeks/");

/** What the schedules endpoint accepts. `assembly_id` and `time` are required. */
export interface ScheduleInput {
  assembly_id?: string;
  name: string;
  location?: string;
  time: string | null;
  start_weekday: number | null;
  end_weekday?: number | null;
  is_active?: boolean;
}

export const createSchedule = (body: ScheduleInput) =>
  request<ApiWeeklySchedule>("/api/v1/content/schedules/", { method: "POST", body });

export const deleteSchedule = (id: string) =>
  request<void>(`/api/v1/content/schedules/${encodeURIComponent(id)}/`, { method: "DELETE" });

/** What the events endpoint accepts. An assembly-scoped event must name one. */
export interface EventInput {
  assembly_id?: string;
  title: string;
  description?: string;
  event_date: string;
  scope?: "assembly" | "district";
}

export const createEvent = (body: EventInput) =>
  request<ApiEvent>("/api/v1/content/events/", { method: "POST", body });

export const deleteEvent = (id: string) =>
  request<void>(`/api/v1/content/events/${encodeURIComponent(id)}/`, { method: "DELETE" });

export const createStudy = (body: Partial<ApiBibleStudyWeek>) =>
  request<ApiBibleStudyWeek>("/api/v1/content/bible-study-weeks/", { method: "POST", body });

export const deleteStudy = (id: string) =>
  request<void>(`/api/v1/content/bible-study-weeks/${encodeURIComponent(id)}/`, { method: "DELETE" });

// ─── Notifications ───────────────────────────────────────────────────────────

export const fetchNotifications = () => listAll<ApiNotification>("/api/v1/content/notifications/");

/**
 * Read state is its own row rather than a flag on the notification — one
 * announcement goes to the whole assembly, so "read" has to be per member.
 */
export const fetchNotificationReads = () =>
  listAll<ApiNotificationRead>("/api/v1/content/notification-reads/");

export const markNotificationRead = (notification: string) =>
  request<ApiNotificationRead>("/api/v1/content/notification-reads/", {
    method: "POST",
    body: { notification },
  });

// ─── Milestones ──────────────────────────────────────────────────────────────

export const fetchMilestones = () =>
  listAll<ApiSpiritualMilestone>("/api/v1/milestones/milestones/");

export const createMilestone = (body: Partial<ApiSpiritualMilestone>) =>
  request<ApiSpiritualMilestone>("/api/v1/milestones/milestones/", { method: "POST", body });

// ─── Audit trail ─────────────────────────────────────────────────────────────

/**
 * The administrative activity trail, newest first.
 *
 * Read-only and super-admin only: the server writes every entry as the action
 * happens, so there is no way to post, edit or delete one. A trail the client
 * could write to would prove nothing.
 */
export const fetchActivity = () => listAll<ApiActivityLog>("/api/v1/core/activity/");
