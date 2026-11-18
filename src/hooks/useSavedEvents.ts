"use client";

import { useCallback } from "react";
import { createLocalStore } from "@/lib/local-store";

/**
 * IDs of events the user bookmarked, newest first.
 * Stored on this device only. No account needed (FR-11).
 */
const savedStore = createLocalStore<string[]>("fea:saved-event-ids", []);

export function useSavedEvents() {
  const savedIds = savedStore.useValue();

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id: string) => {
    savedStore.update((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );
  }, []);

  /** Drops saved IDs that are no longer in the catalog (expired or withdrawn). */
  const removeSaved = useCallback((ids: string[]) => {
    savedStore.update((prev) => prev.filter((x) => !ids.includes(x)));
  }, []);

  return { savedIds, isSaved, toggleSaved, removeSaved };
}
