import { Suspense } from "react";
import { DiscoverView } from "@/components/discover/DiscoverView";
import { CardGridSkeleton } from "@/components/ui/Skeletons";

/** Home / Discover. Filters live in the URL, so the view is wrapped in Suspense. */
export default function HomePage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <DiscoverView />
    </Suspense>
  );
}
