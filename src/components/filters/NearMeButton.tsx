"use client";

import { requestUserLocation, useUserLocation } from "@/hooks/useUserLocation";
import { LocateIcon } from "@/components/ui/icons";

const MESSAGES = {
  idle: null,
  locating: "Finding your location…",
  ready: "Showing distances from your location.",
  denied: "Location is off. You can still browse by city, or turn location on in your browser settings.",
  unavailable: "We couldn't get your location. You can still browse by city.",
} as const;

/**
 * Asks for the user's location only when tapped (FR-3, NFR-7).
 * Declining is fine; the rest of the app keeps working (FR-4).
 */
export function NearMeButton({ onLocated }: { onLocated?: () => void }) {
  const { status } = useUserLocation();
  const message = MESSAGES[status];

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          requestUserLocation();
          onLocated?.();
        }}
        disabled={status === "locating"}
        aria-pressed={status === "ready"}
        className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-60 ${
          status === "ready" ? "bg-fg text-bg" : "bg-surface-2 hover:bg-border"
        }`}
      >
        <LocateIcon className="size-4" />
        {status === "ready" ? "Using your location" : "Use my location"}
      </button>
      {message && (
        <p className="mt-2 text-xs text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
