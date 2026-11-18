"use client";

import { useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import { collection, getDocs, getFirestore, limit, orderBy, query, Timestamp } from "firebase/firestore";
import { formatWhen } from "./admin-utils";

interface Run {
  id: string;
  status: "running" | "ok" | "partial";
  trigger: string;
  started_at: Timestamp;
  duration_ms?: number;
  expired?: number;
  pending_queue?: number;
  alerts?: string[];
  sources?: Record<string, { ok: boolean; fetched: number; created: number; updated: number; merged: number; classified_paid_hidden: number; error: string | null }>;
}

/** Recent pull runs with per-source counts (§7.8). */
export function RunsPanel({ app }: { app: FirebaseApp }) {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(collection(getFirestore(app), "pull_runs"), orderBy("started_at", "desc"), limit(15)))
      .then((snap) => setRuns(snap.docs.map((d) => ({ ...(d.data() as Run), id: d.id }))))
      .catch((e) => setError((e as Error).message));
  }, [app]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!runs) return <p className="text-muted">Loading…</p>;
  if (runs.length === 0) return <p className="rounded-2xl bg-surface-2 p-6 text-center text-muted">No runs yet.</p>;

  return (
    <ul className="space-y-3">
      {runs.map((run) => (
        <li key={run.id} className="rounded-2xl p-4 ring-1 ring-border">
          <p className="font-semibold">
            {formatWhen(run.started_at)} · {run.trigger}{" "}
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${run.status === "ok" ? "bg-free text-free-fg" : "bg-amber-100 text-amber-900"}`}>
              {run.status}
            </span>
          </p>
          <p className="text-xs text-muted">
            {run.duration_ms !== undefined && `${Math.round(run.duration_ms / 1000)}s · `}
            {run.expired ?? 0} expired · {run.pending_queue ?? 0} waiting for review
          </p>
          {run.sources && (
            <ul className="mt-2 space-y-0.5 text-xs">
              {Object.entries(run.sources).map(([id, s]) => (
                <li key={id} className={s.ok ? "" : "text-red-600"}>
                  <strong>{id}</strong>:{" "}
                  {s.ok
                    ? `${s.fetched} fetched, ${s.created} new, ${s.updated} updated, ${s.merged} merged, ${s.classified_paid_hidden} paid (hidden)`
                    : `failed: ${s.error}`}
                </li>
              ))}
            </ul>
          )}
          {run.alerts && run.alerts.length > 0 && <p className="mt-2 text-xs text-red-600">Alerts: {run.alerts.join("; ")}</p>}
        </li>
      ))}
    </ul>
  );
}
