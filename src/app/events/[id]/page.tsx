import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDetail } from "@/components/events/EventDetail";
import { LocalEventPage } from "@/components/events/LocalEventPage";
import { PublishedBanner } from "@/components/events/PublishedBanner";
import { formatLongDate, getEnd, getStart } from "@/lib/dates";
import { getSampleEventById, getSampleEvents } from "@/lib/events";
import type { FreeEvent } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

/** Pre-build every known event page at deploy time (fast + good for SEO). */
export function generateStaticParams() {
  return getSampleEvents().map((event) => ({ id: event.id }));
}

/** Title/description used by Google and by social share previews. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = getSampleEventById(id);
  if (!event) return { title: "Event" };

  const description = `Free · ${formatLongDate(getStart(event))} at ${event.venue}, ${event.area}. ${event.description}`;
  return {
    title: event.title,
    description,
    openGraph: { type: "article", title: `${event.title} (Free)`, description },
    alternates: { canonical: `/events/${event.id}` },
  };
}

/** schema.org Event data — helps the event show up in Google's event listings. */
function structuredData(event: FreeEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: getStart(event).toISOString(),
    endDate: getEnd(event).toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: { "@type": "Place", name: event.venue, address: event.address },
    organizer: { "@type": "Organization", name: event.organizer },
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = getSampleEventById(id);

  return (
    <>
      {/* "Your event is live" message after posting (reads ?published=1) */}
      <Suspense fallback={null}>
        <PublishedBanner />
      </Suspense>

      {event ? (
        <>
          <script
            type="application/ld+json"
            // JSON.stringify output is safe here; "<" is escaped to avoid closing the script tag.
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData(event)).replace(/</g, "\\u003c"),
            }}
          />
          <EventDetail event={event} />
        </>
      ) : (
        // Not a sample event — it may have been posted from this browser.
        <LocalEventPage id={id} />
      )}
    </>
  );
}
