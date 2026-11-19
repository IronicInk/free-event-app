/** Grey placeholder shapes shown for a split second while a screen loads. Matches the real layout. */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10" aria-busy="true" aria-label="Loading events">
      <div className="h-8 w-3/4 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-8 h-12 animate-pulse rounded-full bg-surface-2" />

      {/* Phones: list rows */}
      <div className="mt-8 space-y-5 md:hidden">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div key={i} className="flex gap-4">
            <div className="size-[5.5rem] shrink-0 animate-pulse rounded-2xl bg-surface-2" />
            <div className="flex-1 space-y-2.5 pt-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Larger screens: card grid */}
      <div className="mt-8 hidden grid-cols-3 gap-6 md:grid lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
