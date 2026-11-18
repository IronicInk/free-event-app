import { Timestamp } from "firebase/firestore";
import type { EventRecord } from "@shared/event-model";

/** An event document as the curator tool reads it. */
export type AdminEvent = EventRecord<Timestamp>;

const PHOENIX_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Timestamp → "YYYY-MM-DDTHH:mm" in Phoenix time, for <input type="datetime-local">. */
export function toPhoenixInput(ts: Timestamp | null): string {
  if (!ts) return "";
  return new Date(ts.toMillis() - PHOENIX_OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" (Phoenix) → Timestamp. */
export function fromPhoenixInput(value: string): Timestamp | null {
  if (!value) return null;
  const date = new Date(`${value}:00-07:00`);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
}

const displayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Phoenix",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatWhen(ts: Timestamp | null): string {
  return ts ? displayFmt.format(ts.toDate()) : "No date";
}

/** Plain-language labels for pipeline review reasons. */
const REASON_LABELS: Record<string, string> = {
  first_seen: "New from source",
  needs_geocode: "No map location",
  geocode_failed: "Address not found",
  no_category: "No category",
  low_confidence_category: "Category is a guess",
  suggested_donation: "Suggested donation",
  resident_only_free: "Free for residents only",
  member_only_free: "Free for members only",
  registration_required: "Registration required",
  free_with_paid_admission: "Free with paid admission",
  mixed_price_signals: "Mixed price wording",
  no_price_info: "No price info",
  paid_wording_only: "Paid wording, no price",
  cancelled_by_source: "Cancelled by source",
  uncancelled_by_source: "Un-cancelled by source",
  became_paid: "Became paid",
  missing_from_source: "Missing from source",
  reappeared: "Back on source",
  missing_title: "Missing title",
  missing_start_at: "Missing date",
  missing_location: "Missing location",
  missing_city: "Missing city",
  missing_primary_category: "Missing category",
  missing_source_url: "Missing source link",
};

export function reasonLabel(reason: string): string {
  if (reason.startsWith("possible_duplicate:")) return `Possible duplicate of ${reason.split(":")[1]}`;
  if (reason.startsWith("source_changed:")) return `Source changed: ${reason.split(":")[1]}`;
  if (reason.startsWith("updated_by_source:")) return `Updated by source: ${reason.split(":")[1]}`;
  return REASON_LABELS[reason] ?? reason;
}
