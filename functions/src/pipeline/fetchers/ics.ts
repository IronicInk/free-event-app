/**
 * iCalendar (.ics) fetcher, the preferred format after an official API (§7.2).
 * Many city and library calendars publish an iCal export.
 *
 * Recurring events (RRULE) become ONE record whose start is the next occurrence,
 * with a human-readable recurrence note (§5.2, FR-9).
 */
import ical, { type ParameterValue, type VEvent } from "node-ical";
import { MAX_DAYS_AHEAD, RECURRENCE_LOOKAHEAD_DAYS } from "../../config";
import type { PoliteHttp } from "../http";
import type { FetchedSource, RawEvent } from "../types";
import type { SourceConfig } from "../../../../shared/event-model";

const DAY_MS = 24 * 60 * 60 * 1000;

function text(value: ParameterValue | undefined): string | null {
  if (value === undefined || value === null) return null;
  const s = typeof value === "string" ? value : value.val;
  const trimmed = s?.trim();
  return trimmed ? trimmed : null;
}

/** All-day ("date") values are calendar days: pin them to midnight in Phoenix. */
function phoenixDay(date: Date): Date {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${d}T00:00:00-07:00`);
}

function priceTextFrom(description: string | null, extra: unknown[]): string | null {
  const parts = [description, ...extra.filter((v): v is string => typeof v === "string")];
  const found = parts
    .filter(Boolean)
    .join(" \n ")
    .match(/[^.\n]*(free|\$\s?\d|admission|ticket|donation|cost|fee|price|registration|rsvp)[^.\n]*/gi);
  return found ? found.join(" ") : null;
}

/** ORGANIZER;CN=Tempe Library:mailto:x@y → "Tempe Library". Email addresses are never kept. */
function organizerName(event: VEvent): string | null {
  const organizer = event.organizer as ParameterValue<string, Record<string, string>> | undefined;
  if (!organizer) return null;
  const cn = typeof organizer === "string" ? null : organizer.params?.CN;
  const name = (cn ?? (typeof organizer === "string" ? organizer : organizer.val))
    .replace(/^"|"$/g, "")
    .trim();
  return !name || /mailto:|@/i.test(name) ? null : name;
}

function geo(event: VEvent): { lat: number | null; lng: number | null } {
  const g = event.geo as { lat?: unknown; lon?: unknown } | undefined;
  const lat = Number(g?.lat);
  const lng = Number(g?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: null, lng: null };
}

export function eventsFromIcs(body: string, now: Date): RawEvent[] {
  const parsed = ical.sync.parseICS(body);
  const horizon = new Date(now.getTime() + MAX_DAYS_AHEAD * DAY_MS);
  const out: RawEvent[] = [];

  for (const component of Object.values(parsed)) {
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;
    // Overrides are folded in by expandRecurringEvent; skip them as standalone entries.
    if (event.recurrenceid) continue;

    let start: Date = event.start;
    let end: Date | null = event.end ?? null;
    let isFullDay = event.datetype === "date";
    let recurrenceNote: string | null = null;
    let instanceEvent: VEvent = event;

    if (event.rrule) {
      const instances = ical.expandRecurringEvent(event, {
        from: now,
        to: new Date(now.getTime() + RECURRENCE_LOOKAHEAD_DAYS * DAY_MS),
        expandOngoing: true,
      });
      const next = instances[0];
      if (!next) continue; // series has ended
      start = next.start;
      end = next.end;
      isFullDay = next.isFullDay;
      instanceEvent = next.event;
      recurrenceNote = event.rrule.toText();
    }

    if (isFullDay) {
      start = phoenixDay(start);
      end = end ? phoenixDay(end) : null;
    }
    const effectiveEnd = end ?? start;
    if (effectiveEnd < now || start > horizon) continue;

    const description = text(instanceEvent.description);
    const { lat, lng } = geo(instanceEvent);
    out.push({
      source_event_id: event.uid ?? null,
      title: text(instanceEvent.summary) ?? "",
      description,
      start,
      end,
      all_day: isFullDay,
      location_text: text(instanceEvent.location),
      latitude: lat,
      longitude: lng,
      url: typeof instanceEvent.url === "string" ? instanceEvent.url : null,
      categories: (instanceEvent.categories ?? []).map(String),
      price_text: priceTextFrom(description, [instanceEvent["x-cost"], instanceEvent["x-price"]]),
      cancelled: instanceEvent.status === "CANCELLED" || /^\s*(cancel(l)?ed|postponed)\b/i.test(text(instanceEvent.summary) ?? ""),
      recurrence_rule: event.rrule ? event.rrule.toString() : null,
      recurrence_note: recurrenceNote,
      organizer: organizerName(instanceEvent),
      image_url: null,
    });
  }
  return out;
}

export async function fetchIcs(http: PoliteHttp, source: SourceConfig, now: Date): Promise<FetchedSource> {
  if (!source.feed_url) throw new Error(`Source ${source.id} has no feed_url`);
  const res = await http.get(source.feed_url);
  return {
    events: eventsFromIcs(res.body, now),
    raw: { url: res.url, contentType: res.contentType, body: res.body, fetchedAt: res.fetchedAt },
  };
}
