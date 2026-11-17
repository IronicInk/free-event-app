"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { publishEventLocally } from "@/hooks/useEvents";
import { useNow } from "@/hooks/useNow";
import { CATEGORIES } from "@/lib/categories";
import { dayKey } from "@/lib/dates";
import {
  createLocalEventId,
  draftToEvent,
  EMPTY_DRAFT,
  LIMITS,
  validateDraft,
  type EventDraft,
} from "@/lib/event-draft";
import { fileToResizedDataUrl } from "@/lib/image";
import { AREAS } from "@/lib/site";
import { EventCard } from "@/components/events/EventCard";
import { Chip } from "@/components/filters/Chip";
import { ImageIcon, XIcon } from "@/components/ui/icons";
import { FormField, inputClass } from "./FormField";

type TextKey = {
  [K in keyof EventDraft]: EventDraft[K] extends string ? K : never;
}[keyof EventDraft];

/**
 * Post-an-event form. Designed to take under 2 minutes:
 * - one page, grouped into short sections
 * - tap-to-pick chips instead of dropdowns
 * - live preview of exactly how the card will look in the feed
 * - errors appear after the first submit attempt, then update as you fix them
 */
export function PublishForm() {
  const router = useRouter();
  const now = useNow();
  const [draft, setDraft] = useState<EventDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const errors = useMemo(() => validateDraft(draft, now), [draft, now]);
  const visibleErrors = submitted ? errors : {};
  const preview = useMemo(() => draftToEvent(draft, "preview", now), [draft, now]);

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  /** Props shared by every text input: id, value, onChange and a11y attributes. */
  function textProps(key: TextKey) {
    const id = `field-${key}`;
    return {
      id,
      name: key,
      value: draft[key],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, e.target.value),
      "aria-invalid": Boolean(visibleErrors[key]) || undefined,
      "aria-describedby": visibleErrors[key] ? `${id}-error` : `${id}-hint`,
      className: inputClass(Boolean(visibleErrors[key])),
    };
  }

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setImageError(null);
    try {
      update("coverImage", await fileToResizedDataUrl(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not use that image.");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    const event = draftToEvent(draft, createLocalEventId(), now);
    if (!publishEventLocally(event)) {
      setSaving(false);
      setFormError("Couldn't save your event — the photo may be too large. Try a smaller one or remove it.");
      return;
    }
    router.push(`/events/${event.id}?published=1`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12"
    >
      <div className="space-y-10">
        {/* 1. Basics */}
        <Section step={1} title="The basics">
          <FormField
            id="field-title"
            label="Event name"
            error={visibleErrors.title}
            hint={`${draft.title.length}/${LIMITS.titleMax}`}
          >
            <input {...textProps("title")} maxLength={LIMITS.titleMax} placeholder="e.g. Sunset Yoga in the Park" />
          </FormField>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Category</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c, i) => (
                <Chip
                  key={c.id}
                  // First chip gets the id so "focus first error" can reach it.
                  id={i === 0 ? "field-category" : undefined}
                  active={draft.category === c.id}
                  onClick={() => update("category", c.id)}
                >
                  {c.emoji} {c.label}
                </Chip>
              ))}
            </div>
            {visibleErrors.category && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-accent">
                {visibleErrors.category}
              </p>
            )}
          </fieldset>
        </Section>

        {/* 2. When */}
        <Section step={2} title="When is it?">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="field-date" label="Date" error={visibleErrors.date}>
              <input {...textProps("date")} type="date" min={dayKey(now)} />
            </FormField>
            <FormField id="field-startTime" label="Starts" error={visibleErrors.startTime}>
              <input {...textProps("startTime")} type="time" />
            </FormField>
            <FormField id="field-endTime" label="Ends" optional error={visibleErrors.endTime}>
              <input {...textProps("endTime")} type="time" />
            </FormField>
          </div>
        </Section>

        {/* 3. Where */}
        <Section step={3} title="Where is it?">
          <FormField id="field-venue" label="Venue or place" error={visibleErrors.venue}>
            <input {...textProps("venue")} placeholder="e.g. Riverside Park, Main Library" autoComplete="off" />
          </FormField>
          <FormField id="field-address" label="Address" error={visibleErrors.address}>
            <input {...textProps("address")} placeholder="Street, City, AZ" autoComplete="street-address" />
          </FormField>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Area</legend>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area, i) => (
                <Chip
                  key={area}
                  id={i === 0 ? "field-area" : undefined}
                  active={draft.area === area}
                  onClick={() => update("area", area)}
                >
                  {area}
                </Chip>
              ))}
            </div>
            {visibleErrors.area && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-accent">
                {visibleErrors.area}
              </p>
            )}
          </fieldset>
        </Section>

        {/* 4. Details */}
        <Section step={4} title="Make it shine">
          <FormField
            id="field-description"
            label="Description"
            error={visibleErrors.description}
            hint={`What will people do or see? Anything to bring? (${draft.description.length}/${LIMITS.descriptionMax})`}
          >
            <textarea
              {...textProps("description")}
              rows={5}
              maxLength={LIMITS.descriptionMax}
              placeholder="Bring a blanket and enjoy live music under the stars…"
            />
          </FormField>

          <div>
            <p className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
              Cover photo <span className="text-xs font-normal text-muted">Optional</span>
            </p>
            {draft.coverImage ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.coverImage} alt="Selected cover" className="size-20 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => update("coverImage", "")}
                  className="flex items-center gap-1 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium hover:bg-border"
                >
                  <XIcon className="size-4" /> Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted transition hover:border-accent hover:text-fg focus-within:border-accent">
                <ImageIcon className="size-8" />
                <span>
                  <span className="font-semibold text-accent">Upload a photo</span> — portrait photos look best
                </span>
                <span className="text-xs">No photo? We&apos;ll use a colorful category cover.</span>
                <input type="file" accept="image/*" onChange={handleImage} className="sr-only" />
              </label>
            )}
            {imageError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-accent">
                {imageError}
              </p>
            )}
          </div>

          <FormField
            id="field-tags"
            label="Tags"
            optional
            hint="Comma separated, e.g. jazz, outdoor, family friendly"
          >
            <input {...textProps("tags")} placeholder="jazz, outdoor, picnic" />
          </FormField>

          <FormField
            id="field-link"
            label="Link for more info"
            optional
            error={visibleErrors.link}
            hint="RSVP page, Instagram post, website…"
          >
            <input {...textProps("link")} type="url" inputMode="url" placeholder="https://" />
          </FormField>
        </Section>

        {/* 5. Host */}
        <Section step={5} title="Who's hosting?">
          <FormField id="field-organizer" label="Host name" error={visibleErrors.organizer}>
            <input {...textProps("organizer")} placeholder="Your name, club or organization" autoComplete="organization" />
          </FormField>

          <label
            htmlFor="field-confirmFree"
            className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-1 ${
              visibleErrors.confirmFree ? "ring-accent" : "ring-border"
            }`}
          >
            <input
              id="field-confirmFree"
              type="checkbox"
              checked={draft.confirmFree}
              onChange={(e) => update("confirmFree", e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
            />
            <span className="text-sm">
              <span className="font-semibold">This event is 100% free to attend.</span>
              <span className="block text-muted">
                No tickets, entry fees, or required purchases.
              </span>
              {visibleErrors.confirmFree && (
                <span role="alert" className="mt-1 block text-xs font-medium text-accent">
                  {visibleErrors.confirmFree}
                </span>
              )}
            </span>
          </label>
        </Section>
      </div>

      {/* Live preview + submit (sticky on desktop) */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <p className="mb-3 text-sm font-semibold text-muted">Live preview</p>
        <div className="mx-auto max-w-[260px] lg:max-w-none">
          <EventCard event={preview} preview />
        </div>

        {formError && (
          <p role="alert" className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-accent">
            {formError}
          </p>
        )}
        {submitted && Object.keys(errors).length > 0 && (
          <p className="mt-4 text-center text-sm text-accent">
            Fix {Object.keys(errors).length} {Object.keys(errors).length === 1 ? "thing" : "things"} above to post.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand mt-4 w-full rounded-full py-4 font-bold text-accent-fg shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Posting…" : "Post event"}
        </button>
      </aside>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-3 text-lg font-bold">
        <span className="bg-brand grid size-7 place-items-center rounded-full text-sm text-accent-fg">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
