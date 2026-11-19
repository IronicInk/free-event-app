"use client";

import Link from "next/link";
import { useNow } from "@/hooks/useNow";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getCategory } from "@/lib/categories";
import { dateBadgeParts, formatTime, getStart, isLive, relativeDayLabel } from "@/lib/dates";
import { eventDistance, formatDistance } from "@/lib/geo";
import type { FreeEvent } from "@/lib/types";
import { MapPinIcon, RepeatIcon } from "@/components/ui/icons";
import { EventCover } from "./EventCover";
import { SaveButton } from "./SaveButton";

interface EventCardProps {
  event: FreeEvent;
  className?: string;
  /** Cover shape: portrait (grid), landscape (carousels) or wide. */
  coverAspect?: "portrait" | "landscape" | "wide";
}

/**
 * Portrait card: big visual, date badge, FREE / CANCELLED tag,
 * then title / when / where underneath.
 */
const ASPECT = { portrait: "aspect-[4/5]", landscape: "aspect-[4/3]", wide: "aspect-[16/9]" } as const;

export function EventCard({ event, className = "", coverAspect = "portrait" }: EventCardProps) {
  const now = useNow();
  const { location } = useUserLocation();
  const start = getStart(event);
  const badge = dateBadgeParts(start);
  const live = !event.cancelled && isLive(event, now);
  const category = getCategory(event.category);
  const miles = eventDistance(event, location);

  return (
    <article className={`group relative ${className}`}>
      <Link
        href={`/events/${event.id}`}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <EventCover
          event={event}
          className={`${ASPECT[coverAspect]} rounded-2xl transition duration-300 group-hover:scale-[1.02] ${
            event.cancelled ? "grayscale" : ""
          }`}
        >
          {/* Calendar-style date badge */}
          <div className="absolute top-3 left-3 flex flex-col items-center rounded-xl bg-white/95 px-2.5 py-1 text-center leading-none text-black shadow-sm">
            <span className="text-[10px] font-bold tracking-wider text-accent">{badge.month}</span>
            <span className="text-lg font-bold">{badge.day}</span>
          </div>

          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {event.cancelled ? (
              <span className="rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                CANCELLED
              </span>
            ) : (
              <span className="rounded-full bg-free px-2.5 py-1 text-[11px] font-bold tracking-wide text-free-fg">
                FREE
              </span>
            )}
            {live && (
              <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-fg">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            )}
          </div>
        </EventCover>

        <div className="mt-3 space-y-1.5 px-0.5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-accent">
            {relativeDayLabel(start, now)} · {event.allDay ? "All day" : formatTime(start)}
            {event.recurrenceNote && (
              <RepeatIcon className="size-3.5 shrink-0 text-muted" aria-label="Repeats" />
            )}
          </p>
          <h3
            className={`line-clamp-2 text-[16px] leading-snug font-semibold ${event.cancelled ? "line-through" : ""}`}
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
      {/* Sibling of the link (not inside it) so tapping Save doesn't open the event */}
      <div className="absolute top-3 right-3">
        <SaveButton eventId={event.id} eventTitle={event.title} />
      </div>
    </article>
  );
}
