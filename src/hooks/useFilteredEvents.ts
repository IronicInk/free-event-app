"use client";

import { useMemo } from "react";
import { citiesWithEvents, filterEvents } from "@/lib/events";
import { useAllEvents } from "./useEvents";
import { useEventFilters } from "./useEventFilters";
import { useNow } from "./useNow";
import { useUserLocation } from "./useUserLocation";

/**
 * Everything a browse screen (Discover, Map, Explore) needs: URL filters,
 * the matching events, and the cities that have events.
 * Must be used inside a <Suspense> boundary (it reads the URL).
 */
export function useFilteredEvents() {
  const { filters, setFilters, resetFilters } = useEventFilters();
  const allEvents = useAllEvents();
  const now = useNow();
  const { location } = useUserLocation();

  const results = useMemo(
    () => filterEvents(allEvents, filters, now, location),
    [allEvents, filters, now, location],
  );
  const cities = useMemo(() => citiesWithEvents(allEvents, now), [allEvents, now]);
  const isSampleData = allEvents.some((e) => e.isSample);

  return { filters, setFilters, resetFilters, results, allEvents, now, cities, isSampleData };
}
