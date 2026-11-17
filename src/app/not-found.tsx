import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      emoji="🧭"
      title="Page not found"
      message="That page wandered off. Let's find you something fun to do instead."
      action={
        <Link href="/" className="bg-brand rounded-full px-5 py-3 text-sm font-semibold text-accent-fg">
          Discover events
        </Link>
      }
    />
  );
}
