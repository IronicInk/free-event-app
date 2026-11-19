import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Pill-shaped toggle used for quick filters. 40px tall, with 8px gaps between chips. */
export function Chip({ active = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition active:scale-95 ${
        active ? "bg-fg text-bg" : "bg-surface-2 text-fg hover:bg-border"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
