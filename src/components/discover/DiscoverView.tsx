"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAllEvents } from "@/hooks/useEvents";
import { useEventFilters } from "@/hooks/useEventFilters";
import { useNow } from "@/hooks/useNow";
import { filterEvents, getTrendingEvents } from "@/lib/events";
import { countActiveFilters, DEFAULT_FILTERS, filtersToQuery } from "@/lib/filters";
import { EventGrid, EventRow } from "@/components/events/EventGrid";
import { CategoryRail } from "@/components/filters/CategoryRail";
import { FiltersSheet } from "@/components/filters/FiltersSheet";
import { SearchBar } from "@/components/filters/SearchBar";
import { WhenChips } from "@/components/filters/WhenChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoIcon, ZapIcon } from "@/components/ui/icons";

/**
 * Home screen. Two modes:
 * - No filters: "Trending" carousel + all upcoming events (browse mode).
 * - Any filter/search: a single results grid with a count (search mode).
 */
export function DiscoverView() {
  const { filters, setFilters, resetFilters } = useEventFilters();
  const allEvents = useAllEvents();
  const now = useNow();

  const results = useMemo(() => filterEvents(allEvents, filters, now), [allEvents, filters, now]);
  const trending = useMemo(() => getTrendingEvents(allEvents, now), [allEvents, now]);

  const activeCount = countActiveFilters(filters);
  // Only area + sort live in the sheet, so its badge counts just those.
  const sheetCount =
    (filters.area !== null ? 1 : 0) + (filters.sort !== DEFAULT_FILTERS.sort ? 1 : 0);
  const isBrowsing = activeCount === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Find something <span className="text-brand">free</span> to do
      </h1>
      <p className="mt-1 text-muted">No tickets. No fees. Just good times nearby.</p>

      {/* Sticky search + filters so they're always one thumb-tap away */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 mt-5 bg-bg/90 px-4 pt-2 pb-3 backdrop-blur-md">
        <div className="flex gap-2">
          <SearchBar value={filters.q} onChange={(q) => setFilters({ q })} />
          <FiltersSheet
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            activeCount={sheetCount}
            resultCount={results.length}
          />
        </div>
      </div>

      <div className="space-y-4">
        <CategoryRail selected={filters.category} onSelect={(category) => setFilters({ category })} />
        <WhenChips selected={filters.when} onSelect={(when) => setFilters({ when })} />
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-xs text-muted">
        <InfoIcon className="mt-px size-4 shrink-0" />
        Preview mode: these are sample events while the app is being built.
      </p>

      {isBrowsing ? (
        <>
          {trending.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-xl font-bold">🔥 Trending near you</h2>
                <Link
                  href="/explore"
                  className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                >
                  <ZapIcon className="size-4" /> Swipe mode
                </Link>
              </div>
              <EventRow events={trending} />
            </section>
          )}
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold">Coming up</h2>
            <EventGrid events={results} />
          </section>
        </>
      ) : (
        <section className="mt-6" aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-semibold">
              {results.length} free {results.length === 1 ? "event" : "events"}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              {results.length > 0 && (
                <Link
                  href={`/explore${filtersToQuery(filters)}`}
                  className="flex items-center gap-1 font-semibold text-accent hover:underline"
                >
                  <ZapIcon className="size-4" /> Swipe these
                </Link>
              )}
              <button type="button" onClick={resetFilters} className="font-semibold text-muted hover:text-fg">
                Clear all
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <EventGrid events={results} />
          ) : (
            <EmptyState
              emoji="🔍"
              title="No events match"
              message="Try a different date, area or search word — or clear your filters to see everything."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-brand rounded-full px-5 py-3 text-sm font-semibold text-accent-fg"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </section>
      )}
    </div>
  );
}
