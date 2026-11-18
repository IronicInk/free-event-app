import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/EventDetail";
import { getPublicEventById, getPublicEvents } from "@/lib/data/events";
import { formatLongDate, getEnd, getStart } from "@/lib/dates";
import { fullLocation } from "@/lib/events";
import type { FreeEvent } from "@/lib/types";

type Props = PageProps<"/events/[id]">;

/**
 * Pre-build every known event page at deploy time (fast + good for SEO).
 * Events added later by the nightly pull are rendered on first visit and then cached.
 * Cache Components needs at least one param, so an empty catalog returns a placeholder.
 */
export async function generateStaticParams() {
  const events = await getPublicEvents();
  return events.length ? events.map((event) => ({ id: event.id })) : [{ id: "__none__" }];
}

/** Title/description used by Google and by social share previews. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublicEventById(id);
  if (!event) return { title: "Event" };

  const status = event.cancelled ? "Cancelled" : "Free";
  const description = `${status} · ${formatLongDate(getStart(event))} at ${fullLocation(event)}, ${event.city}. ${event.description}`;
  return {
    title: event.title,
    description,
    openGraph: { type: "article", title: `${event.title} (${status})`, description },
    alternates: { canonical: `/events/${event.id}` },
    // Sample events shouldn't end up in search results.
    robots: event.isSample ? { index: false } : undefined,
  };
}

/** schema.org Event data, which helps the event show up in Google's event listings. */
function structuredData(event: FreeEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: getStart(event).toISOString(),
    endDate: getEnd(event).toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: event.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: event.venue || event.city,
      address: [event.address, event.city, "AZ"].filter(Boolean).join(", "),
    },
    ...(event.organizer && { organizer: { "@type": "Organization", name: event.organizer } }),
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const event = await getPublicEventById(id);
  if (!event) notFound();

  return (
    <>
      {!event.isSample && (
        <script
          type="application/ld+json"
          // JSON.stringify output is safe here; "<" is escaped to avoid closing the script tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData(event)).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <EventDetail event={event} />
    </>
  );
}
