/**
 * Site-wide settings.
 * Change the app name, region or areas here and it updates everywhere.
 */

export const SITE = {
  name: "Free Event App",
  tagline: "Free things to do near you",
  description:
    "Discover free events happening around you. No tickets, no fees, just fun things to do.",

  /**
   * All event times are shown in this time zone.
   * Arizona does not observe daylight saving, so the offset is always -07:00.
   * If the app expands beyond Arizona, store a time zone per event instead.
   */
  timeZone: "America/Phoenix",
  utcOffset: "-07:00",
} as const;

/** Areas (cities / neighborhoods) people can filter by and publish to. */
export const AREAS = ["Tempe", "Phoenix", "Mesa", "Scottsdale", "Chandler"] as const;
export type Area = (typeof AREAS)[number];

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
