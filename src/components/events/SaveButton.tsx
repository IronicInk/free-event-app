"use client";

import { useSavedEvents } from "@/hooks/useSavedEvents";
import { BookmarkIcon } from "@/components/ui/icons";

interface SaveButtonProps {
  eventId: string;
  eventTitle: string;
  /**
   * - overlay: small round button on top of a card cover
   * - rail: TikTok-style icon + label on the Explore feed
   * - pill: full button on the event page
   */
  variant?: "overlay" | "rail" | "pill";
}

export function SaveButton({
  eventId,
  eventTitle,
  variant = "overlay",
}: SaveButtonProps) {
  const { isSaved, toggleSaved } = useSavedEvents();
  const saved = isSaved(eventId);
  const label = saved ? `Remove ${eventTitle} from saved` : `Save ${eventTitle}`;

  const icon = (
    <BookmarkIcon
      className={variant === "rail" ? "size-7" : "size-5"}
      fill={saved ? "currentColor" : "none"}
    />
  );

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={() => toggleSaved(eventId)}
        aria-pressed={saved}
        aria-label={label}
        className="flex flex-col items-center gap-1 text-xs font-semibold text-white"
      >
        <span
          className={`grid size-12 place-items-center rounded-full backdrop-blur-sm transition active:scale-90 ${
            saved ? "bg-white text-accent" : "bg-black/30"
          }`}
        >
          {icon}
        </span>
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => toggleSaved(eventId)}
        aria-pressed={saved}
        className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 ${
          saved ? "bg-surface-2 text-accent" : "bg-brand text-accent-fg"
        }`}
      >
        {icon}
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleSaved(eventId)}
      aria-pressed={saved}
      aria-label={label}
      className={`grid size-9 place-items-center rounded-full backdrop-blur-sm transition active:scale-90 ${
        saved ? "bg-white text-accent" : "bg-black/35 text-white hover:bg-black/50"
      }`}
    >
      {icon}
    </button>
  );
}
