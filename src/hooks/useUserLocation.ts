"use client";

import { useSyncExternalStore } from "react";
import type { LatLng } from "@/lib/types";

/**
 * The user's location for "near me" (FR-3).
 * - Only requested when the user taps a "near me" control, never on page load.
 * - Kept in memory on this device only: never sent to a server or put in a URL (NFR-7).
 * - Declining is fine: everything else keeps working (FR-4).
 */
export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

interface LocationState {
  status: LocationStatus;
  location: LatLng | null;
}

let state: LocationState = { status: "idle", location: null };
const listeners = new Set<() => void>();

function setState(next: LocationState) {
  state = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

const SERVER_STATE: LocationState = { status: "idle", location: null };

/** Asks the browser for the user's position. Safe to call repeatedly. */
export function requestUserLocation(): void {
  if (state.status === "locating") return;
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setState({ status: "unavailable", location: null });
    return;
  }
  setState({ ...state, status: "locating" });
  navigator.geolocation.getCurrentPosition(
    ({ coords }) =>
      setState({
        status: "ready",
        // ~100 m precision is plenty for "near me" and avoids holding an exact position.
        location: { lat: Number(coords.latitude.toFixed(3)), lng: Number(coords.longitude.toFixed(3)) },
      }),
    (error) =>
      setState({
        status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        location: null,
      }),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
  );
}

export function useUserLocation(): LocationState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
