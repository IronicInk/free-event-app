"use client";

import { useMemo } from "react";
import { useAllEvents } from "@/hooks/useEvents";
import { useNow } from "@/hooks/useNow";
import { getRelatedEvents } from "@/lib/events";
import type { FreeEvent } from "@/lib/types";
import { EventRow } from "./EventGrid";

/** "You might also like" — computed in the browser so it's always current. */
export function RelatedEvents({ event }: { event: FreeEvent }) {
  const allEvents = useAllEvents();
  const now = useNow();
  const related = useMemo(() => getRelatedEvents(event, allEvents, now), [event, allEvents, now]);

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">You might also like</h2>
      <EventRow events={related} />
    </section>
  );
}
