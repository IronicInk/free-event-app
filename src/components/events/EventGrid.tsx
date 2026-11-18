import type { FreeEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

/** Responsive card grid: 2 columns on phones (like Instagram explore), up to 4 on desktop. */
export function EventGrid({ events }: { events: FreeEvent[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}

/** Horizontally swipeable row of cards (e.g. "This weekend"). */
export function EventRow({ events }: { events: FreeEvent[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2">
      {events.map((event) => (
        <li key={event.id} className="w-[46%] shrink-0 snap-start sm:w-56">
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
