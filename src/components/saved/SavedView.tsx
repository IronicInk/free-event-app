"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAllEvents } from "@/hooks/useEvents";
import { useIsClient } from "@/hooks/useIsClient";
import { useNow } from "@/hooks/useNow";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { hasEnded } from "@/lib/dates";
import { sortByStart } from "@/lib/events";
import { EventList } from "@/components/events/EventList";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/Skeletons";

/** Bookmarked events, split into upcoming and past. */
export function SavedView() {
  const isClient = useIsClient();
  const { savedIds, removeSaved } = useSavedEvents();
  const allEvents = useAllEvents();
  const now = useNow();

  const { upcoming, past, unlisted } = useMemo(() => {
    const saved = allEvents.filter((e) => savedIds.includes(e.id));
    const sorted = sortByStart(saved);
    const listedIds = new Set(allEvents.map((e) => e.id));
    return {
      // Cancelled events stay here (with a CANCELLED label) so people know not to go (FR-8).
      upcoming: sorted.filter((e) => !hasEnded(e, now)),
      past: sorted.filter((e) => hasEnded(e, now)).reverse(),
      // Saved events that have since expired or been withdrawn from the catalog.
      unlisted: savedIds.filter((id) => !listedIds.has(id)),
    };
  }, [allEvents, savedIds, now]);

  // Saved items live in the browser, so wait until we can read them.
  if (!isClient) return <CardGridSkeleton count={4} />;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:pt-10">
      <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight sm:text-4xl">Saved</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">Events you&apos;ve bookmarked. Saved on this device only, no account needed.</p>

      {unlisted.length > 0 && (
        <p className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
          {unlisted.length} saved {unlisted.length === 1 ? "event is" : "events are"} no longer listed
          (finished or removed by the source).
          <button
            type="button"
            onClick={() => removeSaved(unlisted)}
            className="font-semibold text-fg hover:underline"
          >
            Remove
          </button>
        </p>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          message="Tap the bookmark on any event to keep it here for later."
          action={
            <Link href="/" className="bg-brand inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-accent-fg">
              Find events
            </Link>
          }
        />
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold tracking-tight">Upcoming ({upcoming.length})</h2>
            {upcoming.length > 0 ? (
              <EventList events={upcoming} />
            ) : (
              <p className="text-sm text-muted">No upcoming saved events.</p>
            )}
          </section>
          {past.length > 0 && (
            <section className="mt-10 opacity-70">
              <h2 className="mb-3 text-xl font-bold tracking-tight">Past ({past.length})</h2>
              <EventList events={past} groupByDate={false} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
