"use client";

import type { ReactNode } from "react";
import { EventsContext } from "@/hooks/useEvents";
import type { FreeEvent } from "@/lib/types";

export function EventsProvider({ events, children }: { events: FreeEvent[]; children: ReactNode }) {
  return <EventsContext value={events}>{children}</EventsContext>;
}
