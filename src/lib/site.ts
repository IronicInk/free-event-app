/**
 * Site-wide settings.
 * Change the app name, region or map tiles here and it updates everywhere.
 */
import { VALLEY_TIMEZONE } from "@shared/event-model";

export const SITE = {
  /** Working / placeholder name (PROJECT_REQUIREMENTS.md, open question 20). */
  name: "Valley Vibe",
  shortName: "Valley Vibe",
  tagline: "Free things to do in the Valley",
  description:
    "A curated list of free local events across the Phoenix metro: farmers markets, festivals, celebrations, parks, arts and more. No tickets, no fees.",

  /**
   * All event times are shown in this time zone (NFR-1).
   * Arizona does not observe daylight saving, so the offset is always -07:00.
   */
  timeZone: VALLEY_TIMEZONE,
  utcOffset: "-07:00",

  /** Map center when the user hasn't shared their location (downtown Phoenix). */
  mapCenter: { lat: 33.4484, lng: -112.074 },

  /**
   * Map tiles. OpenStreetMap's public tiles are fine for development and light use,
   * but their usage policy asks heavy users to pick a tile provider. Choose one before launch.
   */
  mapTiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
} as const;

export { VALLEY_CITIES as CITIES } from "@shared/event-model";
export type { ValleyCity as City } from "@shared/event-model";

/**
 * Absolute base URL, needed for social share previews (Open Graph).
 * - Set NEXT_PUBLIC_SITE_URL in Vercel to override (e.g. a custom domain).
 * - On Vercel, VERCEL_PROJECT_PRODUCTION_URL is provided automatically.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);

  return new URL("http://localhost:3000");
}
