"use client";

import { CATEGORIES, categoryGradient } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";

interface CategoryRailProps {
  selected: CategoryId | null;
  onSelect: (category: CategoryId | null) => void;
}

/**
 * Instagram "Stories"-style row of category circles.
 * Tap to filter; tap the active one again to clear.
 */
export function CategoryRail({ selected, onSelect }: CategoryRailProps) {
  const items = [
    { id: null, label: "All", emoji: "✨", background: "linear-gradient(135deg, var(--accent), var(--accent-2))" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji, background: categoryGradient(c.id) })),
  ];

  return (
    <div role="group" aria-label="Categories" className="no-scrollbar -mx-4 overflow-x-auto px-4">
      <ul className="flex gap-3 py-1">
        {items.map((item) => {
          const active = selected === item.id;
          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => onSelect(active && item.id !== null ? null : item.id)}
                aria-pressed={active}
                className="flex w-20 flex-col items-center gap-1.5 text-xs font-medium"
              >
                {/* Gradient ring = active, like an unseen story */}
                <span
                  className="rounded-full p-[3px] transition"
                  style={{ background: active ? item.background : "var(--border)" }}
                >
                  <span className="grid size-14 place-items-center rounded-full border-[3px] border-bg bg-surface-2 text-2xl transition active:scale-90">
                    {item.emoji}
                  </span>
                </span>
                <span className={`text-center leading-tight ${active ? "text-fg" : "text-muted"}`}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
