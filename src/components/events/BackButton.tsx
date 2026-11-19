"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/ui/icons";

/**
 * Goes back to wherever the user came from (keeping their filters and scroll position).
 * If they landed here from a shared link, it goes to the home screen instead of leaving the site.
 */
export function BackButton({ className = "", label = "Back" }: { className?: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        const cameFromHere =
          document.referrer && new URL(document.referrer).origin === window.location.origin;
        if (cameFromHere && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className={className}
    >
      <ArrowLeftIcon className="size-5" />
    </button>
  );
}
