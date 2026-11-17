/**
 * "Add to calendar" helpers: Google Calendar link + .ics file (Apple / Outlook).
 */
import { getEnd, getStart } from "./dates";
import type { FreeEvent } from "./types";

/** 2026-11-22T01:00:00.000Z -> 20261122T010000Z */
function toCalendarStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes text for the .ics format (commas, semicolons, newlines). */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function googleCalendarUrl(event: FreeEvent, pageUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarStamp(getStart(event))}/${toCalendarStamp(getEnd(event))}`,
    details: `${event.description}\n\nFree event · ${pageUrl}`,
    location: `${event.venue}, ${event.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildIcsFile(event: FreeEvent, pageUrl: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Free Event App//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@free-event-app`,
    `DTSTAMP:${toCalendarStamp(new Date())}`,
    `DTSTART:${toCalendarStamp(getStart(event))}`,
    `DTEND:${toCalendarStamp(getEnd(event))}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.description}\n\n${pageUrl}`)}`,
    `LOCATION:${escapeIcs(`${event.venue}, ${event.address}`)}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // The .ics spec requires CRLF line endings.
  return lines.join("\r\n");
}

/** Triggers a download of the .ics file in the browser. */
export function downloadIcs(event: FreeEvent, pageUrl: string): void {
  const blob = new Blob([buildIcsFile(event, pageUrl)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
