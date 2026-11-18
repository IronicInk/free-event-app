"use client";

import { WHEN_LABELS } from "@/lib/filters";
import { dayKey } from "@/lib/dates";
import { WHEN_OPTIONS, type EventFilters } from "@/lib/types";
import { useNow } from "@/hooks/useNow";
import { Chip } from "./Chip";

interface WhenChipsProps {
  filters: Pick<EventFilters, "when" | "from" | "to">;
  onChange: (patch: Partial<EventFilters>) => void;
}

/**
 * One-tap date filters: Any time · Today · Tomorrow · This weekend · This week · Pick dates.
 * "Pick dates" reveals a from/to range (FR-2: day / weekend / custom range).
 */
export function WhenChips({ filters, onChange }: WhenChipsProps) {
  const today = dayKey(useNow());

  return (
    <div>
      <div role="group" aria-label="When" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {WHEN_OPTIONS.map((when) => (
          <Chip
            key={when}
            active={filters.when === when}
            onClick={() =>
              onChange(
                when === "dates"
                  ? { when, from: filters.from ?? today, to: filters.to }
                  : { when, from: null, to: null },
              )
            }
          >
            {WHEN_LABELS[when]}
          </Chip>
        ))}
      </div>

      {filters.when === "dates" && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-muted">
            From
            <input
              type="date"
              value={filters.from ?? ""}
              min={today}
              onChange={(e) => onChange({ from: e.target.value || null })}
              className="mt-1 block rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            To
            <input
              type="date"
              value={filters.to ?? ""}
              min={filters.from ?? today}
              onChange={(e) => onChange({ to: e.target.value || null })}
              className="mt-1 block rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg"
            />
          </label>
        </div>
      )}
    </div>
  );
}
