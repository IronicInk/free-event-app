/**
 * Geocoding (§7.5). The provider is an open decision (§8, open question 12),
 * so this is a plug-in point.
 *
 * Until a provider is chosen, events without source coordinates keep
 * geocode_status "pending" and a "needs_geocode" review reason. A curator can
 * add coordinates in the review tool, or publish without a map pin (the event
 * still shows in the list, just not on the map).
 *
 * To add a provider: implement `Geocoder`, keep its API key in a Functions secret
 * (defineSecret), never in the client (NFR-6), and return it from getGeocoder().
 */
import { isInsideValley } from "../../../shared/event-model";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export interface Geocoder {
  readonly name: string;
  geocode(query: string): Promise<GeocodeResult | null>;
}

/** Default: does nothing, so no cost and no third-party terms until founders choose. */
export const noGeocoder: Geocoder = {
  name: "none",
  async geocode() {
    return null;
  },
};

export function getGeocoder(): Geocoder {
  return noGeocoder;
}

/** Geocodes and sanity-checks the result is inside the Valley. */
export async function geocodeInValley(
  geocoder: Geocoder,
  parts: { venue_name: string | null; address: string | null; city: string | null },
): Promise<{ status: "ok"; result: GeocodeResult } | { status: "pending" | "failed" }> {
  if (geocoder === noGeocoder) return { status: "pending" };
  const query = [parts.venue_name, parts.address, parts.city, "AZ"].filter(Boolean).join(", ");
  if (!parts.address && !parts.venue_name) return { status: "failed" };
  try {
    const result = await geocoder.geocode(query);
    if (!result || !isInsideValley(result.latitude, result.longitude)) return { status: "failed" };
    return { status: "ok", result };
  } catch {
    return { status: "failed" };
  }
}
