/**
 * Types for the Pentecost Attendance API.
 *
 * Hand-written from the OpenAPI schema at /api/schema/ rather than generated, so
 * the names read like the rest of the app and only the parts we actually use are
 * carried. When the backend changes, re-read that schema — it is the source of
 * truth, not this file.
 *
 * Two conventions the server uses throughout:
 * - **ids are UUID strings**, not numbers.
 * - **decimals arrive as strings** (`geofence_center_lat`, `annual_score_percent`),
 *   because that is how Django REST Framework serialises them without losing
 *   precision. Parse them at the edge; never do arithmetic on the raw value.
 */

// ─── Enums, exactly as the server spells them ────────────────────────────────

export type ApiRole = "member" | "assembly_admin" | "super_admin";
export type ApiMethod = "gps" | "manual";
export type ApiLanguage = "en" | "tw";
export type ApiOffice = "presiding" | "counseling" | "other";
export type ApiScope = "assembly" | "district";
export type ApiAudience = "all" | "assembly" | "day_born_group" | "member";
export type ApiMilestoneType = "baptism" | "confirmation" | "certification" | "other";
export type ApiNotificationType =
  | "session_open"
  | "event"
  | "bible_study"
  | "streak"
  | "elder_availability"
  | "system"
  | "daily_verse";

/** Monday = 0 … Sunday = 6, following Python's weekday numbering — not JavaScript's. */
export type ApiWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ─── Envelopes ───────────────────────────────────────────────────────────────

/** Every list endpoint is paginated this way. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Resources ───────────────────────────────────────────────────────────────

export interface ApiAssemblyMini {
  id: string;
  name: string;
  slug?: string;
}

export interface ApiDayBornGroupMini {
  id: string;
  name: string;
  weekday?: ApiWeekday;
}

export interface ApiElderMini {
  id: string;
  title?: string;
  office?: ApiOffice;
}

export interface ApiMemberMini {
  id: string;
  member_id: string;
  full_name: string;
  profile_photo?: string | null;
}

export interface ApiMember {
  id: string;
  member_id: string;
  full_name: string;
  date_of_birth?: string | null;
  /** "M" | "F", or "" when the roll does not record it. */
  sex?: string;
  /** Where they live, as the church records it — "Ayigya Zongo", "KNUST". */
  residence?: string;
  /** Ministries and departments: ["Royal Youth Choir", "Royal Drama Troupe"]. Admin-set. */
  church_roles?: string[];
  /** "single" | "married" | "widowed" | "divorced", or "" when not recorded. */
  marital_status?: string;
  /**
   * The member's login, `0XXXXXXXXX`, or `""` when they have none — which is
   * most of the roll. Stored on the User rather than the member, but read and
   * written here, so correcting a number is one PATCH like any other field.
   * Sending `""` removes the login and leaves the person on the roll.
   */
  phone_number?: string;
  profile_photo?: string | null;
  role: ApiRole;
  assembly: ApiAssemblyMini | null;
  day_born_group: ApiDayBornGroupMini | null;
  assigned_elder: ApiElderMini | null;
  is_profile_complete?: boolean;
  bible_study_language?: ApiLanguage;
  dark_mode_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAssembly {
  id: string;
  name: string;
  slug: string;
  district: string;
  founded_year?: number | null;
  is_active?: boolean;
  banner_image?: string | null;
  /** Decimal-as-string. The standing boundary, used when no session overrides it. */
  geofence_center_lat?: string | null;
  geofence_center_lng?: string | null;
  geofence_radius_meters?: number | null;
  presiding_elder: ApiElderMini | null;
  created_at: string;
  updated_at: string;
}

export interface ApiElder {
  id: string;
  member: ApiMemberMini | null;
  office?: ApiOffice;
  title?: string;
  contact_phone?: string;
  contact_email?: string | null;
  whatsapp_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDayBornGroup {
  id: string;
  name: string;
  weekday: ApiWeekday;
  assembly: ApiAssemblyMini | null;
  meeting_time?: string | null;
  meeting_location?: string;
  leader: ApiMemberMini | null;
  created_at: string;
  updated_at: string;
}

/**
 * An open service. The geofence lives on the *session*, captured where the admin
 * stood when they opened it — which is the same rule the app already enforces.
 */
export interface ApiAttendanceSession {
  id: string;
  assembly: ApiAssemblyMini;
  service_name: string;
  opened_by: ApiMemberMini | null;
  opened_at: string;
  closed_at?: string | null;
  is_active?: boolean;
  geofence_center_lat: string;
  geofence_center_lng: string;
  geofence_radius_meters: number;
  created_at: string;
  updated_at: string;
}

export interface ApiAttendanceRecord {
  id: string;
  session: string;
  member: ApiMemberMini | null;
  method?: ApiMethod;
  marked_at: string;
  /** How far from the session centre the phone was when it signed. */
  distance_from_center_meters: number;
  is_first_timer?: boolean;
  recorded_by: ApiMemberMini | null;
  note?: string;
  created_at: string;
  updated_at: string;
}

/** The figures behind the dashboard's attendance card. Computed server-side. */
export interface ApiMemberAttendanceStat {
  id: string;
  member: ApiMemberMini | null;
  assembly: ApiAssemblyMini | null;
  year: number;
  sessions_attended: number;
  sessions_possible: number;
  /** Decimal-as-string. */
  annual_score_percent: string;
  /** Consecutive Sunday services attended — Sundays with no service are skipped. */
  current_streak_weeks: number;
  longest_streak_weeks: number;
  sundays_attended?: number;
  sundays_possible?: number;
  /** Mean minutes from a session opening to the member's own GPS sign-in; null until they have one. */
  average_arrival_minutes?: number | null;
  last_attended_session?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiWeeklySchedule {
  id: string;
  assembly: ApiAssemblyMini | null;
  name: string;
  start_weekday: ApiWeekday | null;
  end_weekday: ApiWeekday | null;
  time?: string | null;
  location?: string;
  banner_image?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  /** Absolute URL of the photograph attached when it was published, if any. */
  cover_image?: string | null;
  scope?: ApiScope;
  assembly: ApiAssemblyMini | null;
  created_by: ApiMemberMini | null;
  created_at: string;
  updated_at: string;
}

/**
 * One week's study.
 *
 * Note the shape: the server carries a single title and scripture reference plus
 * an optional PDF — it does **not** carry the English and Twi text blocks the
 * app's reader renders. A member's language is a preference on their own record
 * (`bible_study_language`), not two columns of content.
 */
/** One week's study written out in one language. Every field optional but the language. */
export interface ApiStudyTranslation {
  id: string;
  language: ApiLanguage;
  title: string;
  aims: string[];
  questions: string[];
  memory_verse: string;
  notes: string;
}

export interface ApiBibleStudyWeek {
  id: string;
  /** Null for a district-wide study. */
  assembly: ApiAssemblyMini | null;
  theme: string;
  week_number: number;
  title: string;
  scripture_reference: string;
  page_range?: string;
  study_date: string;
  pdf_file?: string | null;
  /** Absolute URL of the photograph attached when it was published. */
  cover_image?: string | null;
  is_published?: boolean;
  /** Empty when the office has published the pamphlet facts but not the text. */
  translations?: ApiStudyTranslation[];
  created_at: string;
  updated_at: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  notification_type: ApiNotificationType;
  audience_type: ApiAudience;
  assembly: ApiAssemblyMini | null;
  day_born_group: ApiDayBornGroupMini | null;
  member: ApiMemberMini | null;
  created_at: string;
  updated_at: string;
}

/** Read state is a separate row the client creates, not a flag on the notification. */
export interface ApiNotificationRead {
  id: string;
  notification: string;
  member?: string;
  read_at?: string;
}

export interface ApiSpiritualMilestone {
  id: string;
  member: ApiMemberMini | null;
  milestone_type: ApiMilestoneType;
  date_occurred: string;
  certificate_file?: string | null;
  notes?: string;
  verified_by: ApiMemberMini | null;
  created_at: string;
  updated_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RequestOtpBody {
  phone_number: string;
  /** Android SMS Retriever hash, appended to the SMS so the app can read it. */
  app_hash?: string;
}

export interface VerifyOtpBody {
  phone_number: string;
  code: string;
}

/**
 * What `verify-otp` returns.
 *
 * Confirmed against the server's own view, which responds
 * `{"token": token.key, "member": member_data}` — `member` is null when the
 * user has no member profile attached yet.
 */
export interface VerifyOtpResponse {
  token: string;
  member: ApiMember | null;
}

/**
 * `request-otp` echoes a `debug_code` only when the server runs with
 * `DEBUG=True` and `OTP_BACKEND=console`. Production sends a real SMS and never
 * returns the code, so treat this as absent.
 */
export interface RequestOtpResponse {
  detail?: string;
  debug_code?: string;
}

/** One line of the administrative audit trail. Written by the server only. */
export interface ApiActivityLog {
  id: string;
  actor: string | null;
  actor_name: string;
  action: string;
  affected_record: string;
  severity: "info" | "warning" | "critical";
  assembly: string | null;
  created_at: string;
}

/** The morning verse, newest first from the server. */
export interface ApiDailyVerse {
  id: string;
  assembly: ApiAssemblyMini | null;
  reference: string;
  english: string;
  twi: string;
  published_on: string;
  created_by: ApiMemberMini | null;
  created_at: string;
  updated_at: string;
}
