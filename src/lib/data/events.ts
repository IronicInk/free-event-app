/**
 * Server-side event loading. The ONLY place the web app reads the catalog.
 *
 * - Firebase configured → reads public events from Firestore. The query matches
 *   firestore.rules exactly (public + free + published/cancelled), so the rules
 *   would refuse anything broader.
 * - Not configured → built-in sample data, filtered through the same rule.
 *
 * Results are cached for an hour; the catalog only changes once a night (§7)
 * plus curator edits.
 */
import { cacheLife, cacheTag } from "next/cache";
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore/lite";
import { PUBLIC_STATUSES } from "@shared/event-model";
import { SAMPLE_EVENT_RECORDS } from "@/data/sample-events";
import type { FreeEvent } from "@/lib/types";
import { getFirebaseConfig } from "./firebase-config";
import { toPublicEvent, type StoredEvent } from "./to-public-event";

/** Upper bound for one catalog read. Raise it (or paginate) as coverage grows. */
const MAX_EVENTS = 1000;

function db() {
  const config = getFirebaseConfig();
  if (!config) return null;
  const app = getApps().length ? getApp() : initializeApp(config);
  return getFirestore(app);
}

/** Firestore Timestamps → ISO strings, so records are plain serializable data. */
function fromFirestore(id: string, data: Record<string, unknown>): StoredEvent {
  const out: Record<string, unknown> = { ...data, id };
  for (const [key, value] of Object.entries(out)) {
    if (value instanceof Timestamp) out[key] = value.toDate().toISOString();
  }
  return out as unknown as StoredEvent;
}

function publicOnly(records: StoredEvent[]): FreeEvent[] {
  return records.map(toPublicEvent).filter((e): e is FreeEvent => e !== null);
}

/** Every publicly readable event (including cancelled ones, which UIs label or hide). */
export async function getPublicEvents(): Promise<FreeEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("events");

  const firestore = db();
  if (!firestore) return publicOnly(SAMPLE_EVENT_RECORDS);

  const snapshot = await getDocs(
    query(
      collection(firestore, "events"),
      where("visibility", "==", "public"),
      where("is_free", "==", true),
      where("status", "in", [...PUBLIC_STATUSES]),
      orderBy("start_at"),
      limit(MAX_EVENTS),
    ),
  );
  return publicOnly(snapshot.docs.map((d) => fromFirestore(d.id, d.data())));
}

export async function getPublicEventById(id: string): Promise<FreeEvent | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("events", `event:${id}`);

  const firestore = db();
  if (!firestore) {
    const record = SAMPLE_EVENT_RECORDS.find((r) => r.id === id);
    return record ? toPublicEvent(record) : null;
  }

  try {
    const snap = await getDoc(doc(firestore, "events", id));
    return snap.exists() ? toPublicEvent(fromFirestore(snap.id, snap.data())) : null;
  } catch (error) {
    // Security rules deny reads of hidden/paid/pending events: treat as "not found".
    if ((error as { code?: string }).code === "permission-denied") return null;
    throw error;
  }
}
