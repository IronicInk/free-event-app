import type { Metadata } from "next";
import { PublishForm } from "@/components/publish/PublishForm";

export const metadata: Metadata = {
  title: "Post a free event",
  description: "Share your free event with people nearby in under two minutes.",
};

export default function PublishPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Post a <span className="text-brand">free</span> event
      </h1>
      <p className="mt-1 mb-8 text-muted">Takes about 2 minutes. Free events only — always.</p>
      <PublishForm />
    </div>
  );
}
