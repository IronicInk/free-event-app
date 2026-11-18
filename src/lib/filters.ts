/**
 * Converts filters <-> URL query string.
 * Keeping filters in the URL means every filtered view is shareable
 * ("send me that link") and survives refresh / back button.
 * The user's location is never put in the URL.
 */
import { isValleyCity } from "@shared/event-model";
import { isDayKey } from "./dates";
import {
  CATEGORY_IDS,
  RADIUS_OPTIONS,
  SORT_OPTIONS,
  WHEN_OPTIONS,
  type CategoryId,
  type EventFilters,
  type Radius,
  type SortOption,
  type When,
} from "./types";

export const DEFAULT_FILTERS: EventFilters = {
  q: "",
  category: null,
  when: "any",
  from: null,
  to: null,
  city: null,
  sort: "soonest",
  radius: null,
};

/** Returns `value` if it is one of `allowed`, otherwise `fallback`. Guards against bad URLs. */
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T): T;
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: null): T | null;
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T | null) {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function dayOrNull(value: string | null): string | null {
  return value && isDayKey(value) ? value : null;
}

export function parseFilters(params: URLSearchParams): EventFilters {
  const when = oneOf<When>(WHEN_OPTIONS, params.get("when"), DEFAULT_FILTERS.when);
  let from = when === "dates" ? dayOrNull(params.get("from")) : null;
  let to = when === "dates" ? dayOrNull(params.get("to")) : null;
  if (from && to && from > to) [from, to] = [to, from];

  const radius = Number(params.get("within"));
  const city = params.get("city");

  return {
    q: (params.get("q") ?? "").trim(),
    category: oneOf<CategoryId>(CATEGORY_IDS, params.get("category"), null),
    when,
    from,
    to,
    city: isValleyCity(city) ? city : null,
    sort: oneOf<SortOption>(SORT_OPTIONS, params.get("sort"), DEFAULT_FILTERS.sort),
    radius: (RADIUS_OPTIONS as readonly number[]).includes(radius) ? (radius as Radius) : null,
  };
}

/** Only non-default values are written, so URLs stay short and clean. */
export function filtersToQuery(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.when !== DEFAULT_FILTERS.when) params.set("when", filters.when);
  if (filters.when === "dates" && filters.from) params.set("from", filters.from);
  if (filters.when === "dates" && filters.to) params.set("to", filters.to);
  if (filters.city) params.set("city", filters.city);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.radius !== null) params.set("within", String(filters.radius));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Number of filters that differ from the defaults (for the "Filters (2)" badge). */
export function countActiveFilters(filters: EventFilters): number {
  return [
    filters.q.trim() !== "",
    filters.category !== null,
    filters.when !== DEFAULT_FILTERS.when,
    filters.city !== null,
    filters.sort !== DEFAULT_FILTERS.sort,
    filters.radius !== null,
  ].filter(Boolean).length;
}

export const WHEN_LABELS: Record<When, string> = {
  any: "Any time",
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This weekend",
  week: "This week",
  dates: "Pick dates",
};

export const SORT_LABELS: Record<SortOption, string> = {
  soonest: "Soonest first",
  nearest: "Nearest first",
};
