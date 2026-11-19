"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFilteredEvents } from "@/hooks/useFilteredEvents";
import { getWeekendEvents } from "@/lib/events";
import { countActiveFilters, filtersToQuery } from "@/lib/filters";
import { EventRow } from "@/components/events/EventGrid";
import { EventList } from "@/components/events/EventList";
import { CategoryRail } from "@/components/filters/CategoryRail";
import { FiltersSheet, countSheetFilters } from "@/components/filters/FiltersSheet";
import { SearchBar } from "@/components/filters/SearchBar";
import { WhenChips } from "@/components/filters/WhenChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon, InfoIcon, MapIcon, ZapIcon } from "@/components/ui/icons";

/** Height of the sticky search bar (16px + 48px + 16px). Day headings stick just below it. */
const STICKY_TOP = "calc(var(--header-h) + 80px)";

/**
 * Home screen (FR-1, FR-2, FR-5). Two modes:
 * - No filters: "This weekend" carousel + an agenda of everything coming up (browse mode).
 * - Any filter/search: one results list with a count (search mode).
 *
 * Spacing follows an 8pt rhythm: 16px page gutter, 40px between sections,
 * 16px between a heading and its content.
 */
export function DiscoverView() {
  const { filters, setFilters, resetFilters, results, allEvents, now, cities, isSampleData } =
    useFilteredEvents();
  const weekend = useMemo(() => getWeekendEvents(allEvents, now), [allEvents, now]);

  const isBrowsing = countActiveFilters(filters) === 0;
  const byDate = filters.sort === "soonest";
  const query = filtersToQuery(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:pt-10">
      <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight text-balance sm:text-4xl">
        Free things to do in <span className="text-brand">the Valley</span>
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted sm:text-base">
        Markets, festivals and celebrations across the Phoenix area. Always free.
      </p>

      {/* Sticky search + filters so they're always one thumb-tap away */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 mt-6 bg-bg/90 px-4 py-4 backdrop-blur-md">
        <div className="flex gap-3">
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

      <div className="mt-2 space-y-6">
        <CategoryRail selected={filters.category} onSelect={(category) => setFilters({ category })} />
        <WhenChips filters={filters} onChange={setFilters} />
      </div>

      {isSampleData && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px] text-muted">
          <InfoIcon className="size-4 shrink-0" />
          Preview: these are sample events.
        </p>
      )}

      {isBrowsing ? (
        <>
          {weekend.length > 0 && (
            <section className="mt-10">
              <SectionHeader title="This weekend" href="/?when=weekend" linkLabel="See all" />
              <EventRow events={weekend} />
            </section>
          )}
          <section className="mt-10">
            <SectionHeader
              title="Coming up"
              href="/map"
              linkLabel="Map"
              icon={<MapIcon className="size-4" />}
            />
            {results.length > 0 ? (
              <EventList events={results} groupByDate={byDate} stickyTop={STICKY_TOP} />
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
        <section className="mt-8" aria-live="polite">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {results.length} free {results.length === 1 ? "event" : "events"}
            </h2>
            <button
              type="button"
              onClick={resetFilters}
              className="-mr-2 h-11 px-2 text-sm font-semibold text-muted hover:text-fg"
            >
              Clear all
            </button>
          </div>

          {results.length > 0 && (
            <div className="mb-4 flex gap-2">
              <ViewLink href={`/map${query}`} icon={<MapIcon className="size-4" />} label="View on map" />
              <ViewLink href={`/explore${query}`} icon={<ZapIcon className="size-4" />} label="Swipe through" />
            </div>
          )}

          {results.length > 0 ? (
            <EventList events={results} groupByDate={byDate} stickyTop={STICKY_TOP} />
          ) : (
            <EmptyState
              emoji="🔍"
              title="No free events match these filters"
              message="Try a different date, category or city, or clear your filters to see everything."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-brand h-12 rounded-full px-6 text-sm font-semibold text-accent-fg"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </section>
      )}

      <footer className="mt-16 border-t border-border pt-6 text-center text-[13px] leading-relaxed text-muted">
        An independent guide to free events.
        <br />
        Not affiliated with any city or agency.{" "}
        <Link href="/about" className="font-semibold text-fg underline-offset-2 hover:underline">
          About &amp; privacy
        </Link>
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
  icon,
}: {
  title: string;
  href: string;
  linkLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <Link
        href={href}
        className="-mr-2 flex h-11 items-center gap-1 px-2 text-sm font-semibold text-accent"
      >
        {icon}
        {linkLabel}
        {!icon && <ChevronRightIcon className="size-4" />}
      </Link>
    </div>
  );
}

function ViewLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-semibold transition hover:bg-border active:scale-95"
    >
      {icon}
      {label}
    </Link>
  );
}
