/**
 * Date helpers. Everything is calculated in SITE.timeZone so "Today" means
 * today where the events are, not wherever the server happens to run.
 */
import { SITE } from "./site";
import type { FreeEvent, When } from "./types";

const TZ = SITE.timeZone;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

// Formatters are created once and reused (creating them is relatively slow).
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const shortDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const longDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" });
const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short" });
const dayOfMonthFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "numeric" });

/** "2026-11-21" in the site time zone. */
export function dayKey(date: Date): string {
  return dayKeyFmt.format(date);
}

function dayKeyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (0 = same day, 1 = tomorrow). */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((dayKeyToUtc(dayKey(to)) - dayKeyToUtc(dayKey(from))) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday, in the site time zone. */
function weekdayIndex(date: Date): number {
  return new Date(dayKeyToUtc(dayKey(date))).getUTCDay();
}

export function getStart(event: FreeEvent): Date {
  return new Date(event.startsAt);
}

export function getEnd(event: FreeEvent): Date {
  return event.endsAt
    ? new Date(event.endsAt)
    : new Date(getStart(event).getTime() + DEFAULT_DURATION_MS);
}

/** True once the event has finished. */
export function hasEnded(event: FreeEvent, now: Date): boolean {
  return getEnd(event).getTime() < now.getTime();
}

/** True while the event is happening right now. */
export function isLive(event: FreeEvent, now: Date): boolean {
  return getStart(event) <= now && !hasEnded(event, now);
}

/** True for a real "YYYY-MM-DD" calendar date. */
export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/**
 * Does the event fall inside the chosen date filter?
 * For a custom range ("dates"), an event matches if it is happening on any day
 * from `from` to `to` (inclusive). Either end may be left open.
 */
export function matchesWhen(
  event: FreeEvent,
  { when, from, to }: { when: When; from: string | null; to: string | null },
  now: Date,
): boolean {
  if (when === "any") return true;

  if (when === "dates") {
    const startDay = dayKey(getStart(event));
    const endDay = dayKey(getEnd(event));
    // "YYYY-MM-DD" strings compare correctly as plain text.
    return (from === null || endDay >= from) && (to === null || startDay <= to);
  }

  const diff = calendarDaysBetween(now, getStart(event));
  switch (when) {
    case "today":
      return diff <= 0; // includes events already in progress
    case "tomorrow":
      return diff === 1;
    case "week":
      return diff < 7;
    case "weekend": {
      // Upcoming Saturday + Sunday. On a Sunday, "this weekend" is just today.
      const today = weekdayIndex(now);
      const daysToSaturday = today === 0 ? 0 : 6 - today;
      const daysToSunday = today === 0 ? 0 : daysToSaturday + 1;
      return diff >= daysToSaturday && diff <= daysToSunday;
    }
  }
}

/** "Today", "Tomorrow", "Friday" (within a week) or "Sat, Dec 5". */
export function relativeDayLabel(date: Date, now: Date): string {
  const diff = calendarDaysBetween(now, date);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return weekdayFmt.format(date);
  return shortDateFmt.format(date);
}

/** "Sat, Nov 21" */
export function formatShortDate(date: Date): string {
  return shortDateFmt.format(date);
}

/** "Saturday, November 21, 2026" */
export function formatLongDate(date: Date): string {
  return longDateFmt.format(date);
}

/** "6:00 PM" */
export function formatTime(date: Date): string {
  return timeFmt.format(date);
}

/** "6:00 PM – 9:00 PM" (or just the start time if there is no end). */
export function formatTimeRange(event: FreeEvent): string {
  const start = formatTime(getStart(event));
  return event.endsAt ? `${start} – ${formatTime(getEnd(event))}` : start;
}

/** Pieces for the calendar-style date badge on cards: { month: "NOV", day: "21" } */
export function dateBadgeParts(date: Date): { month: string; day: string } {
  return { month: monthFmt.format(date).toUpperCase(), day: dayOfMonthFmt.format(date) };
}

