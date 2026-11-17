"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAllEvents } from "@/hooks/useEvents";
import { useIsClient } from "@/hooks/useIsClient";
import { useNow } from "@/hooks/useNow";
import { useSavedEvents } from "@/hooks/useSavedEvents";
import { hasEnded } from "@/lib/dates";
import { sortByStart } from "@/lib/events";
import { EventGrid } from "@/components/events/EventGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/Skeletons";

/** Bookmarked events, split into upcoming and past. */
export function SavedView() {
  const isClient = useIsClient();
  const { savedIds } = useSavedEvents();
  const allEvents = useAllEvents();
  const now = useNow();

  const { upcoming, past } = useMemo(() => {
    const saved = allEvents.filter((e) => savedIds.includes(e.id));
    const sorted = sortByStart(saved);
    return {
      upcoming: sorted.filter((e) => !hasEnded(e, now)),
      past: sorted.filter((e) => hasEnded(e, now)).reverse(),
    };
  }, [allEvents, savedIds, now]);

  // Saved items live in the browser, so wait until we can read them.
  if (!isClient) return <CardGridSkeleton count={4} />;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-12">
      <h1 className="text-3xl font-bold tracking-tight">Saved</h1>
      <p className="mt-1 text-muted">Events you&apos;ve bookmarked. Saved on this device.</p>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          message="Tap the bookmark on any event to keep it here for later."
          action={
            <Link href="/" className="bg-brand rounded-full px-5 py-3 text-sm font-semibold text-accent-fg">
              Find events
            </Link>
          }
        />
      ) : (
        <>
          <section className="mt-6">
            <h2 className="mb-4 text-lg font-semibold">Upcoming ({upcoming.length})</h2>
            {upcoming.length > 0 ? (
              <EventGrid events={upcoming} />
            ) : (
              <p className="text-sm text-muted">No upcoming saved events.</p>
            )}
          </section>
          {past.length > 0 && (
            <section className="mt-10 opacity-70">
              <h2 className="mb-4 text-lg font-semibold">Past ({past.length})</h2>
              <EventGrid events={past} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
