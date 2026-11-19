"use client";

import { useScrollFade } from "@/hooks/useScrollFade";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

interface CategoryRailProps {
  selected: CategoryId | null;
  onSelect: (category: CategoryId | null) => void;
}

/**
 * Swipeable category tabs: emoji over a one-line label, with an underline on the active tab.
 * Compact (about 64px tall) so events show up sooner on a phone screen.
 * Tap the active category again to clear it.
 */
export function CategoryRail({ selected, onSelect }: CategoryRailProps) {
  const scrollRef = useScrollFade<HTMLDivElement>();
  const items = [
    { id: null, label: "All", emoji: "✨" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  return (
    // The border sits on a wrapper so the edge fade doesn't fade the divider line too.
    <div className="-mx-4 border-b border-border">
      <div
        ref={scrollRef}
        role="group"
        aria-label="Categories"
        className="no-scrollbar scroll-fade overflow-x-auto px-4"
      >
        <ul className="flex gap-6">
          {items.map((item) => {
            const active = selected === item.id;
            return (
              <li key={item.label} className="shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onSelect(active && item.id !== null ? null : item.id)
                  }
                  aria-pressed={active}
                  className={`relative flex min-w-11 flex-col items-center gap-1.5 pt-2 pb-4 text-xs font-semibold whitespace-nowrap transition ${
                    active ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {item.emoji}
                  </span>
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full transition ${
                      active ? "bg-fg" : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
