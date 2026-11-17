/** Grey placeholder shapes shown for a split second while a screen loads. */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5" aria-busy="true" aria-label="Loading events">
      <div className="h-9 w-2/3 animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-6 h-12 animate-pulse rounded-full bg-surface-2" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
