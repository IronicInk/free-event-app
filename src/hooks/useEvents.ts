"use client";

import { createContext, useContext } from "react";
import type { FreeEvent } from "@/lib/types";

/**
 * The public event catalog, loaded once on the server (lib/data/events.ts)
 * in the root layout and shared with every client screen through this context.
 * Includes cancelled events so saved ones can be labeled; browse lists hide them.
 */
export const EventsContext = createContext<FreeEvent[]>([]);

export function useAllEvents(): FreeEvent[] {
  return useContext(EventsContext);
}
