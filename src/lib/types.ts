import type { Area } from "./site";

/** Every category id. Add a new one here AND in lib/categories.ts. */
export const CATEGORY_IDS = [
  "music",
  "arts",
  "food",
  "outdoors",
  "fitness",
  "community",
  "learning",
  "family",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** A single free event. This is the one shape used across the whole app. */
export interface FreeEvent {
  id: string;
  title: string;
  description: string;
  category: CategoryId;

  /** ISO 8601 with offset, e.g. "2026-11-21T18:00:00-07:00" */
  startsAt: string;
  /** Optional. If missing, the event is assumed to last 2 hours. */
  endsAt?: string;

  venue: string;
  address: string;
  area: Area;

  organizer: string;
  /** Optional external page (RSVP, info, social post). */
  link?: string;
  /** Optional cover image URL or data URL. Falls back to a category gradient. */
  coverImage?: string;
  tags: string[];

  /** Social proof shown on cards ("128 interested"). */
  interestedCount: number;

  /** Where the event came from — useful when we add a real database. */
  source: "sample" | "local";
}

/** Date quick-filters shown as chips. */
export const WHEN_OPTIONS = ["any", "today", "tomorrow", "weekend", "week"] as const;
export type When = (typeof WHEN_OPTIONS)[number];

export const SORT_OPTIONS = ["soonest", "popular"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** All filters on the Discover/Explore screens. Mirrored in the URL. */
export interface EventFilters {
  q: string;
  category: CategoryId | null;
  when: When;
  area: Area | null;
  sort: SortOption;
}
