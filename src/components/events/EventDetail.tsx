import Link from "next/link";
import { getCategory } from "@/lib/categories";
import { formatLongDate, formatTimeRange, getStart } from "@/lib/dates";
import { mapsUrl } from "@/lib/events";
import { formatCount } from "@/lib/format";
import type { FreeEvent } from "@/lib/types";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ExternalLinkIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { CalendarMenu } from "./CalendarMenu";
import { EventCover } from "./EventCover";
import { RelatedEvents } from "./RelatedEvents";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";

interface EventDetailProps {
  event: FreeEvent;
}

/**
 * Full event page. Layout: cover on top (mobile) / side-by-side (desktop),
 * key facts first (when, where, free), then actions, description, related.
 *
 * Only shows absolute dates (no "Today"), so it can be pre-rendered on the server.
 */
export function EventDetail({ event }: EventDetailProps) {
  const category = getCategory(event.category);
  const start = getStart(event);

  return (
    <article className="mx-auto max-w-6xl px-4 pt-4 pb-12">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeftIcon className="size-4" />
        All events
      </Link>

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10">
        <EventCover
          event={event}
          // Square on phones so the title is visible without scrolling; taller on desktop.
          className="aspect-square w-full rounded-3xl md:sticky md:top-[calc(var(--header-h)+1rem)] md:aspect-[4/5] md:max-h-[75vh]"
          emojiClassName="text-8xl"
        >
          <span className="absolute bottom-4 left-4 rounded-full bg-free px-3 py-1.5 text-xs font-bold tracking-wide text-free-fg">
            FREE ENTRY
          </span>
        </EventCover>

        <div>
          <Link
            href={`/?category=${event.category}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold hover:opacity-80"
          >
            {category.emoji} {category.label}
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {event.title}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <UsersIcon className="size-4" />
            {formatCount(event.interestedCount)} people interested
          </p>

          {/* Key facts */}
          <dl className="mt-6 space-y-4">
            <div className="flex gap-3">
              <dt className="sr-only">When</dt>
              <CalendarIcon className="mt-0.5 size-5 shrink-0 text-accent" />
              <dd>
                <p className="font-semibold">{formatLongDate(start)}</p>
                <p className="text-sm text-muted">{formatTimeRange(event)}</p>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="sr-only">Where</dt>
              <MapPinIcon className="mt-0.5 size-5 shrink-0 text-accent" />
              <dd>
                <p className="font-semibold">{event.venue}</p>
                <p className="text-sm text-muted">{event.address}</p>
                <a
                  href={mapsUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                >
                  Open in Maps <ExternalLinkIcon className="size-3.5" />
                </a>
              </dd>
            </div>
          </dl>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <SaveButton eventId={event.id} eventTitle={event.title} variant="pill" />
            <ShareButton
              path={`/events/${event.id}`}
              title={event.title}
              text={`Free event: ${event.title} — ${formatLongDate(start)}`}
            />
            <CalendarMenu event={event} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">About this event</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">
              {event.description}
            </p>
            {event.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-fg hover:text-fg"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8 flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border">
            <span className="bg-brand grid size-11 shrink-0 place-items-center rounded-full font-bold text-accent-fg">
              {event.organizer.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">Hosted by</p>
              <p className="truncate font-semibold">{event.organizer}</p>
            </div>
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold hover:opacity-80"
              >
                More info <ExternalLinkIcon className="size-3.5" />
              </a>
            )}
          </section>
        </div>
      </div>

      <RelatedEvents event={event} />
    </article>
  );
}
