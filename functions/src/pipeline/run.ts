/**
 * Nightly pull orchestrator (PROJECT_REQUIREMENTS.md §7).
 *
 *   sources → fetch (polite) → snapshot → normalize/classify/filter
 *     → collapse recurring series → dedupe → geocode → upsert to Firestore
 *     → flag events missing from their source → expire past events → log + alert
 *
 * Each source is processed independently; one failure never skips the rest (§7.1).
 */
import { createHash } from "node:crypto";
import { logger } from "firebase-functions";
import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";
import type { SourceConfig } from "../../../shared/event-model";
import {
  MISSING_RUNS_THRESHOLD,
  NO_END_GRACE_HOURS,
  PENDING_QUEUE_ALERT_THRESHOLD,
  RAW_SNAPSHOT_MAX_CHARS,
} from "../config";
import { isOver, mergePatch, newRecord, updateRecord, type Stored } from "./decide";
import { canonicalId, collapseSeries, dedupeKey, EventIndex } from "./dedupe";
import { fetchSource } from "./fetchers";
import { geocodeInValley, getGeocoder } from "./geocode";
import { PoliteHttp } from "./http";
import { normalize, type Candidate, type DropReason } from "./normalize";

export interface RunOptions {
  trigger: "schedule" | "manual";
  /** Run just this source (§7.1: "run one source without running all of them"). */
  sourceId?: string;
  requestedBy?: string;
  now?: Date;
}

export interface SourceStats {
  ok: boolean;
  error: string | null;
  fetched: number;
  dropped: Partial<Record<DropReason, number>>;
  collapsed_recurring: number;
  created: number;
  updated: number;
  merged: number;
  possible_duplicates: number;
  classified_free: number;
  classified_paid_hidden: number;
  pending_review: number;
  flagged_missing: number;
}

export interface RunSummary {
  run_id: string;
  trigger: RunOptions["trigger"];
  started_at: Date;
  finished_at: Date;
  duration_ms: number;
  sources: Record<string, SourceStats>;
  expired: number;
  pending_queue: number;
  write_errors: number;
  alerts: string[];
}

const EVENTS = "events";

function emptyStats(): SourceStats {
  return {
    ok: false, error: null, fetched: 0, dropped: {}, collapsed_recurring: 0, created: 0, updated: 0,
    merged: 0, possible_duplicates: 0, classified_free: 0, classified_paid_hidden: 0,
    pending_review: 0, flagged_missing: 0,
  };
}

/** Firestore Timestamps → Dates so records can be compared with candidates. */
export function toStored(id: string, data: DocumentData): Stored {
  const out: Record<string, unknown> = { ...data, id };
  for (const [k, v] of Object.entries(out)) if (v instanceof Timestamp) out[k] = v.toDate();
  return out as unknown as Stored;
}

/** Strips email addresses and phone numbers before keeping raw source text (§7.8). */
function redact(body: string): string {
  return body
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone]");
}

function alert(alerts: string[], kind: string, message: string, details: Record<string, unknown> = {}) {
  alerts.push(`${kind}: ${message}`);
  // Create a Cloud Monitoring log-based alert on jsonPayload.alert=true (see docs/FIREBASE_SETUP.md).
  logger.error(`ALERT ${kind}: ${message}`, { alert: true, alert_kind: kind, ...details });
}

export async function runPull(db: Firestore, options: RunOptions): Promise<RunSummary> {
  const now = options.now ?? new Date();
  const runRef = db.collection("pull_runs").doc();
  const alerts: string[] = [];
  const summary: RunSummary = {
    run_id: runRef.id, trigger: options.trigger, started_at: now, finished_at: now, duration_ms: 0,
    sources: {}, expired: 0, pending_queue: 0, write_errors: 0, alerts,
  };
  await runRef.set({
    status: "running", trigger: options.trigger, source_filter: options.sourceId ?? null,
    requested_by: options.requestedBy ?? null, started_at: now,
  });
  logger.info("pull_run_started", { run_id: runRef.id, trigger: options.trigger, source: options.sourceId ?? "all" });

  // --- Which sources -------------------------------------------------------
  const sourceDocs = options.sourceId
    ? [await db.collection("sources").doc(options.sourceId).get()]
    : (await db.collection("sources").where("enabled", "==", true).get()).docs;
  // A source switched off (e.g. permission withdrawn, FR-17) never runs, not even manually.
  const sources = sourceDocs
    .filter((d) => d.exists)
    .map((d) => ({ ...(d.data() as SourceConfig), id: d.id }))
    .filter((s) => s.enabled);
  if (options.sourceId && sources.length === 0) {
    alert(alerts, "source_unavailable", `Source "${options.sourceId}" does not exist or is disabled`);
  }
  if (!options.sourceId && sources.length === 0) {
    logger.warn("No enabled sources. Enable one in the curator tool after completing the §5.4 checklist.");
  }

  // --- Existing events to match against (recent + upcoming) -----------------
  const index = new EventIndex();
  const known = new Map<string, Stored>();
  const recent = await db
    .collection(EVENTS)
    .where("start_at", ">=", Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)))
    .get();
  for (const doc of recent.docs) {
    const e = toStored(doc.id, doc.data());
    known.set(e.id, e);
    index.add(e);
  }

  const writer = db.bulkWriter();
  writer.onWriteError((error) => {
    summary.write_errors++;
    logger.error("firestore_write_error", { path: error.documentRef.path, code: error.code, message: error.message });
    return error.failedAttempts < 3;
  });

  const http = new PoliteHttp();
  const geocoder = getGeocoder();

  // --- Each source ----------------------------------------------------------
  for (const source of sources) {
    const stats = emptyStats();
    summary.sources[source.id] = stats;
    const sourceRef = db.collection("sources").doc(source.id);
    const previous = (await sourceRef.get()).data() as { last_event_count?: number } | undefined;

    try {
      const fetched = await fetchSource(http, source, now);
      stats.fetched = fetched.events.length;

      // Raw snapshot so a bad parse can be debugged without re-fetching (§7.2).
      const body = redact(fetched.raw.body);
      writer.set(db.collection("raw_snapshots").doc(`${runRef.id}_${source.id}`), {
        run_id: runRef.id,
        source_id: source.id,
        url: fetched.raw.url,
        content_type: fetched.raw.contentType,
        fetched_at: fetched.raw.fetchedAt,
        sha256: createHash("sha256").update(fetched.raw.body).digest("hex"),
        bytes: fetched.raw.body.length,
        body: body.slice(0, RAW_SNAPSHOT_MAX_CHARS),
        truncated: body.length > RAW_SNAPSHOT_MAX_CHARS,
      });

      const candidates: Candidate[] = [];
      for (const raw of fetched.events) {
        const result = normalize(raw, source);
        if (result.kind === "drop") stats.dropped[result.reason] = (stats.dropped[result.reason] ?? 0) + 1;
        else candidates.push(result.candidate);
      }
      const { kept, collapsed } = collapseSeries(candidates, now);
      stats.collapsed_recurring = collapsed;

      const seenIds = new Set<string>();
      for (const c of kept) {
        if (c.is_free) stats.classified_free++;
        else stats.classified_paid_hidden++;

        // Geocode free events before they can go public; paid hidden ones can wait (§7.5).
        if (c.latitude === null && c.is_free) {
          const geo = await geocodeInValley(geocoder, c);
          if (geo.status === "ok") {
            c.latitude = geo.result.latitude;
            c.longitude = geo.result.longitude;
            c.review_reasons = c.review_reasons.filter((r) => r !== "needs_geocode");
          } else if (geo.status === "failed") {
            c.review_reasons = [...c.review_reasons.filter((r) => r !== "needs_geocode"), "geocode_failed"];
          }
        }

        const key = dedupeKey(c);
        const id = canonicalId({ ...c, dedupe_key: key });
        const match = index.find(c, key, id);
        let record: Stored;

        if (match.kind === "same_listing") {
          const existing = known.get(match.id) ?? toStored(match.id, (await db.collection(EVENTS).doc(match.id).get()).data() ?? {});
          const patch = updateRecord(existing, c, source, now);
          writer.update(db.collection(EVENTS).doc(match.id), patch);
          record = { ...existing, ...patch };
          stats.updated++;
          seenIds.add(match.id);
        } else if (match.kind === "duplicate") {
          const existing = known.get(match.id)!;
          const patch = mergePatch(existing, c, now);
          writer.update(db.collection(EVENTS).doc(match.id), patch);
          record = { ...existing, ...patch };
          stats.merged++;
          seenIds.add(match.id);
        } else {
          const extra = match.kind === "possible_duplicate" ? [`possible_duplicate:${match.id}`] : [];
          if (extra.length) stats.possible_duplicates++;
          record = newRecord(c, { id, dedupe_key: key }, now, extra, extra.length ? "low" : null);
          writer.set(db.collection(EVENTS).doc(id), record);
          stats.created++;
          seenIds.add(id);
        }
        if (record.status === "pending_review") stats.pending_review++;
        known.set(record.id, record);
        index.add(record);
      }

      // Events this source listed before but not tonight (§7.7): flag, never delete.
      const listed = await db
        .collection(EVENTS)
        .where("source_id", "==", source.id)
        .where("status", "in", ["published", "pending_review"])
        .get();
      for (const doc of listed.docs) {
        if (seenIds.has(doc.id)) continue;
        const e = toStored(doc.id, doc.data());
        if (e.start_at < now) continue; // already happened; expiry handles it
        const missing = (e.missing_runs ?? 0) + 1;
        const patch: Partial<Stored> = { missing_runs: missing, updated_at: now };
        if (missing >= MISSING_RUNS_THRESHOLD && !e.review_reasons.includes("missing_from_source")) {
          patch.needs_review = true;
          patch.review_reasons = [...e.review_reasons, "missing_from_source"];
          stats.flagged_missing++;
        }
        writer.update(doc.ref, patch);
      }

      stats.ok = true;
      writer.set(
        sourceRef,
        { last_run_at: now, last_success_at: now, last_error: null, last_event_count: stats.fetched },
        { merge: true },
      );
      if (stats.fetched === 0 && (previous?.last_event_count ?? 0) > 0) {
        alert(alerts, "source_empty", `${source.name} returned no events (it had ${previous?.last_event_count} last time)`, { source_id: source.id });
      }
    } catch (error) {
      stats.error = (error as Error).message;
      writer.set(sourceRef, { last_run_at: now, last_error: stats.error }, { merge: true });
      alert(alerts, "source_failed", `${source.name}: ${stats.error}`, { source_id: source.id });
    }
    logger.info("source_done", { run_id: runRef.id, source_id: source.id, ...stats });
  }

  // Finish source writes first so expiry never races an update to the same event.
  await writer.flush();

  // --- Expire past events (§7.7): status change, not deletion ---------------
  if (!options.sourceId) {
    const past = await db
      .collection(EVENTS)
      .where("status", "in", ["published", "pending_review", "cancelled"])
      .where("start_at", "<", Timestamp.fromDate(now))
      .get();
    for (const doc of past.docs) {
      const e = toStored(doc.id, doc.data());
      if (!isOver(e, now, NO_END_GRACE_HOURS)) continue;
      writer.update(doc.ref, { status: "expired", needs_review: false, updated_at: now });
      summary.expired++;
    }
  }

  await writer.close();

  // --- Health checks and run log (§7.8) --------------------------------------
  summary.pending_queue = (await db.collection(EVENTS).where("needs_review", "==", true).count().get()).data().count;
  if (summary.pending_queue > PENDING_QUEUE_ALERT_THRESHOLD) {
    alert(alerts, "queue_large", `${summary.pending_queue} events are waiting for review`);
  }
  if (summary.write_errors > 0) {
    alert(alerts, "write_errors", `${summary.write_errors} Firestore writes failed`);
  }

  summary.finished_at = new Date();
  summary.duration_ms = summary.finished_at.getTime() - now.getTime();
  await runRef.set(
    {
      status: Object.values(summary.sources).every((s) => s.ok) && summary.write_errors === 0 ? "ok" : "partial",
      finished_at: summary.finished_at,
      duration_ms: summary.duration_ms,
      sources: summary.sources,
      expired: summary.expired,
      pending_queue: summary.pending_queue,
      write_errors: summary.write_errors,
      alerts,
    },
    { merge: true },
  );
  // A log-based "absence" alert on this message catches a run that never happens (§7.8).
  logger.info("pull_run_completed", { run_id: runRef.id, duration_ms: summary.duration_ms, alerts: alerts.length });
  return summary;
}
