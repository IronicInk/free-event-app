import { renderOgImage, OG_SIZE } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

/** Preview image when the home page link is shared. */
export default function Image() {
  return renderOgImage({
    eyebrow: SITE.name,
    title: "Find something free to do",
    subtitle: "Music, art, food, outdoors & more. No tickets, no fees.",
    background: "linear-gradient(135deg, #ff2d6f, #ff8a00)",
  });
}
