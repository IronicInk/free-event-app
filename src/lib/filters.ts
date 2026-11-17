/**
 * Converts filters <-> URL query string.
 * Keeping filters in the URL means every filtered view is shareable
 * ("send me that link") and survives refresh / back button.
 */
import { AREAS, type Area } from "./site";
import {
  CATEGORY_IDS,
  SORT_OPTIONS,
  WHEN_OPTIONS,
  type CategoryId,
  type EventFilters,
  type SortOption,
  type When,
} from "./types";

export const DEFAULT_FILTERS: EventFilters = {
  q: "",
  category: null,
  when: "any",
  area: null,
  sort: "soonest",
};

/** Returns `value` if it is one of `allowed`, otherwise `fallback`. Guards against bad URLs. */
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T): T;
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: null): T | null;
function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T | null) {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseFilters(params: URLSearchParams): EventFilters {
  return {
    q: (params.get("q") ?? "").trim(),
    category: oneOf<CategoryId>(CATEGORY_IDS, params.get("category"), null),
    when: oneOf<When>(WHEN_OPTIONS, params.get("when"), DEFAULT_FILTERS.when),
    area: oneOf<Area>(AREAS, params.get("area"), null),
    sort: oneOf<SortOption>(SORT_OPTIONS, params.get("sort"), DEFAULT_FILTERS.sort),
  };
}

/** Only non-default values are written, so URLs stay short and clean. */
export function filtersToQuery(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.when !== DEFAULT_FILTERS.when) params.set("when", filters.when);
  if (filters.area) params.set("area", filters.area);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Number of filters that differ from the defaults (for the "Filters (2)" badge). */
export function countActiveFilters(filters: EventFilters): number {
  return [
    filters.q.trim() !== "",
    filters.category !== null,
    filters.when !== DEFAULT_FILTERS.when,
    filters.area !== null,
    filters.sort !== DEFAULT_FILTERS.sort,
  ].filter(Boolean).length;
}

export const WHEN_LABELS: Record<When, string> = {
  any: "Any time",
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This weekend",
  week: "This week",
};

export const SORT_LABELS: Record<SortOption, string> = {
  soonest: "Soonest first",
  popular: "Most popular",
};
