import Link from "next/link";
import type { ReactNode } from "react";
import { getCategory, tagLabel } from "@/lib/categories";
import { formatLongDate, formatShortDate, formatTimeRange, getStart } from "@/lib/dates";
import { mapsUrl } from "@/lib/events";
import { SITE } from "@/lib/site";
import type { FreeEvent } from "@/lib/types";
import {
  AlertIcon,
  CalendarIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  InfoIcon,
  MapPinIcon,
  NavigationIcon,
  RepeatIcon,
} from "@/components/ui/icons";
import { BackButton } from "./BackButton";
import { CalendarMenu } from "./CalendarMenu";
import { EventCover } from "./EventCover";
import { RelatedEvents } from "./RelatedEvents";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";

interface EventDetailProps {
  event: FreeEvent;
}

/**
 * Full event page (FR-6 to FR-10).
 * - Phones: edge-to-edge cover with back / share / save floating on it, then title,
 *   a "key facts" card, two big actions (Directions, Add to calendar), description and source.
 * - Desktop: cover and details side by side.
 *
 * Only shows absolute dates (no "Today"), so it can be pre-rendered on the server.
 */
export function EventDetail({ event }: EventDetailProps) {
  const category = getCategory(event.category);
  const start = getStart(event);
  // Address line, without repeating the venue name or a city the address already includes.
  const address = event.address !== event.venue ? event.address : "";
  const place = address.includes(event.city) ? address : [address, event.city].filter(Boolean).join(", ");

  return (
    <article className="mx-auto max-w-6xl px-4 pb-16 md:pt-8">
      <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
        <EventCover
          event={event}
          className={`-mx-4 aspect-[4/3] md:sticky md:top-[calc(var(--header-h)+2rem)] md:mx-0 md:aspect-[4/5] md:max-h-[75vh] md:rounded-3xl ${
            event.cancelled ? "grayscale" : ""
          }`}
          emojiClassName="text-8xl"
        >
          {/* Soft shade at the top keeps the floating buttons visible on bright covers */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <BackButton
              label="Back to events"
              className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-90"
            />
            <div className="flex gap-2">
              <ShareButton
                path={`/events/${event.id}`}
                title={event.title}
                text={`Free event: ${event.title} on ${formatShortDate(start)}, ${event.city}`}
                variant="overlay"
              />
              <SaveButton eventId={event.id} eventTitle={event.title} />
            </div>
          </div>
          {!event.cancelled && (
            <span className="absolute bottom-4 left-4 rounded-full bg-free px-3 py-1.5 text-xs font-bold tracking-wide text-free-fg">
              FREE TO ATTEND
            </span>
          )}
        </EventCover>

        <div className="pt-6 md:pt-0">
          {event.cancelled && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-medium text-white"
            >
              <AlertIcon className="mt-0.5 size-5 shrink-0" />
              <p>
                <strong>This event has been cancelled.</strong> Check the original listing below for
                updates or a new date.
              </p>
            </div>
          )}

          <Link
            href={`/?category=${event.category}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-semibold transition hover:bg-border"
          >
            {category.emoji} {category.label}
          </Link>

          <h1
            className={`mt-3 text-[28px] leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl ${
              event.cancelled ? "line-through decoration-2" : ""
            }`}
          >
            {event.title}
          </h1>
          {event.organizer && <p className="mt-2 text-[15px] text-muted">By {event.organizer}</p>}

          {/* Key facts, as one tidy card */}
          <dl className="mt-6 divide-y divide-border overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
            <Fact icon={<CalendarIcon className="size-5" />} label="When">
              <p className="font-semibold">
                {event.recurrenceNote ? "Next: " : ""}
                {formatLongDate(start)}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {event.allDay ? "All day" : formatTimeRange(event)}
              </p>
            </Fact>

            {event.recurrenceNote && (
              <Fact icon={<RepeatIcon className="size-5" />} label="Repeats">
                <p className="font-semibold">Repeats</p>
                <p className="mt-0.5 text-sm text-muted">{event.recurrenceNote}</p>
              </Fact>
            )}

            <Fact icon={<MapPinIcon className="size-5" />} label="Where" href={mapsUrl(event)}>
              <p className="font-semibold">{event.venue || event.city}</p>
              {place && <p className="mt-0.5 text-sm text-muted">{place}</p>}
            </Fact>

            <Fact icon={<span className="text-sm font-bold">$0</span>} label="Cost" tone="free">
              <p className="font-semibold">Free to attend</p>
              {event.priceNote && <p className="mt-0.5 text-sm text-muted">{event.priceNote}</p>}
            </Fact>

            {event.audienceNote && (
              <Fact icon={<InfoIcon className="size-5" />} label="Who it's for">
                <p className="text-sm">{event.audienceNote}</p>
              </Fact>
            )}
          </dl>

          {/* Primary actions: equal-width, 48px tall, no awkward wrapping */}
          {!event.cancelled && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={mapsUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-accent-fg transition active:scale-[0.98]"
              >
                <NavigationIcon className="size-[18px]" />
                Directions
              </a>
              <CalendarMenu event={event} />
            </div>
          )}

          {event.description && (
            <section className="mt-10">
              <h2 className="text-lg font-bold">About this event</h2>
              <p className="mt-3 text-[15px] leading-7 whitespace-pre-line text-muted">
                {event.description}
              </p>
            </section>
          )}

          {event.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/?q=${encodeURIComponent(tagLabel(tag))}`}
                    className="flex h-9 items-center rounded-full border border-border px-3.5 text-[13px] text-muted transition hover:border-fg hover:text-fg"
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

/** One row in the key-facts card. With `href`, the whole row is a link with a chevron. */
function Fact({
  icon,
  label,
  href,
  tone = "accent",
  children,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  tone?: "accent" | "free";
  children: ReactNode;
}) {
  const body = (
    <>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full ${
          tone === "free" ? "bg-free/15 text-free" : "bg-accent/12 text-accent"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 self-center">{children}</div>
      {href && <ChevronRightIcon className="size-5 shrink-0 self-center text-muted" />}
    </>
  );

  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3.5 px-4 py-4 transition hover:bg-surface-2 active:bg-surface-2"
        >
          {body}
        </a>
      ) : (
        <div className="flex gap-3.5 px-4 py-4">{body}</div>
      )}
      </dd>
    </div>
  );
}

/** FR-7 (visible source link) and FR-10 (not an official calendar). */
function SourceBox({ event }: { event: FreeEvent }) {
  return (
    <section className="mt-10 rounded-2xl bg-surface p-5 ring-1 ring-border">
      <h2 className="text-[15px] font-bold">Source</h2>
      {event.isSample ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This is a <strong className="text-fg">sample event</strong> for previewing the app. It
          isn&apos;t a real listing.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {[{ name: event.sourceName, url: event.sourceUrl }, ...event.additionalSources].map(
            (source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  View the original listing on {source.name}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              </li>
            ),
          )}
        </ul>
      )}
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        {SITE.name} is an independent guide that collects listings from public calendars. It is
        not affiliated with any city or agency. Please confirm details with the organizer before
        you go.
      </p>
    </section>
  );
}
