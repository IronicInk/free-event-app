import { categoryGradient, getCategory } from "@/lib/categories";
import { formatShortDate, formatTime, getStart } from "@/lib/dates";
import { getSampleEventById } from "@/lib/events";
import { renderOgImage, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = "Free event details";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Preview image when an event link is shared: title, date, place on the category gradient. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getSampleEventById(id);

  // Events posted in the browser aren't on the server yet — show a generic card.
  if (!event) {
    return renderOgImage({
      eyebrow: SITE.name,
      title: "A free event near you",
      subtitle: "Tap to see the details",
      background: "linear-gradient(135deg, #ff2d6f, #ff8a00)",
    });
  }

  const start = getStart(event);
  return renderOgImage({
    eyebrow: getCategory(event.category).label,
    title: event.title,
    subtitle: `${formatShortDate(start)} · ${formatTime(start)} · ${event.venue}, ${event.area}`,
    background: categoryGradient(event.category),
  });
}
