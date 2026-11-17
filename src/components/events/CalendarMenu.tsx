"use client";

import { downloadIcs, googleCalendarUrl } from "@/lib/calendar";
import type { FreeEvent } from "@/lib/types";
import { CalendarIcon, ChevronDownIcon } from "@/components/ui/icons";

/**
 * "Add to calendar" dropdown. Uses <details> so it works with keyboard
 * and screen readers without extra code.
 */
export function CalendarMenu({ event }: { event: FreeEvent }) {
  const pageUrl = () => new URL(`/events/${event.id}`, window.location.origin).toString();

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-full bg-surface-2 px-5 py-3 text-sm font-semibold transition hover:opacity-80 [&::-webkit-details-marker]:hidden">
        <CalendarIcon className="size-5" />
        Add to calendar
        <ChevronDownIcon className="size-4 transition group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <a
          href={googleCalendarUrl(event, `/events/${event.id}`)}
          onClick={(e) => {
            // Swap in the full URL (needs window, so it's done at click time).
            e.currentTarget.href = googleCalendarUrl(event, pageUrl());
          }}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 text-sm hover:bg-surface-2"
        >
          Google Calendar
        </a>
        <button
          type="button"
          onClick={() => downloadIcs(event, pageUrl())}
          className="block w-full px-4 py-3 text-left text-sm hover:bg-surface-2"
        >
          Apple / Outlook (.ics)
        </button>
      </div>
    </details>
  );
}
