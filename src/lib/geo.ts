import type { FreeEvent, LatLng } from "./types";

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Straight-line ("as the crow flies") distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/** Distance from the user to an event, or null if either location is unknown. */
export function eventDistance(event: FreeEvent, from: LatLng | null): number | null {
  if (!from || event.lat === undefined || event.lng === undefined) return null;
  return distanceMiles(from, { lat: event.lat, lng: event.lng });
}

/** "0.4 mi", "3 mi", "12 mi" */
export function formatDistance(miles: number): string {
  return miles < 1 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}
