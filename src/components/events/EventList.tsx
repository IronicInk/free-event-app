"use client";

import { useMemo } from "react";
import { useNow } from "@/hooks/useNow";
import { formatShortDate, groupByDay, relativeDayLabel } from "@/lib/dates";
import type { FreeEvent } from "@/lib/types";
import { EventGrid } from "./EventGrid";
import { EventListItem } from "./EventListItem";

interface EventListProps {
  events: FreeEvent[];
  /** Group phone rows under day headings ("Today", "Saturday"…). Use when sorted by date. */
  groupByDate?: boolean;
  /** Pin day headings under a sticky bar of this height (CSS length). */
  stickyTop?: string;
}

/**
 * The main event list.
 * - Phones: full-width rows, grouped by day like an agenda (easy to scan with a thumb).
 * - Tablet / desktop: the visual card grid.
 */
export function EventList({ events, groupByDate = true, stickyTop }: EventListProps) {
  const now = useNow();
  const groups = useMemo(() => (groupByDate ? groupByDay(events) : null), [events, groupByDate]);

  return (
    <>
      <div className="md:hidden">
        {groups ? (
          <div className="space-y-6">
            {groups.map((group) => {
              const label = relativeDayLabel(group.date, now);
              const fullDate = formatShortDate(group.date);
              return (
                <section key={group.key} aria-label={label}>
                  <h3
                    className={`z-20 -mx-4 flex items-baseline gap-2 bg-bg/95 px-4 py-2 backdrop-blur-md ${stickyTop ? "sticky" : ""}`}
                    style={stickyTop ? { top: stickyTop } : undefined}
                  >
                    <span className="text-[15px] font-bold">{label}</span>
                    {label !== fullDate && <span className="text-[13px] text-muted">{fullDate}</span>}
                  </h3>
                  <ul className="divide-y divide-border">
                    {group.events.map((event) => (
                      <li key={event.id}>
                        <EventListItem event={event} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <EventListItem event={event} showDay />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden md:block">
        <EventGrid events={events} />
      </div>
    </>
  );
}
