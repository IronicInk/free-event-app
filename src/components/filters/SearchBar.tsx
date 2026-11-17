"use client";

import { useEffect, useState } from "react";
import { SearchIcon, XIcon } from "@/components/ui/icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Wait this long after typing stops before searching (avoids URL churn). */
  debounceMs?: number;
}

export function SearchBar({ value, onChange, debounceMs = 250 }: SearchBarProps) {
  // Local text so typing feels instant; the URL updates after a short pause.
  const [text, setText] = useState(value);

  // The last value WE sent. Lets us tell our own URL updates apart from
  // outside changes, so a slow URL update never overwrites what the user is typing.
  const [sent, setSent] = useState(value);

  // If the URL changes from elsewhere (e.g. "Reset all"), sync the input.
  // (React's recommended "adjust state during render" pattern — no effect needed.)
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== sent && value !== text.trim()) {
      setText(value);
      setSent(value);
    }
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => {
      setSent(text.trim());
      onChange(text);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [text, value, onChange, debounceMs]);

  return (
    <div className="relative flex-1">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search events, places, vibes…"
        aria-label="Search events"
        enterKeyHint="search"
        className="h-12 w-full rounded-full bg-surface-2 pr-11 pl-12 text-[16px] outline-none ring-accent transition placeholder:text-muted focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            setSent("");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-border hover:text-fg"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
