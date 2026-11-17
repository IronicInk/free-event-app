"use client";

import Link from "next/link";
import { useNow } from "@/hooks/useNow";
import { getCategory } from "@/lib/categories";
import {
  dateBadgeParts,
  formatTime,
  getStart,
  isLive,
  relativeDayLabel,
} from "@/lib/dates";
import { formatCount } from "@/lib/format";
import type { FreeEvent } from "@/lib/types";
import { MapPinIcon, UsersIcon } from "@/components/ui/icons";
import { EventCover } from "./EventCover";
import { SaveButton } from "./SaveButton";

interface EventCardProps {
  event: FreeEvent;
  /** Preview mode (used on the Post form): no link, no save button. */
  preview?: boolean;
  className?: string;
}

/**
 * Instagram-style portrait card: big visual, date badge, FREE tag,
 * then title / when / where / social proof underneath.
 */
export function EventCard({ event, preview = false, className = "" }: EventCardProps) {
  const now = useNow();
  const start = getStart(event);
  const badge = dateBadgeParts(start);
  const live = isLive(event, now);
  const category = getCategory(event.category);

  const body = (
    <>
      <EventCover
        event={event}
        className="aspect-[4/5] rounded-2xl transition duration-300 group-hover:scale-[1.02]"
      >
        {/* Calendar-style date badge */}
        <div className="absolute top-3 left-3 flex flex-col items-center rounded-xl bg-white/95 px-2.5 py-1 text-center leading-none text-black shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-accent">{badge.month}</span>
          <span className="text-lg font-bold">{badge.day}</span>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="rounded-full bg-free px-2.5 py-1 text-[11px] font-bold tracking-wide text-free-fg">
            FREE
          </span>
          {live && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-fg">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          )}
        </div>
      </EventCover>

      <div className="mt-3 space-y-1 px-0.5">
        <p className="text-xs font-semibold text-accent">
          {relativeDayLabel(start, now)} · {formatTime(start)}
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug">
          {event.title || "Your event title"}
        </h3>
        <p className="flex items-center gap-1 truncate text-sm text-muted">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="truncate">
            {event.venue || "Venue"} · {event.area}
          </span>
        </p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <UsersIcon className="size-3.5" />
          {formatCount(event.interestedCount)} interested · {category.emoji} {category.label}
        </p>
      </div>
    </>
  );

  if (preview) {
    return <article className={`group ${className}`}>{body}</article>;
  }

  return (
    <article className={`group relative ${className}`}>
      <Link
        href={`/events/${event.id}`}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        {body}
      </Link>
      {/* Sibling of the link (not inside it) so tapping Save doesn't open the event */}
      <div className="absolute top-3 right-3">
        <SaveButton eventId={event.id} eventTitle={event.title} />
      </div>
    </article>
  );
}
