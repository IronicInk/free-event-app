"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useFilteredEvents } from "@/hooks/useFilteredEvents";
import { requestUserLocation, useUserLocation } from "@/hooks/useUserLocation";
import { filtersToQuery } from "@/lib/filters";
import { EventCard } from "@/components/events/EventCard";
import { CategoryRail } from "@/components/filters/CategoryRail";
import { FiltersSheet, countSheetFilters } from "@/components/filters/FiltersSheet";
import { WhenChips } from "@/components/filters/WhenChips";
import { ListIcon, LocateIcon, XIcon } from "@/components/ui/icons";

// Leaflet needs `window`, so the map only renders in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface-2" />,
});

/**
 * Map / near-me view (FR-3, FR-4). Shares URL filters with Discover.
 * Location is optional: without it the map simply centers on the Valley.
 */
export function MapView() {
  const { filters, setFilters, resetFilters, results, cities } = useFilteredEvents();
  const { location, status } = useUserLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappable = useMemo(
    () => results.filter((e) => e.lat !== undefined && e.lng !== undefined),
    [results],
  );
  const unmapped = results.length - mappable.length;
  const selected = mappable.find((e) => e.id === selectedId) ?? null;
  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <div className="flex h-[calc(100dvh-var(--header-h)-var(--nav-h)-env(safe-area-inset-bottom))] flex-col">
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">
            Map <span className="text-base font-medium text-muted">· {mappable.length} free events</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={status === "locating"}
              aria-pressed={status === "ready"}
              aria-label="Show my location"
              className={`grid size-12 place-items-center rounded-full transition active:scale-95 ${
                status === "ready" ? "bg-fg text-bg" : "bg-surface-2 hover:bg-border"
              }`}
            >
              <LocateIcon className="size-5" />
            </button>
            <FiltersSheet
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              cities={cities}
              activeCount={countSheetFilters(filters)}
              resultCount={results.length}
            />
            <Link
              href={`/${filtersToQuery(filters)}`}
              aria-label="Show as list"
              className="grid size-12 place-items-center rounded-full bg-surface-2 hover:bg-border"
            >
              <ListIcon className="size-5" />
            </Link>
          </div>
        </div>
        <CategoryRail selected={filters.category} onSelect={(category) => setFilters({ category })} />
        <WhenChips filters={filters} onChange={setFilters} />
        {status === "denied" && (
          <p className="text-xs text-muted" role="status">
            Location is off, so the map is centered on the Valley. You can still filter by city.
          </p>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <LeafletMap
          events={mappable}
          selectedId={selectedId}
          onSelect={onSelect}
          userLocation={location}
        />

        {unmapped > 0 && (
          <p className="absolute top-3 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-surface/95 px-3 py-1.5 text-xs text-muted shadow">
            {unmapped} more {unmapped === 1 ? "event has" : "events have"} no map location.{" "}
            <Link href={`/${filtersToQuery(filters)}`} className="font-semibold text-fg underline">
              See list
            </Link>
          </p>
        )}

        {mappable.length === 0 && (
          <div className="absolute inset-x-4 top-14 z-[500] mx-auto max-w-sm rounded-2xl bg-surface p-4 text-center text-sm shadow-lg">
            <p className="font-semibold">No free events match these filters</p>
            <button type="button" onClick={resetFilters} className="mt-2 font-semibold text-accent">
              Clear filters
            </button>
          </div>
        )}

        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[500] mx-auto max-w-xs rounded-3xl bg-surface p-3 shadow-2xl ring-1 ring-border">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 grid size-9 place-items-center rounded-full bg-surface shadow ring-1 ring-border"
            >
              <XIcon className="size-4" />
            </button>
            <EventCard event={selected} coverAspect="wide" />
          </div>
        )}
      </div>
    </div>
  );
}
