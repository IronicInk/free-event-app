"use client";

import { useCallback, useEffect, useState } from "react";
import type { FirebaseApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { getCategory } from "@/lib/categories";
import { formatWhen, reasonLabel, type AdminEvent } from "./admin-utils";
import { EventEditor } from "./EventEditor";

export type QueueTab = "review" | "published" | "hidden" | "closed";

const QUERIES: Record<QueueTab, QueryConstraint[]> = {
  review: [where("needs_review", "==", true), orderBy("start_at")],
  published: [where("status", "==", "published"), orderBy("start_at")],
  hidden: [where("visibility", "==", "hidden"), orderBy("start_at")],
  closed: [where("status", "in", ["rejected", "cancelled"]), orderBy("start_at")],
};

const EMPTY: Record<QueueTab, string> = {
  review: "Nothing waiting for review. 🎉",
  published: "No published events yet.",
  hidden: "No hidden events. Paid events found by the pull will appear here.",
  closed: "No rejected or cancelled events.",
};

export function EventQueue({ app, tab, uid }: { app: FirebaseApp; tab: QueueTab; uid: string }) {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const snap = await getDocs(query(collection(getFirestore(app), "events"), ...QUERIES[tab], limit(200)));
      let list = snap.docs.map((d) => ({ ...(d.data() as AdminEvent), id: d.id }));
      // "Published" means publicly listed; paid events that are published-but-hidden live in their own tab.
      if (tab === "published") list = list.filter((e) => e.visibility === "public");
      setEvents(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [app, tab]);

  useEffect(() => {
    // Loading from Firestore is an external system sync, so setting state here is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) return <p className="text-sm text-red-600">Couldn&apos;t load events: {error}</p>;
  if (!events) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted">
          {events.length} event{events.length === 1 ? "" : "s"}
          {events.length === 200 ? " (first 200)" : ""}
        </span>
        <button type="button" onClick={load} className="font-semibold hover:underline">
          Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl bg-surface-2 p-6 text-center text-muted">{EMPTY[tab]}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl ring-1 ring-border">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === event.id ? null : event.id)}
                aria-expanded={openId === event.id}
                className="flex w-full flex-wrap items-start justify-between gap-2 px-4 py-3 text-left hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{event.title}</span>
                  <span className="block text-xs text-muted">
                    {formatWhen(event.start_at)} · {event.city ?? "No city"} · {event.source_name}
                    {event.primary_category ? ` · ${getCategory(event.primary_category).label}` : ""}
                  </span>
                  {event.review_reasons.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {event.review_reasons.map((r) => (
                        <span key={r} className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                          {reasonLabel(r)}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 gap-1 text-[11px] font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${event.is_free ? "bg-free text-free-fg" : "bg-fg text-bg"}`}>
                    {event.is_free ? "FREE" : "PAID"}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 uppercase">{event.status.replace("_", " ")}</span>
                </span>
              </button>
              {openId === event.id && (
                <EventEditor
                  app={app}
                  event={event}
                  uid={uid}
                  onDone={() => {
                    setOpenId(null);
                    void load();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
