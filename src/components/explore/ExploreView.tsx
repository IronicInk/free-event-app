"use client";

import Link from "next/link";
import { useFilteredEvents } from "@/hooks/useFilteredEvents";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { formatTime, getStart, relativeDayLabel } from "@/lib/dates";
import type { FreeEvent } from "@/lib/types";
import { EventCover } from "@/components/events/EventCover";
import { SaveButton } from "@/components/events/SaveButton";
import { ShareButton } from "@/components/events/ShareButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoIcon, MapPinIcon } from "@/components/ui/icons";

/**
 * TikTok-style vertical feed: one event per screen, swipe up for the next.
 * Uses CSS scroll-snap (no JS gesture library), so it's smooth and accessible.
 * Respects the same URL filters as Discover (?category=music&when=today…).
 */
export function ExploreView() {
  const { filters, setFilters, results: events, now } = useFilteredEvents();

  return (
    // Fills the screen between the header and the mobile tab bar.
    <div className="relative mx-auto h-[calc(100dvh-var(--header-h)-var(--nav-h)-env(safe-area-inset-bottom))] max-w-md md:py-4">
      {/* Floating category chips */}
      <div className="no-scrollbar absolute inset-x-0 top-3 z-20 flex gap-2 overflow-x-auto px-3 md:top-7">
        <FeedChip active={filters.category === null} onClick={() => setFilters({ category: null })}>
          All
        </FeedChip>
        {CATEGORIES.map((c) => (
          <FeedChip
            key={c.id}
            active={filters.category === c.id}
            onClick={() => setFilters({ category: c.id })}
          >
            {c.emoji} {c.label}
          </FeedChip>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="grid h-full place-items-center">
          <EmptyState
            emoji="🌵"
            title="Nothing here yet"
            message="No free events match these filters. Try another category."
          />
        </div>
      ) : (
        <ul
          aria-label="Event feed"
          className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain md:rounded-3xl"
        >
          {events.map((event) => (
            <li key={event.id} className="h-full snap-start snap-always">
              <FeedSlide event={event} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeedChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap backdrop-blur-md transition ${
        active ? "bg-white text-black" : "bg-black/30 text-white hover:bg-black/45"
      }`}
    >
      {children}
    </button>
  );
}

/** One full-screen event in the feed. */
function FeedSlide({ event, now }: { event: FreeEvent; now: Date }) {
  const start = getStart(event);
  const category = getCategory(event.category);

  return (
    <EventCover event={event} className="h-full w-full md:rounded-3xl" emojiClassName="text-[7rem]">
      {/* Dark fade at the bottom keeps white text readable on any cover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        <SaveButton
          eventId={event.id}
          eventTitle={event.title}
          variant="rail"
        />
        <ShareButton path={`/events/${event.id}`} title={event.title} variant="rail" />
        <Link
          href={`/events/${event.id}`}
          aria-label={`Details for ${event.title}`}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-white"
        >
          <span className="grid size-12 place-items-center rounded-full bg-black/30 backdrop-blur-sm transition active:scale-90">
            <InfoIcon className="size-6" />
          </span>
          Details
        </Link>
      </div>

      {/* Event info */}
      <div className="absolute inset-x-0 bottom-0 p-5 pr-20 text-white">
        <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span className="rounded-full bg-free px-2.5 py-1 tracking-wide text-free-fg">FREE</span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
            {category.emoji} {category.label}
          </span>
        </div>
        <h2 className="text-2xl leading-tight font-bold text-balance drop-shadow">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </h2>
        <p className="mt-1.5 text-sm font-semibold">
          {relativeDayLabel(start, now)} · {event.allDay ? "All day" : formatTime(start)}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-white/80">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="truncate">
            {event.venue ? `${event.venue} · ` : ""}
            {event.city}
          </span>
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-white/80">{event.description}</p>
      </div>
    </EventCover>
  );
}
