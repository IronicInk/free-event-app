"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { DEFAULT_FILTERS, filtersToQuery, parseFilters } from "@/lib/filters";
import type { EventFilters } from "@/lib/types";

/**
 * Reads and updates filters stored in the URL (?q=jazz&when=today…).
 * Components that use this must be inside a <Suspense> boundary.
 */
export function useEventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<EventFilters>) => {
      const next = { ...filters, ...patch };
      // `replace` (not push) so typing in search doesn't flood the back button.
      router.replace(`${pathname}${filtersToQuery(next)}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [setFilters]);

  return { filters, setFilters, resetFilters };
}
