import type { Metadata } from "next";
import { Suspense } from "react";
import { MapView } from "@/components/map/MapView";

export const metadata: Metadata = {
  title: "Map",
  description: "See free events across the Valley on a map, and find what's near you.",
};

/** Filters live in the URL, so the view is wrapped in Suspense. */
export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[70dvh] animate-pulse bg-surface-2" />}>
      <MapView />
    </Suspense>
  );
}
