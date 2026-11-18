import type { CategoryId, ValleyCity } from "@shared/event-model";

export type { CategoryId, ValleyCity } from "@shared/event-model";
export { CATEGORY_IDS } from "@shared/event-model";

/**
 * A public event as the web app sees it.
 * Built from a Firestore `events` record (see lib/data/to-public-event.ts), which
 * only happens for records that pass isPubliclyReadable(), so every FreeEvent is free.
 */
export interface FreeEvent {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  tags: string[];

  /** ISO 8601 with offset, e.g. "2026-11-21T18:00:00-07:00". For recurring events: the next occurrence. */
  startsAt: string;
  /** Optional. If missing, the event is assumed to last 2 hours. */
  endsAt?: string;
  allDay: boolean;
  /** Human-readable repeat pattern, e.g. "Saturdays, Oct–May, 8am–1pm" (FR-9). */
  recurrenceNote?: string;

  venue: string;
  address: string;
  city: ValleyCity;
  /** Coordinates for the map and "near me". Missing until geocoded. */
  lat?: number;
  lng?: number;

  organizer?: string;
  imageUrl?: string;
  /** e.g. "Free to attend; food and goods available for purchase". */
  priceNote?: string;
  audienceNote?: string;

  /** Where the listing came from (FR-7). Always shown on the event page. */
  sourceName: string;
  sourceUrl: string;
  additionalSources: { name: string; url: string }[];

  /** Shown as "Cancelled" (FR-8). Cancelled events are left out of browse lists. */
  cancelled: boolean;
  /** True for the built-in sample events shown before Firebase is connected. */
  isSample: boolean;
}

/** Date quick-filters shown as chips. "dates" = custom range (from/to). */
export const WHEN_OPTIONS = ["any", "today", "tomorrow", "weekend", "week", "dates"] as const;
export type When = (typeof WHEN_OPTIONS)[number];

export const SORT_OPTIONS = ["soonest", "nearest"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Distance limits (miles) for "near me". Only applied once the user shares their location. */
export const RADIUS_OPTIONS = [5, 10, 25] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

/** All filters on the Discover/Explore/Map screens. Mirrored in the URL (never the user's location). */
export interface EventFilters {
  q: string;
  category: CategoryId | null;
  when: When;
  /** "YYYY-MM-DD", used when when === "dates". */
  from: string | null;
  to: string | null;
  city: ValleyCity | null;
  sort: SortOption;
  radius: Radius | null;
}

/** The user's location, kept on the device only (NFR-7). */
export interface LatLng {
  lat: number;
  lng: number;
}
