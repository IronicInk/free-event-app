/**
 * De-duplication (§7.4). Proposed match signals, strongest first:
 *  1. source name + source-native ID
 *  2. normalized title + place + start date
 *  3. nearby coordinates + same day + similar title  → "possible duplicate", sent to review
 *  4. recurring-series identity for weekly markets and similar
 * Tune on real data; uncertain matches are never merged silently.
 */
import { createHash } from "node:crypto";
import type { Candidate } from "./normalize";

const STOPWORDS = new Set(["the", "a", "an", "and", "of", "at", "in", "on", "for", "to", "with", "free", "annual", "presents"]);

export function normalizeText(text: string | null): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function titleTokens(title: string): Set<string> {
  return new Set(normalizeText(title).split(" ").filter((t) => t && !STOPWORDS.has(t)));
}

export function titleSimilarity(a: string, b: string): number {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

/** "2026-11-21" in Phoenix (UTC-7, no DST). */
export function phoenixDay(date: Date): string {
  return new Date(date.getTime() - 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function placeKey(c: Pick<Candidate, "venue_name" | "address" | "city">): string {
  return normalizeText(c.venue_name ?? c.address ?? c.city ?? "");
}

export function dedupeKey(c: Pick<Candidate, "title" | "venue_name" | "address" | "city" | "start_at">): string {
  return [[...titleTokens(c.title)].sort().join(" "), placeKey(c), phoenixDay(c.start_at)].join("|");
}

export function sourceKey(sourceId: string, sourceEventId: string | null): string | null {
  return sourceEventId ? `${sourceId}:${sourceEventId}` : null;
}

/** Stable, readable document ID: "downtown-farmers-market-3f9a1c2b7d". */
export function canonicalId(c: Pick<Candidate, "title" | "source_id" | "source_event_id"> & { dedupe_key: string }): string {
  const identity = c.source_event_id ? `${c.source_id}:${c.source_event_id}` : `${c.source_id}|${c.dedupe_key}`;
  const hash = createHash("sha1").update(identity).digest("hex").slice(0, 10);
  const slug = normalizeText(c.title).replace(/ /g, "-").slice(0, 50).replace(/-+$/, "");
  return `${slug || "event"}-${hash}`;
}

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// Recurring series (§5.2, §7.4): many calendars list every Saturday market
// separately. Collapse those into one record for the next occurrence.
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function collapseSeries(candidates: Candidate[], now: Date): { kept: Candidate[]; collapsed: number } {
  const groups = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const key = `${c.source_id}|${[...titleTokens(c.title)].sort().join(" ")}|${placeKey(c)}`;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const kept: Candidate[] = [];
  let collapsed = 0;
  for (const [key, list] of groups) {
    if (list.length < 3 || list.some((c) => c.recurrence_rule)) {
      kept.push(...list);
      continue;
    }
    const sorted = [...list].sort((a, b) => a.start_at.getTime() - b.start_at.getTime());
    const shifted = (d: Date) => new Date(d.getTime() - 7 * 60 * 60 * 1000);
    const weekdays = new Set(sorted.map((c) => shifted(c.start_at).getUTCDay()));
    const next = sorted.find((c) => (c.end_at ?? c.start_at) >= now) ?? sorted[sorted.length - 1];
    kept.push({
      ...next,
      // A stable ID for the whole series, so next week's pull updates the same record.
      source_event_id: `series:${createHash("sha1").update(key).digest("hex").slice(0, 12)}`,
      recurrence_note:
        next.recurrence_note ??
        (weekdays.size === 1 ? `Weekly on ${WEEKDAYS[[...weekdays][0]]}s` : `Repeats (${sorted.length} upcoming dates listed)`),
    });
    collapsed += list.length - 1;
  }
  return { kept, collapsed };
}

// ---------------------------------------------------------------------------
// Matching against existing records
// ---------------------------------------------------------------------------

export interface IndexedEvent {
  id: string;
  title: string;
  start_at: Date;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  dedupe_key: string | null;
  source_id: string;
  source_event_id: string | null;
  additional_sources: { name: string; url: string; source_event_id?: string | null; source_id?: string }[];
}

export type Match =
  | { kind: "same_listing"; id: string }
  | { kind: "duplicate"; id: string }
  | { kind: "possible_duplicate"; id: string }
  | { kind: "none" };

export class EventIndex {
  private ids = new Set<string>();
  private bySourceKey = new Map<string, string>();
  private byDedupeKey = new Map<string, string>();
  private byDay = new Map<string, IndexedEvent[]>();

  add(e: IndexedEvent) {
    this.ids.add(e.id);
    const own = sourceKey(e.source_id, e.source_event_id);
    if (own) this.bySourceKey.set(own, e.id);
    for (const extra of e.additional_sources) {
      const key = extra.source_id ? sourceKey(extra.source_id, extra.source_event_id ?? null) : null;
      if (key) this.bySourceKey.set(key, e.id);
    }
    if (e.dedupe_key) this.byDedupeKey.set(e.dedupe_key, e.id);
    const day = phoenixDay(e.start_at);
    const list = this.byDay.get(day) ?? [];
    list.push(e);
    this.byDay.set(day, list);
  }

  find(c: Candidate, key: string, ownId: string): Match {
    // The document ID is derived from the source identity, so a known ID = the same listing.
    if (this.ids.has(ownId)) return { kind: "same_listing", id: ownId };
    // ...or one that was merged into another event earlier.
    const sk = sourceKey(c.source_id, c.source_event_id);
    const bySource = sk ? this.bySourceKey.get(sk) : undefined;
    if (bySource) return { kind: "same_listing", id: bySource };

    const exact = this.byDedupeKey.get(key);
    if (exact) {
      const existing = (this.byDay.get(phoenixDay(c.start_at)) ?? []).find((e) => e.id === exact);
      // Same title/place/day from a *different* source = the same event (merge).
      // From the same source, two listings are probably two events: let a person decide.
      if (existing && existing.source_id !== c.source_id) return { kind: "duplicate", id: exact };
      return { kind: "possible_duplicate", id: exact };
    }

    for (const e of this.byDay.get(phoenixDay(c.start_at)) ?? []) {
      if (e.id === ownId) continue;
      const similar = titleSimilarity(e.title, c.title) >= 0.5;
      if (!similar) continue;
      const near =
        e.latitude !== null && e.longitude !== null && c.latitude !== null && c.longitude !== null
          ? milesBetween({ lat: e.latitude, lng: e.longitude }, { lat: c.latitude, lng: c.longitude }) <= 0.5
          : e.city !== null && e.city === c.city;
      if (near) return { kind: "possible_duplicate", id: e.id };
    }
    return { kind: "none" };
  }
}
