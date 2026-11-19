import type { FreeEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

/** Card grid for tablet and desktop (phones use the list rows in EventList). */
export function EventGrid({ events }: { events: FreeEvent[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Horizontally swipeable row of cards (e.g. "This weekend").
 * Cards are ~80% wide on phones so the next one peeks in, signalling "swipe for more".
 */
export function EventRow({ events }: { events: FreeEvent[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-1">
      {events.map((event) => (
        <li key={event.id} className="w-[80%] max-w-80 shrink-0 snap-start sm:w-72">
          <EventCard event={event} coverAspect="landscape" />
        </li>
      ))}
    </ul>
  );
}
