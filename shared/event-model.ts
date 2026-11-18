/**
 * Valley Vibe event model — shared by the web app (src/) and the nightly
 * data pull (functions/). This is the single source of truth for:
 *   - the Firestore `events` document shape (PROJECT_REQUIREMENTS.md §13)
 *   - the category taxonomy (§4.2)
 *   - the rule for what the public may see (§7.6, FR-1, NFR-6)
 *   - the Phase 1 geography (§15, open question 1)
 *
 * Keep this file dependency-free (no imports) so both builds can include it.
 * If you change the public-visibility rule here, change firestore.rules too.
 */

// ---------------------------------------------------------------------------
// Category taxonomy (§4.2)
// ---------------------------------------------------------------------------

/** The three primary categories the founders want emphasized. */
export const PRIMARY_CATEGORY_IDS = ["farmers-markets", "festivals", "celebrations"] as const;

/** Still in scope, but not primary. */
export const INCLUDED_CATEGORY_IDS = [
  "parks-outdoors",
  "arts-culture",
  "music-performance",
  "seasonal-holiday",
] as const;

/**
 * Every value allowed in `primary_category`.
 * Sports & fitness are deliberately absent: they are out of scope entirely (§4.2, §17).
 */
export const CATEGORY_IDS = [...PRIMARY_CATEGORY_IDS, ...INCLUDED_CATEGORY_IDS] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** Supporting tags (§4.2). `tags` may also hold free-form keywords. */
export const SUPPORTING_TAGS = [
  "family",
  "library-learning",
  "markets-fairs-popups",
  "volunteer-civic",
  "health-wellness",
] as const;

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Geography (Phase 1 = Phoenix metro / "the Valley")
// ---------------------------------------------------------------------------

/**
 * Valley cities and towns accepted in Phase 1.
 * The exact boundary is an open founder question (§16 Q1); edit this list to change it.
 */
export const VALLEY_CITIES = [
  "Phoenix",
  "Tempe",
  "Mesa",
  "Scottsdale",
  "Chandler",
  "Gilbert",
  "Glendale",
  "Peoria",
  "Surprise",
  "Avondale",
  "Goodyear",
  "Buckeye",
  "Queen Creek",
  "Fountain Hills",
  "Cave Creek",
  "Carefree",
  "Paradise Valley",
  "Tolleson",
  "Litchfield Park",
  "El Mirage",
  "Guadalupe",
] as const;
export type ValleyCity = (typeof VALLEY_CITIES)[number];

export function isValleyCity(value: unknown): value is ValleyCity {
  return typeof value === "string" && (VALLEY_CITIES as readonly string[]).includes(value);
}

/** Rough box around the Valley, used to sanity-check coordinates (§7.5). */
export const VALLEY_BOUNDS = { south: 33.15, north: 34.0, west: -112.95, east: -111.5 } as const;

export function isInsideValley(lat: number, lng: number): boolean {
  const b = VALLEY_BOUNDS;
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;
}

export const VALLEY_TIMEZONE = "America/Phoenix";

// ---------------------------------------------------------------------------
// Firestore `events` document (§13)
// ---------------------------------------------------------------------------

export const EVENT_STATUSES = [
  "pending_review",
  "published",
  "rejected",
  "cancelled",
  "expired",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const VISIBILITIES = ["public", "hidden"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type GeocodeStatus = "ok" | "pending" | "failed" | "source_provided";

export type Confidence = "high" | "medium" | "low";

export interface SourceLink {
  name: string;
  url: string;
  /** Registry ID of the source (lets the pipeline recognise merged listings). */
  source_id?: string;
  source_event_id?: string | null;
}

/**
 * One canonical event as stored in Firestore.
 * `T` is the timestamp type: Firestore `Timestamp` on the server, ISO string once
 * converted for the web app.
 */
export interface EventRecord<T> {
  id: string;
  title: string;
  description: string | null;
  start_at: T;
  end_at: T | null;
  all_day: boolean;
  timezone: string;
  recurrence_note: string | null;
  recurrence_rule: string | null;

  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_status: GeocodeStatus;
  area: string | null;

  primary_category: CategoryId | null;
  tags: string[];

  is_free: boolean;
  visibility: Visibility;
  price_note: string | null;
  audience_note: string | null;

  status: EventStatus;
  cancelled: boolean;

  organizer_name: string | null;
  image_url: string | null;

  source_id: string;
  source_name: string;
  source_url: string;
  source_event_id: string | null;
  additional_sources: SourceLink[];

  dedupe_key: string | null;
  confidence_free: Confidence | null;
  confidence_duplicate: Confidence | null;
  needs_review: boolean;
  review_reasons: string[];
  curator_note: string | null;
  curated_by: string | null;
  curated_at: T | null;
  /** Set when a curator merges this record into another canonical event. */
  merged_into: string | null;

  first_seen_at: T;
  last_seen_at: T;
  /** Consecutive pull runs in which no source listed this event (§7.7). */
  missing_runs: number;
  created_at: T;
  updated_at: T;
}

/** Statuses a consumer may read. Cancelled stays readable so saved events can show "Cancelled" (§7.6). */
export const PUBLIC_STATUSES = ["published", "cancelled"] as const satisfies readonly EventStatus[];

/**
 * THE public-visibility rule (FR-1, NFR-3, NFR-6). Mirrors firestore.rules.
 * Paid events are always hidden, whatever their status.
 */
export function isPubliclyReadable(
  e: Pick<EventRecord<unknown>, "visibility" | "is_free" | "status">,
): boolean {
  return (
    e.visibility === "public" &&
    e.is_free === true &&
    (PUBLIC_STATUSES as readonly string[]).includes(e.status)
  );
}

/** Fields required before an event may be published publicly (§4.2, §7.3 step 5, §13). */
export function missingPublishFields(
  e: Pick<
    EventRecord<unknown>,
    "title" | "start_at" | "city" | "venue_name" | "address" | "primary_category" | "source_url"
  >,
): string[] {
  const missing: string[] = [];
  if (!e.title?.trim()) missing.push("title");
  if (!e.start_at) missing.push("start_at");
  if (!e.venue_name?.trim() && !e.address?.trim()) missing.push("location");
  if (!e.city?.trim()) missing.push("city");
  if (!e.primary_category) missing.push("primary_category");
  if (!e.source_url?.trim()) missing.push("source_url");
  return missing;
}

// ---------------------------------------------------------------------------
// Source registry (§5.4, §7.1) — Firestore `sources` collection
// ---------------------------------------------------------------------------

export type FetchMethod = "api" | "ics" | "rss" | "html";

export interface SourceConfig {
  id: string;
  name: string;
  /** Official page a person can visit. */
  homepage_url: string;
  /** Machine-readable feed the fetcher reads (iCal, RSS, API). Empty until verified. */
  feed_url: string | null;
  method: FetchMethod;
  /**
   * Off by default. Turn on only after the §5.4 checklist is done:
   * feed confirmed, terms + robots.txt read, owner recorded.
   */
  enabled: boolean;
  /** "review" = every new event goes to the curator queue (§5.4 step 5). */
  review_policy: "review" | "auto_publish_updates";
  /** Default city when the feed omits one (e.g. a Tempe-only calendar). */
  default_city: ValleyCity | null;
  /** §5.4 step 3: who owns this connector, and what the terms allow. */
  owner: string | null;
  terms_checked_at: string | null;
  attribution_note: string | null;
  notes: string | null;
}
