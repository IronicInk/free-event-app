"use client";

import Link from "next/link";
import { usePublishedEvents } from "@/hooks/useEvents";
import { useIsClient } from "@/hooks/useIsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventDetail } from "./EventDetail";

/**
 * Shows an event that was posted from this browser (stored in localStorage).
 * TEMPORARY: once events live in a database, the server page handles all events
 * and this component can be deleted.
 */
export function LocalEventPage({ id }: { id: string }) {
  const isClient = useIsClient();
  const published = usePublishedEvents();

  if (!isClient) {
    return <div className="mx-auto mt-6 h-[60vh] max-w-6xl animate-pulse rounded-3xl bg-surface-2" />;
  }

  const event = published.find((e) => e.id === id);
  if (!event) {
    return (
      <EmptyState
        emoji="🫥"
        title="Event not found"
        message="This event may have ended or been removed."
        action={
          <Link href="/" className="bg-brand rounded-full px-5 py-3 text-sm font-semibold text-accent-fg">
            Browse events
          </Link>
        }
      />
    );
  }

  return <EventDetail event={event} />;
}
