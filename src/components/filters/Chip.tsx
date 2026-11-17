import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Pill-shaped toggle used for quick filters. */
export function Chip({ active = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition active:scale-95 ${
        active ? "bg-fg text-bg" : "bg-surface-2 text-fg hover:bg-border"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
