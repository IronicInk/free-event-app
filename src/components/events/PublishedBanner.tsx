"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "@/components/ui/icons";

/** Celebration banner shown right after someone posts an event (?published=1). */
export function PublishedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  if (searchParams.get("published") !== "1") return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div role="status" className="bg-brand flex items-start gap-3 rounded-2xl p-4 text-accent-fg">
        <span className="text-2xl" aria-hidden="true">
          🎉
        </span>
        <div className="flex-1 text-sm">
          <p className="font-bold">Your event is posted!</p>
          <p className="opacity-90">
            Share it so people can find it. (Preview mode: posted events are saved on this device only
            until the app is connected to a database.)
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/20"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
