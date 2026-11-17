"use client";

import { WHEN_LABELS } from "@/lib/filters";
import { WHEN_OPTIONS, type When } from "@/lib/types";
import { Chip } from "./Chip";

interface WhenChipsProps {
  selected: When;
  onSelect: (when: When) => void;
}

/** One-tap date filters: Any time · Today · Tomorrow · This weekend · This week */
export function WhenChips({ selected, onSelect }: WhenChipsProps) {
  return (
    <div role="group" aria-label="When" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {WHEN_OPTIONS.map((when) => (
        <Chip key={when} active={selected === when} onClick={() => onSelect(when)}>
          {WHEN_LABELS[when]}
        </Chip>
      ))}
    </div>
  );
}
