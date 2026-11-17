"use client";

import { useMemo } from "react";
import { getSampleEvents } from "@/lib/events";
import { createLocalStore } from "@/lib/local-store";
import type { FreeEvent } from "@/lib/types";

/**
 * Events posted from this browser.
 * TEMPORARY: replace with a database so other people can see posted events.
 */
const publishedStore = createLocalStore<FreeEvent[]>("fea:published-events", []);

/** Saves a newly posted event. Returns false if the browser storage is full. */
export function publishEventLocally(event: FreeEvent): boolean {
  return publishedStore.update((prev) => [event, ...prev]);
}

export function usePublishedEvents(): FreeEvent[] {
  return publishedStore.useValue();
}

/** Every event the app knows about: posted-here first, then sample data. */
export function useAllEvents(): FreeEvent[] {
  const published = usePublishedEvents();
  return useMemo(() => [...published, ...getSampleEvents()], [published]);
}
