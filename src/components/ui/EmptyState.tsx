import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  /** Optional button / link, e.g. "Clear filters". */
  action?: ReactNode;
}

/** Friendly "nothing here" message so users always know what to do next. */
export function EmptyState({ emoji, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
