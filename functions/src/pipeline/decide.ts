/**
 * Workflow decisions: how a candidate becomes a stored record, and how an update
 * from the source changes an existing one (§7.6, §7.7). Pure functions, so the rules
 * can be read and tested in one place.
 *
 * Rules (proposed in the requirements; founders should confirm, open question 4):
 * - A first-seen free event always goes to the curator queue (pending_review).
 * - A paid event is NEVER public: is_free=false, visibility=hidden. High-confidence
 *   paid events are stored quietly (status "published" + hidden = accepted into the
 *   hidden catalog for a possible future release); uncertain ones go to review.
 * - Routine updates to an already-published free event stay published when the
 *   classification is still clean.
 * - Anything that adds doubt (ambiguous price, missing fields, source cancellation,
 *   becoming paid) is flagged or pulled back for review. Nothing is hard-deleted.
 * - Curator edits are never overwritten by the source; changes are flagged instead.
 */
import type { EventRecord, EventStatus, SourceConfig, Visibility } from "../../../shared/event-model";
import type { Candidate } from "./normalize";

export type Stored = EventRecord<Date>;

/** Reasons that make an event unfit to stay public until a person checks it. */
const BLOCKING = /^(suggested_donation|resident_only_free|member_only_free|registration_required|free_with_paid_admission|mixed_price_signals|no_price_info|paid_wording_only|no_category|missing_.*|possible_duplicate.*)$/;

/** Reasons that are informational only. */
const NON_BLOCKING = new Set(["needs_geocode", "low_confidence_category"]);

function isBlocking(reason: string): boolean {
  return BLOCKING.test(reason);
}

function unique(list: string[]): string[] {
  return [...new Set(list)];
}

function sourceFields(c: Candidate) {
  return {
    title: c.title,
    description: c.description,
    start_at: c.start_at,
    end_at: c.end_at,
    all_day: c.all_day,
    timezone: c.timezone,
    recurrence_note: c.recurrence_note,
    recurrence_rule: c.recurrence_rule,
    venue_name: c.venue_name,
    address: c.address,
    city: c.city,
    state: c.state,
    postal_code: c.postal_code,
    primary_category: c.primary_category,
    tags: c.tags,
    is_free: c.is_free,
    price_note: c.price_note,
    organizer_name: c.organizer_name,
    image_url: c.image_url,
    source_name: c.source_name,
    source_url: c.source_url,
    confidence_free: c.confidence_free,
  };
}

export function newRecord(
  c: Candidate,
  ids: { id: string; dedupe_key: string },
  now: Date,
  extraReasons: string[] = [],
  duplicateConfidence: Stored["confidence_duplicate"] = null,
): Stored {
  const reasons = unique([...c.review_reasons, ...extraReasons]);
  const paid = !c.is_free;
  const quietPaid = paid && c.confidence_free !== "low" && !reasons.some(isBlocking);

  let status: EventStatus;
  let needsReview: boolean;
  let visibility: Visibility = paid ? "hidden" : "public";
  if (c.cancelled) {
    // Never reviewed, so never shown, but kept as a record.
    status = "cancelled";
    visibility = "hidden";
    needsReview = false;
  } else if (quietPaid) {
    status = "published";
    needsReview = false;
  } else {
    status = "pending_review";
    needsReview = true;
    reasons.push("first_seen");
  }

  return {
    id: ids.id,
    ...sourceFields(c),
    latitude: c.latitude,
    longitude: c.longitude,
    geocode_status: c.latitude !== null ? "source_provided" : "pending",
    area: null,
    visibility,
    audience_note: null,
    status,
    cancelled: c.cancelled,
    source_id: c.source_id,
    source_event_id: c.source_event_id,
    additional_sources: [],
    dedupe_key: ids.dedupe_key,
    confidence_duplicate: duplicateConfidence,
    needs_review: needsReview,
    review_reasons: unique(reasons),
    curator_note: null,
    curated_by: null,
    curated_at: null,
    merged_into: null,
    first_seen_at: now,
    last_seen_at: now,
    missing_runs: 0,
    created_at: now,
    updated_at: now,
  };
}

const SIGNIFICANT: (keyof Candidate & keyof Stored)[] = [
  "title", "start_at", "end_at", "venue_name", "address", "city", "is_free", "cancelled",
];

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return (a ?? null) === (b ?? null);
}

export function changedFields(existing: Stored, c: Candidate): string[] {
  return SIGNIFICANT.filter((f) => !sameValue(existing[f], c[f]));
}

/** Patch for an existing record seen again in this run (same listing). */
export function updateRecord(existing: Stored, c: Candidate, source: SourceConfig, now: Date): Partial<Stored> {
  const seen: Partial<Stored> = { last_seen_at: now, missing_runs: 0, updated_at: now };

  // Rejected or merged records stay that way; just note we saw them.
  if (existing.status === "rejected" || existing.merged_into) return seen;

  const changed = changedFields(existing, c);
  const reasons = existing.review_reasons.filter((r) => r !== "missing_from_source");
  const flag = (reason: string) => {
    reasons.push(reason);
    return { needs_review: true, review_reasons: unique(reasons) };
  };

  // Safety first: a source cancellation or a switch to paid applies immediately.
  if (c.cancelled && !existing.cancelled) {
    return { ...seen, status: "cancelled", cancelled: true, ...flag("cancelled_by_source") };
  }
  if (!c.is_free && existing.is_free && c.confidence_free !== "low") {
    return { ...seen, is_free: false, visibility: "hidden", price_note: c.price_note, ...flag("became_paid") };
  }

  // A curator has worked on this record: don't overwrite their edits.
  if (existing.curated_by) {
    const onlyNextOccurrence =
      existing.recurrence_note && changed.every((f) => f === "start_at" || f === "end_at");
    if (onlyNextOccurrence) return { ...seen, start_at: c.start_at, end_at: c.end_at };
    if (changed.length === 0) return seen;
    return { ...seen, ...flag(`source_changed:${changed.join(",")}`) };
  }

  // Not curated yet: take the source's latest values, keeping anything the source dropped.
  const patch: Partial<Stored> = {
    ...seen,
    ...sourceFields(c),
    primary_category: c.primary_category ?? existing.primary_category,
    latitude: c.latitude ?? existing.latitude,
    longitude: c.longitude ?? existing.longitude,
    geocode_status: c.latitude !== null ? "source_provided" : existing.geocode_status,
    visibility: c.is_free ? existing.visibility : "hidden",
  };

  const newReasons = unique([...c.review_reasons, ...reasons.filter((r) => r.startsWith("possible_duplicate"))]);
  const blocking = newReasons.filter(isBlocking);

  if (existing.status === "cancelled" && !c.cancelled) {
    return { ...patch, status: "pending_review", cancelled: false, needs_review: true, review_reasons: unique([...newReasons, "uncancelled_by_source"]) };
  }

  if (existing.status === "published" && existing.visibility === "public") {
    if (blocking.length > 0) {
      // Doubt was introduced: take it out of the public list until reviewed (NFR-3).
      return { ...patch, status: "pending_review", needs_review: true, review_reasons: newReasons };
    }
    const fyi = source.review_policy === "review" && changed.length > 0;
    return {
      ...patch,
      needs_review: fyi || existing.needs_review,
      review_reasons: fyi ? unique([...newReasons.filter((r) => NON_BLOCKING.has(r)), `updated_by_source:${changed.join(",")}`]) : newReasons,
    };
  }

  if (existing.status === "expired") {
    // Back on the source with a future date (e.g. a series resumed): review again.
    return { ...patch, status: "pending_review", needs_review: true, review_reasons: unique([...newReasons, "reappeared"]) };
  }

  // pending_review or hidden paid: refresh reasons, keep status.
  const stillQuietPaid = !c.is_free && existing.status === "published" && blocking.length === 0;
  return {
    ...patch,
    needs_review: stillQuietPaid ? false : existing.needs_review || blocking.length > 0,
    review_reasons: stillQuietPaid ? newReasons : unique([...newReasons, ...(existing.status === "pending_review" ? ["first_seen"] : [])]),
  };
}

/** Patch that merges a second source's listing into an existing canonical event (§7.4). */
export function mergePatch(existing: Stored, c: Candidate, now: Date): Partial<Stored> {
  const link = { name: c.source_name, url: c.source_url, source_id: c.source_id, source_event_id: c.source_event_id };
  const known = [existing, ...existing.additional_sources].some(
    (s) => s.source_id === c.source_id && (s.source_event_id ?? null) === (c.source_event_id ?? null),
  );
  // Fill gaps from the new source, but never replace what's there (official sources tend to arrive first).
  const fill = <K extends keyof Stored & keyof Candidate>(key: K) =>
    existing[key] === null && c[key] !== null ? { [key]: c[key] } : {};
  return {
    ...(known ? {} : { additional_sources: [...existing.additional_sources, link] }),
    ...fill("description"),
    ...fill("venue_name"),
    ...fill("address"),
    ...fill("postal_code"),
    ...fill("organizer_name"),
    ...fill("end_at"),
    ...(existing.latitude === null && c.latitude !== null
      ? { latitude: c.latitude, longitude: c.longitude, geocode_status: "source_provided" as const }
      : {}),
    confidence_duplicate: "high",
    last_seen_at: now,
    missing_runs: 0,
    updated_at: now,
  };
}

/** Has the event finished? End-less events get a grace period (§7.7). */
export function isOver(e: Pick<Stored, "start_at" | "end_at">, now: Date, graceHours: number): boolean {
  const end = e.end_at ?? new Date(e.start_at.getTime() + graceHours * 60 * 60 * 1000);
  return end.getTime() < now.getTime();
}
