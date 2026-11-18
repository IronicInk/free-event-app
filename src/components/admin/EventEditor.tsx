"use client";

import { useState } from "react";
import type { FirebaseApp } from "firebase/app";
import {
  arrayUnion,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type UpdateData,
} from "firebase/firestore";
import {
  CATEGORY_IDS,
  VALLEY_CITIES,
  isCategoryId,
  isValleyCity,
  missingPublishFields,
} from "@shared/event-model";
import { getCategory } from "@/lib/categories";
import { fromPhoenixInput, toPhoenixInput, type AdminEvent } from "./admin-utils";

interface Props {
  app: FirebaseApp;
  event: AdminEvent;
  uid: string;
  onDone: () => void;
}

/** The fields a curator can edit in the form. */
function formFrom(e: AdminEvent) {
  return {
    title: e.title,
    description: e.description ?? "",
    start_at: toPhoenixInput(e.start_at),
    end_at: toPhoenixInput(e.end_at),
    all_day: e.all_day,
    recurrence_note: e.recurrence_note ?? "",
    venue_name: e.venue_name ?? "",
    address: e.address ?? "",
    city: e.city ?? "",
    latitude: e.latitude?.toString() ?? "",
    longitude: e.longitude?.toString() ?? "",
    primary_category: e.primary_category ?? "",
    tags: e.tags.join(", "),
    is_free: e.is_free,
    price_note: e.price_note ?? "",
    audience_note: e.audience_note ?? "",
    organizer_name: e.organizer_name ?? "",
    curator_note: e.curator_note ?? "",
  };
}
type Form = ReturnType<typeof formFrom>;

const orNull = (s: string) => (s.trim() ? s.trim() : null);
const numOrNull = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : null);

function toFields(f: Form, original: AdminEvent): UpdateData<AdminEvent> {
  const lat = numOrNull(f.latitude);
  const lng = numOrNull(f.longitude);
  const hasCoords = lat !== null && lng !== null;
  return {
    title: f.title.trim(),
    description: orNull(f.description),
    start_at: fromPhoenixInput(f.start_at)!,
    end_at: fromPhoenixInput(f.end_at),
    all_day: f.all_day,
    recurrence_note: orNull(f.recurrence_note),
    venue_name: orNull(f.venue_name),
    address: orNull(f.address),
    city: isValleyCity(f.city) ? f.city : null,
    latitude: hasCoords ? lat : null,
    longitude: hasCoords ? lng : null,
    geocode_status: !hasCoords
      ? "pending"
      : original.geocode_status === "source_provided" && lat === original.latitude && lng === original.longitude
        ? "source_provided"
        : "ok",
    primary_category: isCategoryId(f.primary_category) ? f.primary_category : null,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    is_free: f.is_free,
    price_note: orNull(f.price_note),
    audience_note: orNull(f.audience_note),
    organizer_name: orNull(f.organizer_name),
    curator_note: orNull(f.curator_note),
  };
}

export function EventEditor({ app, event, uid, onDone }: Props) {
  const [form, setForm] = useState(() => formFrom(event));
  const [mergeTarget, setMergeTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);
  const ref = doc(db, "events", event.id);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const stamp = { curated_by: uid, curated_at: serverTimestamp(), updated_at: serverTimestamp() };

  const startValid = fromPhoenixInput(form.start_at) !== null;
  const missing = missingPublishFields({
    title: form.title,
    start_at: startValid ? form.start_at : null,
    city: isValleyCity(form.city) ? form.city : null,
    venue_name: form.venue_name,
    address: form.address,
    primary_category: isCategoryId(form.primary_category) ? form.primary_category : null,
    source_url: event.source_url,
  });
  const canPublish = form.is_free && missing.length === 0;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const save = (extra: UpdateData<AdminEvent>) =>
    run(() => {
      if (!startValid) throw new Error("Start date/time is required.");
      return updateDoc(ref, { ...toFields(form, event), ...extra, ...stamp });
    });

  const publish = () =>
    save({ status: "published", visibility: "public", cancelled: false, needs_review: false, review_reasons: [] });
  // Paid (or doubtful) events are kept in the hidden catalog for a possible future release (§4.1).
  const keepHidden = () =>
    save({ status: "published", visibility: "hidden", needs_review: false, review_reasons: [] });
  const reject = () => save({ status: "rejected", needs_review: false });
  const cancel = () =>
    save({ status: "cancelled", cancelled: true, needs_review: false, review_reasons: [] });
  const saveOnly = () => save({});

  const merge = () =>
    run(async () => {
      const target = mergeTarget.trim();
      if (!target || target === event.id) throw new Error("Enter the ID of the event to keep.");
      const batch = writeBatch(db);
      batch.update(doc(db, "events", target), {
        additional_sources: arrayUnion({
          name: event.source_name,
          url: event.source_url,
          source_id: event.source_id,
          source_event_id: event.source_event_id,
        }),
        ...stamp,
      });
      batch.update(ref, { status: "rejected", merged_into: target, needs_review: false, ...stamp });
      await batch.commit();
    });

  const input = "mt-1 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm";

  return (
    <div className="space-y-4 bg-surface px-4 py-4">
      <p className="text-xs text-muted">
        ID <code className="select-all">{event.id}</code> ·{" "}
        <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">
          Open source listing
        </a>
        {event.additional_sources.length > 0 && ` · also on ${event.additional_sources.map((s) => s.name).join(", ")}`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold sm:col-span-2">
          Title
          <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label className="text-xs font-semibold sm:col-span-2">
          Description
          <textarea className={input} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Starts (Phoenix time)
          <input type="datetime-local" className={input} value={form.start_at} onChange={(e) => set("start_at", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Ends (optional)
          <input type="datetime-local" className={input} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input type="checkbox" checked={form.all_day} onChange={(e) => set("all_day", e.target.checked)} />
          All day
        </label>
        <label className="text-xs font-semibold">
          Repeats (e.g. &ldquo;Saturdays, Oct–May, 8am–1pm&rdquo;)
          <input className={input} value={form.recurrence_note} onChange={(e) => set("recurrence_note", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Venue
          <input className={input} value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Address
          <input className={input} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          City
          <select className={input} value={form.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">Choose…</option>
            {VALLEY_CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold">
            Latitude
            <input className={input} inputMode="decimal" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
          </label>
          <label className="text-xs font-semibold">
            Longitude
            <input className={input} inputMode="decimal" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
          </label>
        </div>
        <label className="text-xs font-semibold">
          Category
          <select className={input} value={form.primary_category} onChange={(e) => set("primary_category", e.target.value)}>
            <option value="">Choose…</option>
            {CATEGORY_IDS.map((id) => (
              <option key={id} value={id}>
                {getCategory(id).label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Tags (comma separated)
          <input className={input} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" checked={form.is_free} onChange={(e) => set("is_free", e.target.checked)} />
          Free to attend (no required admission or ticket fee)
        </label>
        <label className="text-xs font-semibold">
          Price note
          <input className={input} value={form.price_note} onChange={(e) => set("price_note", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Who it&apos;s for
          <input className={input} value={form.audience_note} onChange={(e) => set("audience_note", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Organizer
          <input className={input} value={form.organizer_name} onChange={(e) => set("organizer_name", e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Curator note (internal)
          <input className={input} value={form.curator_note} onChange={(e) => set("curator_note", e.target.value)} />
        </label>
      </div>

      {!canPublish && (
        <p className="text-xs text-muted">
          Can&apos;t publish yet:{" "}
          {[!form.is_free && "paid events stay hidden", ...missing.map((m) => `missing ${m.replace("_", " ")}`)]
            .filter(Boolean)
            .join(", ")}
          .
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !canPublish} onClick={publish} className="bg-brand rounded-full px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-40">
          Publish
        </button>
        <button type="button" disabled={busy} onClick={saveOnly} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-border">
          Save changes
        </button>
        <button type="button" disabled={busy} onClick={keepHidden} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-border">
          Keep hidden
        </button>
        <button type="button" disabled={busy} onClick={cancel} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-border">
          Mark cancelled
        </button>
        <button type="button" disabled={busy} onClick={reject} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-border">
          Reject
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <label className="text-xs font-semibold">
          Duplicate of (ID of the event to keep)
          <input className={input} value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} placeholder="event-id-1234abcd" />
        </label>
        <button type="button" disabled={busy || !mergeTarget.trim()} onClick={merge} className="rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-border disabled:opacity-40">
          Merge into it
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
