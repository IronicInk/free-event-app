"use client";

import Link from "next/link";
import { useNow } from "@/hooks/useNow";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getCategory } from "@/lib/categories";
import { formatTime, getStart, isLive, relativeDayLabel } from "@/lib/dates";
import { eventDistance, formatDistance } from "@/lib/geo";
import type { FreeEvent } from "@/lib/types";
import { MapPinIcon, RepeatIcon } from "@/components/ui/icons";
import { EventCover } from "./EventCover";
import { SaveButton } from "./SaveButton";

interface EventListItemProps {
  event: FreeEvent;
  /** Include the day ("Saturday · 8:00 AM"). Off inside day-grouped lists, where the heading says it. */
  showDay?: boolean;
}

/**
 * Mobile list row: square thumbnail, then time, title and place stacked with room to breathe.
 * Full-width rows scan faster than a squeezed 2-column grid and give every tap target 44px+.
 */
export function EventListItem({ event, showDay = false }: EventListItemProps) {
  const now = useNow();
  const { location } = useUserLocation();
  const start = getStart(event);
  const live = !event.cancelled && isLive(event, now);
  const miles = eventDistance(event, location);
  const category = getCategory(event.category);
  const time = event.allDay ? "All day" : formatTime(start);

  return (
    <article className="relative">
      <Link
        href={`/events/${event.id}`}
        className="flex gap-4 rounded-2xl py-3 pr-12 transition active:bg-surface-2/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <EventCover
          event={event}
          className={`size-[5.5rem] shrink-0 rounded-2xl ${event.cancelled ? "grayscale" : ""}`}
          emojiClassName="text-4xl"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold">
            {event.cancelled ? (
              <span className="text-red-500">Cancelled</span>
            ) : live ? (
              <span className="flex items-center gap-1.5 text-accent">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Happening now
              </span>
            ) : (
              <span className="text-accent">{showDay ? `${relativeDayLabel(start, now)} · ${time}` : time}</span>
            )}
            {event.recurrenceNote && (
              <RepeatIcon className="size-3.5 shrink-0 text-muted" aria-label="Repeats" />
            )}
          </p>
          <h3
            className={`line-clamp-2 text-[16px] leading-snug font-semibold ${event.cancelled ? "text-muted line-through" : ""}`}
          >
            {event.title}
          </h3>
          <p className="flex items-center gap-1 text-[13px] text-muted">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">
              {event.venue || category.label} · {event.city}
              {miles !== null && ` · ${formatDistance(miles)}`}
            </span>
          </p>
        </div>
      </Link>

      {/* Sibling of the link so tapping Save doesn't open the event */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <SaveButton eventId={event.id} eventTitle={event.title} variant="plain" />
      </div>
    </article>
  );
}
