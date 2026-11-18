import Link from "next/link";
import { getCategory, tagLabel } from "@/lib/categories";
import { formatLongDate, formatShortDate, formatTimeRange, getStart } from "@/lib/dates";
import { mapsUrl } from "@/lib/events";
import { SITE } from "@/lib/site";
import type { FreeEvent } from "@/lib/types";
import {
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ExternalLinkIcon,
  InfoIcon,
  MapPinIcon,
  RepeatIcon,
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
 * Full event page (FR-6 to FR-10). Layout: cover on top (mobile) / side-by-side (desktop),
 * key facts first (when, where, free), then actions, description, source.
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

      {event.cancelled && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white"
        >
          <AlertIcon className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>This event has been cancelled.</strong> Check the original listing below for
            updates or a new date.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10">
        <EventCover
          event={event}
          // Square on phones so the title is visible without scrolling; taller on desktop.
          className={`aspect-square w-full rounded-3xl md:sticky md:top-[calc(var(--header-h)+1rem)] md:aspect-[4/5] md:max-h-[75vh] ${
            event.cancelled ? "grayscale" : ""
          }`}
          emojiClassName="text-8xl"
        >
          {!event.cancelled && (
            <span className="absolute bottom-4 left-4 rounded-full bg-free px-3 py-1.5 text-xs font-bold tracking-wide text-free-fg">
              FREE TO ATTEND
            </span>
          )}
        </EventCover>

        <div>
          <Link
            href={`/?category=${event.category}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold hover:opacity-80"
          >
            {category.emoji} {category.label}
          </Link>

          <h1
            className={`mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl ${
              event.cancelled ? "line-through decoration-2" : ""
            }`}
          >
            {event.title}
          </h1>
          {event.organizer && <p className="mt-2 text-sm text-muted">By {event.organizer}</p>}

          {/* Key facts */}
          <dl className="mt-6 space-y-4">
            <div className="flex gap-3">
              <dt className="sr-only">When</dt>
              <CalendarIcon className="mt-0.5 size-5 shrink-0 text-accent" />
              <dd>
                <p className="font-semibold">
                  {event.recurrenceNote ? "Next: " : ""}
                  {formatLongDate(start)}
                </p>
                <p className="text-sm text-muted">
                  {event.allDay ? "All day" : formatTimeRange(event)}
                </p>
              </dd>
            </div>

            {event.recurrenceNote && (
              <div className="flex gap-3">
                <dt className="sr-only">Repeats</dt>
                <RepeatIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                <dd>
                  <p className="font-semibold">Repeats</p>
                  <p className="text-sm text-muted">{event.recurrenceNote}</p>
                </dd>
              </div>
            )}

            <div className="flex gap-3">
              <dt className="sr-only">Where</dt>
              <MapPinIcon className="mt-0.5 size-5 shrink-0 text-accent" />
              <dd>
                {event.venue && <p className="font-semibold">{event.venue}</p>}
                <p className="text-sm text-muted">
                  {[event.address !== event.venue ? event.address : "", event.city]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
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

            <div className="flex gap-3">
              <dt className="sr-only">Cost</dt>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center text-sm font-bold text-free">
                $0
              </span>
              <dd>
                <p className="font-semibold">Free to attend</p>
                {event.priceNote && <p className="text-sm text-muted">{event.priceNote}</p>}
              </dd>
            </div>

            {event.audienceNote && (
              <div className="flex gap-3">
                <dt className="sr-only">Who it&apos;s for</dt>
                <InfoIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                <dd className="text-sm">{event.audienceNote}</dd>
              </div>
            )}
          </dl>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <SaveButton eventId={event.id} eventTitle={event.title} variant="pill" />
            <ShareButton
              path={`/events/${event.id}`}
              title={event.title}
              text={`Free event: ${event.title} on ${formatShortDate(start)}, ${event.city}`}
            />
            {!event.cancelled && <CalendarMenu event={event} />}
          </div>

          {event.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">About this event</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted">
                {event.description}
              </p>
            </section>
          )}

          {event.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/?q=${encodeURIComponent(tagLabel(tag))}`}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-fg hover:text-fg"
                  >
                    {tagLabel(tag)}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <SourceBox event={event} />
        </div>
      </div>

      <RelatedEvents event={event} />
    </article>
  );
}

/** FR-7 (visible source link) and FR-10 (not an official calendar). */
function SourceBox({ event }: { event: FreeEvent }) {
  return (
    <section className="mt-8 rounded-2xl bg-surface p-4 ring-1 ring-border">
      <h2 className="text-sm font-semibold">Source</h2>
      {event.isSample ? (
        <p className="mt-1 text-sm text-muted">
          This is a <strong>sample event</strong> for previewing the app. It isn&apos;t a real
          listing.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {[{ name: event.sourceName, url: event.sourceUrl }, ...event.additionalSources].map(
            (source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  View the original listing on {source.name}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              </li>
            ),
          )}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        {SITE.name} is an independent guide that collects listings from public calendars. It is
        not affiliated with any city or agency. Please confirm details with the organizer before
        you go.
      </p>
    </section>
  );
}
