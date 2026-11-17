import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView } from "@/components/explore/ExploreView";

export const metadata: Metadata = {
  title: "Explore",
  description: "Swipe through free events happening near you.",
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[70dvh] max-w-md animate-pulse bg-surface-2 md:mt-4 md:rounded-3xl" />}>
      <ExploreView />
    </Suspense>
  );
}
