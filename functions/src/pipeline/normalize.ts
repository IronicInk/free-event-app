/**
 * Raw source record → normalized candidate (§7.3 steps 2–5).
 * Pure function: no network, no database. Easy to test (see functions/test/).
 */
import {
  VALLEY_CITIES,
  VALLEY_TIMEZONE,
  isInsideValley,
  missingPublishFields,
  type CategoryId,
  type Confidence,
  type SourceConfig,
  type ValleyCity,
} from "../../../shared/event-model";
import { classifyPrice, exclusionReason, guessCategory, guessTags, type ExclusionReason } from "./classify";
import type { RawEvent } from "./types";

export type DropReason = ExclusionReason | "out_of_area" | "no_title_or_date";

/** The source-derived part of an event record (bookkeeping is added when storing). */
export interface Candidate {
  title: string;
  description: string | null;
  start_at: Date;
  end_at: Date | null;
  all_day: boolean;
  timezone: string;
  recurrence_note: string | null;
  recurrence_rule: string | null;
  venue_name: string | null;
  address: string | null;
  city: ValleyCity | null;
  state: "AZ";
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  primary_category: CategoryId | null;
  tags: string[];
  is_free: boolean;
  price_note: string | null;
  cancelled: boolean;
  organizer_name: string | null;
  image_url: string | null;
  source_id: string;
  source_name: string;
  source_url: string;
  source_event_id: string | null;
  confidence_free: Confidence;
  /** Why a curator must look at this (empty = nothing found by the automatic checks). */
  review_reasons: string[];
}

export type NormalizeResult = { kind: "drop"; reason: DropReason } | { kind: "keep"; candidate: Candidate };

const MAX_DESCRIPTION = 2000;

/** Strips HTML, decodes the common entities, collapses whitespace. */
export function plainText(input: string | null): string | null {
  if (!input) return null;
  const text = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return null;
  return text.length > MAX_DESCRIPTION ? `${text.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…` : text;
}

/** Removes status prefixes the source put in the title ("CANCELLED: Movie Night"). */
export function cleanTitle(title: string): string {
  return title
    .replace(/^\s*[[(]?\s*(cancel(l)?ed|postponed|rescheduled|updated?|new)\s*[\])]?\s*[:\-–—|]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CITY_LOOKUP = new Map(VALLEY_CITIES.map((c) => [c.toLowerCase(), c]));

export interface ParsedLocation {
  venue_name: string | null;
  address: string | null;
  city: ValleyCity | null;
  postal_code: string | null;
  /** A city named in the text that is NOT in the Valley list (e.g. "Tucson"). */
  outsideCity: string | null;
}

/**
 * Splits "Venue, 123 Main St, Tempe, AZ 85281" into parts.
 * Heuristic: the first comma part without a street number is the venue.
 */
export function parseLocation(text: string | null): ParsedLocation {
  const empty = { venue_name: null, address: null, city: null, postal_code: null, outsideCity: null };
  if (!text) return empty;
  const clean = text.replace(/\s+/g, " ").trim();
  const postal = /\b(8[5-6]\d{3})(?:-\d{4})?\b/.exec(clean)?.[1] ?? null;

  // "<City>, AZ" (or "Arizona").
  const stateMatch = /([A-Za-z .'-]+?),?\s+(?:AZ|Arizona)\b/i.exec(clean);
  const namedCity = stateMatch?.[1].split(",").pop()?.trim() ?? null;

  let city: ValleyCity | null = null;
  let outsideCity: string | null = null;
  if (namedCity) {
    city = CITY_LOOKUP.get(namedCity.toLowerCase()) ?? null;
    if (!city) outsideCity = namedCity;
  }
  if (!city && !outsideCity) {
    // No "City, AZ": look for any Valley city name in the text.
    const lower = clean.toLowerCase();
    const hit = [...CITY_LOOKUP.keys()]
      .sort((a, b) => b.length - a.length)
      .find((name) => new RegExp(`\\b${name}\\b`).test(lower));
    city = hit ? CITY_LOOKUP.get(hit)! : null;
  }

  const parts = clean.split(",").map((p) => p.trim()).filter(Boolean);
  const first = parts[0] ?? "";
  const startsWithNumber = /^\d/.test(first);
  const venue_name = parts.length > 1 && !startsWithNumber ? first : !startsWithNumber && parts.length === 1 ? first : null;
  const addressParts = venue_name ? parts.slice(1) : parts;
  const address = addressParts.length ? addressParts.join(", ") : null;

  return { venue_name, address, city, postal_code: postal, outsideCity };
}

export function normalize(raw: RawEvent, source: SourceConfig): NormalizeResult {
  const title = cleanTitle(raw.title ?? "");
  if (!title || !raw.start) return { kind: "drop", reason: "no_title_or_date" };

  const description = plainText(raw.description);
  const textFields = { title, description, categories: raw.categories, location_text: raw.location_text };

  const excluded = exclusionReason(textFields);
  if (excluded) return { kind: "drop", reason: excluded };

  // Geography (§7.3 step 4).
  const location = parseLocation(raw.location_text);
  const hasCoords = raw.latitude !== null && raw.longitude !== null;
  if (hasCoords && !isInsideValley(raw.latitude!, raw.longitude!)) return { kind: "drop", reason: "out_of_area" };
  if (location.outsideCity) return { kind: "drop", reason: "out_of_area" };
  const city = location.city ?? source.default_city;

  const reviewReasons: string[] = [];

  const price = classifyPrice({ title, description, price_text: raw.price_text, categories: raw.categories });
  if (price.review_reason) reviewReasons.push(price.review_reason);

  const category = guessCategory(textFields);
  if (category.category === null) reviewReasons.push("no_category");
  else if (category.confidence === "low") reviewReasons.push("low_confidence_category");

  if (!hasCoords) reviewReasons.push("needs_geocode");
  if (raw.cancelled) reviewReasons.push("cancelled_by_source");

  const candidate: Candidate = {
    title,
    description,
    start_at: raw.start,
    end_at: raw.end && raw.end > raw.start ? raw.end : null,
    all_day: raw.all_day,
    timezone: VALLEY_TIMEZONE,
    recurrence_note: raw.recurrence_note,
    recurrence_rule: raw.recurrence_rule,
    venue_name: location.venue_name,
    address: location.address,
    city,
    state: "AZ",
    postal_code: location.postal_code,
    latitude: hasCoords ? raw.latitude : null,
    longitude: hasCoords ? raw.longitude : null,
    primary_category: category.category,
    tags: guessTags(textFields),
    is_free: price.is_free,
    price_note: price.note ? plainText(price.note)!.slice(0, 300) : null,
    cancelled: raw.cancelled,
    organizer_name: raw.organizer,
    image_url: raw.image_url,
    source_id: source.id,
    source_name: source.name,
    // FR-7: every event keeps a link back. Fall back to the source's own page.
    source_url: raw.url ?? source.homepage_url,
    source_event_id: raw.source_event_id,
    confidence_free: price.confidence,
    review_reasons: reviewReasons,
  };

  for (const field of missingPublishFields(candidate)) reviewReasons.push(`missing_${field}`);

  return { kind: "keep", candidate };
}
