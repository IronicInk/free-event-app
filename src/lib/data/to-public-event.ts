/**
 * Converts a stored event record into the public FreeEvent shape.
 * Returns null for anything the public must not see (hidden, paid, pending,
 * rejected, expired) or that is missing fields needed to show it.
 */
import {
  isCategoryId,
  isPubliclyReadable,
  isValleyCity,
  type EventRecord,
} from "@shared/event-model";
import type { FreeEvent } from "@/lib/types";

/** Event records with timestamps already converted to ISO strings. */
export type StoredEvent = EventRecord<string>;

export const SAMPLE_SOURCE_ID = "sample";

export function toPublicEvent(record: StoredEvent): FreeEvent | null {
  if (!isPubliclyReadable(record)) return null;
  if (!isCategoryId(record.primary_category) || !isValleyCity(record.city)) return null;
  if (!record.title || !record.start_at || !record.source_url) return null;

  const venue = record.venue_name ?? record.address ?? "";
  const hasCoords = record.latitude !== null && record.longitude !== null;

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    category: record.primary_category,
    tags: record.tags ?? [],
    startsAt: record.start_at,
    endsAt: record.end_at ?? undefined,
    allDay: record.all_day,
    recurrenceNote: record.recurrence_note ?? undefined,
    venue,
    address: record.address ?? "",
    city: record.city,
    lat: hasCoords ? record.latitude! : undefined,
    lng: hasCoords ? record.longitude! : undefined,
    organizer: record.organizer_name ?? undefined,
    imageUrl: record.image_url ?? undefined,
    priceNote: record.price_note ?? undefined,
    audienceNote: record.audience_note ?? undefined,
    sourceName: record.source_name,
    sourceUrl: record.source_url,
    additionalSources: (record.additional_sources ?? []).map(({ name, url }) => ({ name, url })),
    cancelled: record.cancelled || record.status === "cancelled",
    isSample: record.source_id === SAMPLE_SOURCE_ID,
  };
}
