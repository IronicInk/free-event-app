"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useFilteredEvents } from "@/hooks/useFilteredEvents";
import { requestUserLocation, useUserLocation } from "@/hooks/useUserLocation";
import { filtersToQuery } from "@/lib/filters";
import { EventListItem } from "@/components/events/EventListItem";
import { CategoryRail } from "@/components/filters/CategoryRail";
import { FiltersSheet, countSheetFilters } from "@/components/filters/FiltersSheet";
import { WhenChips } from "@/components/filters/WhenChips";
import { ListIcon, LocateIcon, XIcon } from "@/components/ui/icons";

// Leaflet needs `window`, so the map only renders in the browser.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-surface-2" />,
});

/** Round floating button on the map (Google Maps style). */
const FLOAT_BTN =
  "grid size-12 place-items-center rounded-full bg-surface text-fg shadow-lg ring-1 ring-border transition hover:bg-surface-2 active:scale-95";

/**
 * Map / near-me view (FR-3, FR-4). Shares URL filters with Discover.
 * Location is optional: without it the map simply centers on the Valley.
 *
 * Layout: slim filter strip on top, map fills the rest. Map actions float bottom-right
 * within thumb reach; tapping a pin slides up a compact event card above them.
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
  const listHref = `/${filtersToQuery(filters)}`;

  return (
    <div className="flex h-[calc(100dvh-var(--header-h)-var(--nav-h)-env(safe-area-inset-bottom))] flex-col">
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pt-2 pb-3">
        <h1 className="sr-only">Map of free events</h1>
        <CategoryRail selected={filters.category} onSelect={(category) => setFilters({ category })} />
        <WhenChips filters={filters} onChange={setFilters} />
      </div>

      <div className="relative min-h-0 flex-1">
        <LeafletMap
          events={mappable}
          selectedId={selectedId}
          onSelect={onSelect}
          userLocation={location}
        />

        {/* Result count (+ how many can't be shown on the map) */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex justify-start">
          <p className="pointer-events-auto rounded-full bg-surface/95 px-3.5 py-2 text-[13px] font-semibold shadow-md ring-1 ring-border backdrop-blur-md">
            {mappable.length} free {mappable.length === 1 ? "event" : "events"}
            {unmapped > 0 && (
              <>
                <span className="font-normal text-muted"> · {unmapped} not on map · </span>
                <Link href={listHref} className="text-accent">
                  List
                </Link>
              </>
            )}
          </p>
        </div>

        {mappable.length === 0 && (
          <div className="absolute inset-x-4 top-16 z-[500] mx-auto max-w-sm rounded-2xl bg-surface p-5 text-center shadow-lg ring-1 ring-border">
            <p className="font-semibold">No free events match these filters</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 h-11 rounded-full bg-surface-2 px-5 text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}

        {status === "denied" && (
          <p
            role="status"
            className="absolute inset-x-3 top-16 z-[500] mx-auto max-w-sm rounded-2xl bg-surface/95 px-4 py-3 text-[13px] text-muted shadow-md ring-1 ring-border"
          >
            Location is off, so the map is centered on the Valley. You can still filter by city.
          </p>
        )}

        {/* Bottom stack: floating actions, then the selected event card */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-col items-end gap-3">
          <div className="pointer-events-auto flex flex-col gap-3">
            <button
              type="button"
              onClick={requestUserLocation}
              disabled={status === "locating"}
              aria-pressed={status === "ready"}
              aria-label="Show my location"
              className={`${FLOAT_BTN} ${status === "ready" ? "text-blue-500" : ""} ${
                status === "locating" ? "animate-pulse" : ""
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
              buttonClassName="bg-surface text-fg shadow-lg ring-1 ring-border hover:bg-surface-2"
            />
            <Link href={listHref} aria-label="Show as list" className={FLOAT_BTN}>
              <ListIcon className="size-5" />
            </Link>
          </div>

          {selected && (
            <div className="pointer-events-auto relative w-full max-w-md self-center rounded-3xl bg-surface py-1 pr-2 pl-3 shadow-2xl ring-1 ring-border">
              <EventListItem event={selected} showDay />
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                className="absolute -top-3 -left-2 grid size-8 place-items-center rounded-full bg-surface shadow-md ring-1 ring-border"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
