import type { ReactNode } from "react";
import { categoryGradient, getCategory } from "@/lib/categories";
import type { FreeEvent } from "@/lib/types";

interface EventCoverProps {
  event: Pick<FreeEvent, "category" | "imageUrl" | "title">;
  className?: string;
  /** Size of the emoji shown on gradient covers. */
  emojiClassName?: string;
  /** Overlays (badges, buttons) rendered on top of the cover. */
  children?: ReactNode;
}

/**
 * The visual for an event: the source image (only stored when the source permits it, §13),
 * or a bold category gradient with a big emoji so every event looks good without a photo.
 */
export function EventCover({
  event,
  className = "",
  emojiClassName = "text-6xl",
  children,
}: EventCoverProps) {
  const category = getCategory(event.category);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {event.imageUrl ? (
        // Plain <img>: images come from many source domains that next/image would need listed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ backgroundImage: categoryGradient(event.category) }}
        >
          <span className={`drop-shadow-lg select-none ${emojiClassName}`} aria-hidden="true">
            {category.emoji}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
