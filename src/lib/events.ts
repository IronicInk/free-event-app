/**
 * Event queries: search, filter, sort, related.
 * Pure functions (no React, no browser APIs) so they're easy to test.
 * Loading events lives in lib/data/events.ts.
 */
import { getCategory, tagLabel } from "./categories";
import { getStart, hasEnded, matchesWhen } from "./dates";
import { eventDistance } from "./geo";
import type { EventFilters, FreeEvent, LatLng } from "./types";

/** Lowercased text we search against for one event. */
function searchableText(event: FreeEvent): string {
  return [
    event.title,
    event.description,
    event.venue,
    event.city,
    event.organizer ?? "",
    getCategory(event.category).label,
    ...event.tags.map(tagLabel),
  ]
    .join(" ")
    .toLowerCase();
}

/** Every word in the query must appear somewhere ("market tempe" matches a market in Tempe). */
function matchesQuery(event: FreeEvent, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = searchableText(event);
  return terms.every((term) => text.includes(term));
}

export function sortByStart(events: FreeEvent[]): FreeEvent[] {
  return [...events].sort((a, b) => getStart(a).getTime() - getStart(b).getTime());
}

/** Nearest first; events without coordinates go last (still soonest-first among themselves). */
export function sortByDistance(events: FreeEvent[], from: LatLng): FreeEvent[] {
  const far = Number.POSITIVE_INFINITY;
  return sortByStart(events).sort(
    (a, b) => (eventDistance(a, from) ?? far) - (eventDistance(b, from) ?? far),
  );
}

/** Events you can still go to: not finished, not cancelled. Soonest first. */
export function upcomingEvents(events: FreeEvent[], now: Date): FreeEvent[] {
  return sortByStart(events.filter((e) => !e.cancelled && !hasEnded(e, now)));
}

/**
 * Applies every filter and sorts.
 * Distance filters/sorting only apply when `location` is known (FR-4: everything
 * still works if the user declines location).
 */
export function filterEvents(
  events: FreeEvent[],
  filters: EventFilters,
  now: Date,
  location: LatLng | null = null,
): FreeEvent[] {
  const matches = upcomingEvents(events, now).filter((event) => {
    if (filters.category !== null && event.category !== filters.category) return false;
    if (filters.city !== null && event.city !== filters.city) return false;
    if (!matchesWhen(event, filters, now)) return false;
    if (!matchesQuery(event, filters.q)) return false;
    if (filters.radius !== null && location) {
      const miles = eventDistance(event, location);
      if (miles === null || miles > filters.radius) return false;
    }
    return true;
  });
  return filters.sort === "nearest" && location ? sortByDistance(matches, location) : matches;
}

/** Upcoming events this weekend (for the Discover "This weekend" row). */
export function getWeekendEvents(events: FreeEvent[], now: Date, limit = 8): FreeEvent[] {
  return upcomingEvents(events, now)
    .filter((e) => matchesWhen(e, { when: "weekend", from: null, to: null }, now))
    .slice(0, limit);
}

/** Similar upcoming events (same category first, then same city). */
export function getRelatedEvents(
  event: FreeEvent,
  pool: FreeEvent[],
  now: Date,
  limit = 4,
): FreeEvent[] {
  const others = upcomingEvents(pool, now).filter((e) => e.id !== event.id);
  const sameCategory = others.filter((e) => e.category === event.category);
  const sameCity = others.filter((e) => e.category !== event.category && e.city === event.city);
  return [...sameCategory, ...sameCity].slice(0, limit);
}

/** Cities that currently have upcoming events, for the city filter. */
export function citiesWithEvents(events: FreeEvent[], now: Date): FreeEvent["city"][] {
  return [...new Set(upcomingEvents(events, now).map((e) => e.city))].sort();
}

/** Google Maps search link for the venue. */
export function mapsUrl(event: FreeEvent): string {
  const query =
    event.lat !== undefined && event.lng !== undefined
      ? `${event.lat},${event.lng}`
      : [event.venue, event.address, event.city, "AZ"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** "Venue, Address" without repeating the venue if there's no separate address. */
export function fullLocation(event: FreeEvent): string {
  return [event.venue, event.address].filter((part, i, all) => part && all.indexOf(part) === i).join(", ");
}
