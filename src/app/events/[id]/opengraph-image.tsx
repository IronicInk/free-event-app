import { categoryGradient, getCategory } from "@/lib/categories";
import { getPublicEventById } from "@/lib/data/events";
import { formatShortDate, formatTime, getStart } from "@/lib/dates";
import { renderOgImage, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = "Free event details";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Preview image when an event link is shared: title, date, place on the category gradient. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublicEventById(id);

  if (!event) {
    return renderOgImage({
      eyebrow: SITE.name,
      title: "Free things to do in the Valley",
      subtitle: "Tap to see what's on",
      background: "linear-gradient(135deg, #ff2d6f, #ff8a00)",
    });
  }

  const start = getStart(event);
  return renderOgImage({
    badge: event.cancelled ? "CANCELLED" : "FREE",
    eyebrow: getCategory(event.category).label,
    title: event.title,
    subtitle: `${formatShortDate(start)} · ${formatTime(start)} · ${event.venue || event.city}, ${event.city}`,
    background: categoryGradient(event.category),
  });
}
