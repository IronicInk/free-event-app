"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFilteredEvents } from "@/hooks/useFilteredEvents";
import { getWeekendEvents } from "@/lib/events";
import { countActiveFilters, filtersToQuery } from "@/lib/filters";
import { EventGrid, EventRow } from "@/components/events/EventGrid";
import { CategoryRail } from "@/components/filters/CategoryRail";
import { FiltersSheet, countSheetFilters } from "@/components/filters/FiltersSheet";
import { SearchBar } from "@/components/filters/SearchBar";
import { WhenChips } from "@/components/filters/WhenChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoIcon, MapIcon, ZapIcon } from "@/components/ui/icons";

/**
 * Home screen (FR-1, FR-2, FR-5). Two modes:
 * - No filters: "This weekend" row + all upcoming events, soonest first (browse mode).
 * - Any filter/search: a single results grid with a count (search mode).
 */
export function DiscoverView() {
  const { filters, setFilters, resetFilters, results, allEvents, now, cities, isSampleData } =
    useFilteredEvents();
  const weekend = useMemo(() => getWeekendEvents(allEvents, now), [allEvents, now]);

  const isBrowsing = countActiveFilters(filters) === 0;
  const query = filtersToQuery(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Free things to do in <span className="text-brand">the Valley</span>
      </h1>
      <p className="mt-1 text-muted">
        Farmers markets, festivals, celebrations and more across the Phoenix area. No tickets, no fees.
      </p>

      {/* Sticky search + filters so they're always one thumb-tap away */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 mt-5 bg-bg/90 px-4 pt-2 pb-3 backdrop-blur-md">
        <div className="flex gap-2">
          <SearchBar value={filters.q} onChange={(q) => setFilters({ q })} />
          <FiltersSheet
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            cities={cities}
            activeCount={countSheetFilters(filters)}
            resultCount={results.length}
          />
        </div>
      </div>

      <div className="space-y-4">
        <CategoryRail selected={filters.category} onSelect={(category) => setFilters({ category })} />
        <WhenChips filters={filters} onChange={setFilters} />
      </div>

      {isSampleData && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-xs text-muted">
          <InfoIcon className="mt-px size-4 shrink-0" />
          Preview mode: these are sample events while the app is being built.
        </p>
      )}

      {isBrowsing ? (
        <>
          {weekend.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-xl font-bold">This weekend</h2>
                <Link
                  href="/?when=weekend"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  See all
                </Link>
              </div>
              <EventRow events={weekend} />
            </section>
          )}
          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-bold">Coming up</h2>
              <Link
                href="/map"
                className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
              >
                <MapIcon className="size-4" /> Map
              </Link>
            </div>
            {results.length > 0 ? (
              <EventGrid events={results} />
            ) : (
              <EmptyState
                emoji="🌵"
                title="No upcoming free events yet"
                message="New events are added every night. Check back soon."
              />
            )}
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
                <>
                  <Link
                    href={`/map${query}`}
                    className="flex items-center gap-1 font-semibold text-accent hover:underline"
                  >
                    <MapIcon className="size-4" /> Map
                  </Link>
                  <Link
                    href={`/explore${query}`}
                    className="flex items-center gap-1 font-semibold text-accent hover:underline"
                  >
                    <ZapIcon className="size-4" /> Swipe
                  </Link>
                </>
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
              title="No free events match these filters"
              message="Try a different date, category or city, or clear your filters to see everything."
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

      <footer className="mt-16 text-center text-xs text-muted">
        An independent guide to free events. Not affiliated with any city or agency.{" "}
        <Link href="/about" className="font-semibold underline hover:text-fg">
          About &amp; privacy
        </Link>
      </footer>
    </div>
  );
}
