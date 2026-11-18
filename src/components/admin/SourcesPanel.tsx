"use client";

import { useCallback, useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { SourceConfig } from "@shared/event-model";
import { formatWhen } from "./admin-utils";

type SourceRow = SourceConfig & {
  last_run_at?: Timestamp;
  last_success_at?: Timestamp;
  last_error?: string | null;
  last_event_count?: number;
};

/** Source registry: switch sources on/off quickly (FR-17) and run the pull on demand (§7.1). */
export function SourcesPanel({ app }: { app: FirebaseApp }) {
  const [sources, setSources] = useState<SourceRow[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const db = getFirestore(app);

  const load = useCallback(async () => {
    const snap = await getDocs(collection(db, "sources"));
    setSources(snap.docs.map((d) => ({ ...(d.data() as SourceRow), id: d.id })).sort((a, b) => a.name.localeCompare(b.name)));
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((e) => setMessage((e as Error).message));
  }, [load]);

  async function toggle(source: SourceRow) {
    if (!source.enabled && !source.terms_checked_at) {
      const ok = window.confirm(
        `${source.name} has no terms/robots.txt check recorded. Only enable it after the source onboarding checklist (docs/FIREBASE_SETUP.md). Enable anyway?`,
      );
      if (!ok) return;
    }
    await updateDoc(doc(db, "sources", source.id), { enabled: !source.enabled, updated_at: serverTimestamp() });
    await load();
  }

  async function runNow(sourceId?: string) {
    setBusy(sourceId ?? "all");
    setMessage(null);
    try {
      const call = httpsCallable<{ sourceId?: string }, { run_id: string; alerts: string[]; pending_queue: number }>(
        getFunctions(app),
        "runPullNow",
        { timeout: 30 * 60 * 1000 },
      );
      const { data } = await call(sourceId ? { sourceId } : {});
      setMessage(
        `Run ${data.run_id} finished. ${data.pending_queue} waiting for review.` +
          (data.alerts.length ? ` Alerts: ${data.alerts.join("; ")}` : ""),
      );
      await load();
    } catch (e) {
      setMessage(`Run failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  if (!sources) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {sources.filter((s) => s.enabled).length} of {sources.length} sources enabled. The pull runs every night
          shortly after midnight (Phoenix).
        </p>
        <button type="button" disabled={busy !== null} onClick={() => runNow()} className="bg-brand rounded-full px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-50">
          {busy === "all" ? "Running…" : "Run full pull now"}
        </button>
      </div>
      {message && <p className="mb-4 rounded-2xl bg-surface-2 p-3 text-sm">{message}</p>}

      {sources.length === 0 ? (
        <p className="rounded-2xl bg-surface-2 p-6 text-center text-muted">
          No sources yet. Run <code>npm run seed-sources</code> in <code>functions/</code> to add the candidates.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl ring-1 ring-border">
          {sources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {s.name}{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.enabled ? "bg-free text-free-fg" : "bg-surface-2 text-muted"}`}>
                    {s.enabled ? "ON" : "OFF"}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  <a href={s.homepage_url} target="_blank" rel="noopener noreferrer" className="underline">
                    {s.homepage_url}
                  </a>{" "}
                  · {s.method.toUpperCase()} {s.feed_url ? "" : "· no feed URL yet"}
                </p>
                <p className="text-xs text-muted">
                  Last run: {s.last_run_at ? formatWhen(s.last_run_at) : "never"}
                  {s.last_event_count !== undefined && ` · ${s.last_event_count} events`}
                  {s.last_error && <span className="text-red-600"> · Error: {s.last_error}</span>}
                </p>
                {s.notes && <p className="mt-1 text-xs text-muted">{s.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => toggle(s)} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:bg-border">
                  {s.enabled ? "Turn off" : "Turn on"}
                </button>
                <button
                  type="button"
                  disabled={!s.enabled || busy !== null}
                  onClick={() => runNow(s.id)}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:bg-border disabled:opacity-40"
                >
                  {busy === s.id ? "Running…" : "Run now"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
