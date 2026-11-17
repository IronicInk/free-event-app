"use client";

import { useCallback } from "react";
import { createLocalStore } from "@/lib/local-store";

/** IDs of events the user bookmarked, newest first. Stored in this browser only. */
const savedStore = createLocalStore<string[]>("fea:saved-event-ids", []);

export function useSavedEvents() {
  const savedIds = savedStore.useValue();

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id: string) => {
    savedStore.update((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );
  }, []);

  return { savedIds, isSaved, toggleSaved };
}
