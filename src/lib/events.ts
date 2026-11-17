/**
 * Event queries: search, filter, sort, lookup.
 * These are pure functions (no React, no browser APIs) so they're easy to test
 * and can later be swapped for database queries without touching the UI.
 */
import { SAMPLE_EVENTS } from "@/data/sample-events";
import { getCategory } from "./categories";
import { getStart, hasEnded, matchesWhen } from "./dates";
import type { EventFilters, FreeEvent } from "./types";

/** Lowercased text we search against for one event. */
function searchableText(event: FreeEvent): string {
  return [
    event.title,
    event.description,
    event.venue,
    event.area,
    event.organizer,
    getCategory(event.category).label,
    ...event.tags,
  ]
    .join(" ")
    .toLowerCase();
}

/** Every word in the query must appear somewhere ("jazz tempe" matches a jazz event in Tempe). */
function matchesQuery(event: FreeEvent, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = searchableText(event);
  return terms.every((term) => text.includes(term));
}

export function sortByStart(events: FreeEvent[]): FreeEvent[] {
  return [...events].sort((a, b) => getStart(a).getTime() - getStart(b).getTime());
}

export function sortByPopularity(events: FreeEvent[]): FreeEvent[] {
  return [...events].sort((a, b) => b.interestedCount - a.interestedCount);
}

/** Events that haven't finished yet, soonest first. */
export function upcomingEvents(events: FreeEvent[], now: Date): FreeEvent[] {
  return sortByStart(events.filter((e) => !hasEnded(e, now)));
}

/**
 * "Trending": the most popular events in the next `withinDays` days.
 * Falls back to all upcoming events if the next few weeks are quiet.
 */
export function getTrendingEvents(
  events: FreeEvent[],
  now: Date,
  { withinDays = 14, limit = 8 } = {},
): FreeEvent[] {
  const upcoming = upcomingEvents(events, now);
  const cutoff = now.getTime() + withinDays * 24 * 60 * 60 * 1000;
  const soon = upcoming.filter((e) => getStart(e).getTime() <= cutoff);
  const pool = soon.length >= 4 ? soon : upcoming;
  return sortByPopularity(pool).slice(0, limit);
}

/** Applies every filter, hides past events, and sorts. */
export function filterEvents(events: FreeEvent[], filters: EventFilters, now: Date): FreeEvent[] {
  const matches = upcomingEvents(events, now).filter(
    (event) =>
      (filters.category === null || event.category === filters.category) &&
      (filters.area === null || event.area === filters.area) &&
      matchesWhen(event, filters.when, now) &&
      matchesQuery(event, filters.q),
  );
  return filters.sort === "popular" ? sortByPopularity(matches) : matches;
}

/** Similar upcoming events (same category first, then same area). */
export function getRelatedEvents(
  event: FreeEvent,
  pool: FreeEvent[],
  now: Date,
  limit = 4,
): FreeEvent[] {
  const others = upcomingEvents(pool, now).filter((e) => e.id !== event.id);
  const sameCategory = others.filter((e) => e.category === event.category);
  const sameArea = others.filter((e) => e.category !== event.category && e.area === event.area);
  return [...sameCategory, ...sameArea].slice(0, limit);
}

export function getSampleEvents(): FreeEvent[] {
  return SAMPLE_EVENTS;
}

export function getSampleEventById(id: string): FreeEvent | undefined {
  return SAMPLE_EVENTS.find((e) => e.id === id);
}

/** Google Maps search link for the venue. */
export function mapsUrl(event: FreeEvent): string {
  const query = `${event.venue}, ${event.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
