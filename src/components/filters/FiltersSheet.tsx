"use client";

import { useRef } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { SORT_LABELS } from "@/lib/filters";
import { RADIUS_OPTIONS, SORT_OPTIONS, type EventFilters, type ValleyCity } from "@/lib/types";
import { SlidersIcon, XIcon } from "@/components/ui/icons";
import { Chip } from "./Chip";
import { NearMeButton } from "./NearMeButton";

interface FiltersSheetProps {
  filters: EventFilters;
  onChange: (patch: Partial<EventFilters>) => void;
  onReset: () => void;
  /** Cities to offer (the ones that currently have events). */
  cities: ValleyCity[];
  activeCount: number;
  resultCount: number;
  /** Overrides the trigger button's look (e.g. floating on the map). */
  buttonClassName?: string;
}

/** How many filters live in this sheet (for its badge). */
export function countSheetFilters(filters: EventFilters): number {
  return [filters.city !== null, filters.sort !== "soonest", filters.radius !== null].filter(Boolean)
    .length;
}

/**
 * "Filters" button that opens a bottom sheet on mobile (centered dialog on desktop)
 * with the less-used filters: city, near me, and sort order.
 * Built on <dialog>, which handles focus trapping and the Esc key for us.
 */
export function FiltersSheet({
  filters,
  onChange,
  onReset,
  cities,
  activeCount,
  resultCount,
  buttonClassName = "bg-surface-2 hover:bg-border",
}: FiltersSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();
  const { status } = useUserLocation();
  const hasLocation = status === "ready";

  // Keep a city chosen from a shared link visible even if it has no events right now.
  const cityOptions =
    filters.city && !cities.includes(filters.city) ? [...cities, filters.city] : cities;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Filters${activeCount ? `, ${activeCount} active` : ""}`}
        className={`relative grid size-12 shrink-0 place-items-center rounded-full transition active:scale-95 ${buttonClassName}`}
      >
        <SlidersIcon className="size-5" />
        {activeCount > 0 && (
          <span className="bg-brand absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-[11px] font-bold text-accent-fg">
            {activeCount}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        // Clicking the dark backdrop closes the sheet.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-3xl bg-surface p-0 text-fg sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-5">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Filters</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close filters"
              className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-surface-2"
            >
              <XIcon className="size-5" />
            </button>
          </div>

          <fieldset>
            <legend className="mb-3 text-[15px] font-semibold">City</legend>
            <div className="flex flex-wrap gap-2">
              <Chip active={filters.city === null} onClick={() => onChange({ city: null })}>
                All of the Valley
              </Chip>
              {cityOptions.map((city) => (
                <Chip key={city} active={filters.city === city} onClick={() => onChange({ city })}>
                  {city}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="mb-3 text-[15px] font-semibold">Near me</legend>
            <NearMeButton />
            {hasLocation && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip active={filters.radius === null} onClick={() => onChange({ radius: null })}>
                  Any distance
                </Chip>
                {RADIUS_OPTIONS.map((radius) => (
                  <Chip
                    key={radius}
                    active={filters.radius === radius}
                    onClick={() => onChange({ radius })}
                  >
                    Within {radius} mi
                  </Chip>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="mt-7">
            <legend className="mb-3 text-[15px] font-semibold">Sort by</legend>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((sort) => (
                <Chip
                  key={sort}
                  active={filters.sort === sort}
                  disabled={sort === "nearest" && !hasLocation}
                  onClick={() => onChange({ sort })}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {SORT_LABELS[sort]}
                </Chip>
              ))}
            </div>
            {!hasLocation && (
              <p className="mt-2 text-xs text-muted">Turn on &ldquo;Use my location&rdquo; to sort by distance.</p>
            )}
          </fieldset>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onReset}
              className="h-12 flex-1 rounded-full bg-surface-2 text-sm font-semibold hover:bg-border"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={close}
              className="bg-brand h-12 flex-[2] rounded-full text-sm font-semibold text-accent-fg"
            >
              Show {resultCount} {resultCount === 1 ? "event" : "events"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
