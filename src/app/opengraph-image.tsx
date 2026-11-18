import { renderOgImage, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

/** Preview image when the home page link is shared. */
export default function Image() {
  return renderOgImage({
    eyebrow: SITE.name,
    title: "Free things to do in the Valley",
    subtitle: "Farmers markets, festivals, celebrations & more. No tickets, no fees.",
    background: "linear-gradient(135deg, #ff2d6f, #ff8a00)",
  });
}
