import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & privacy",
  description: `What ${SITE.name} is, where listings come from, and what data we keep.`,
};

/**
 * About + privacy (FR-10: not an official calendar; NFR-7: privacy policy;
 * NFR-9: attribution). Have this reviewed before any app-store submission.
 */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-6 pb-16 leading-relaxed">
      <h1 className="text-3xl font-bold tracking-tight">About {SITE.name}</h1>
      <p className="mt-3 text-muted">
        {SITE.name} is a curated list of <strong className="text-fg">free</strong> local events
        across the Phoenix metro: farmers markets, festivals, celebrations, parks, arts and more.
        Every event in the list is free to attend, with no admission or ticket fee.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Where listings come from</h2>
      <p className="mt-2 text-muted">
        We gather events from public calendars, such as city, library, parks and market
        calendars. A person reviews them before they appear. Every event links back to its
        original listing. {SITE.name} is an independent guide. It is{" "}
        <strong className="text-fg">not an official calendar</strong> and is not affiliated with
        the City of Phoenix, the City of Tempe or any other city or agency. Please confirm
        details with the organizer before you go.
      </p>
      <p className="mt-2 text-muted">
        Run a calendar and want a listing changed or removed? Contact us and we&apos;ll take care
        of it.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Privacy</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
        <li>
          <strong className="text-fg">No account.</strong> You don&apos;t need to sign in to use{" "}
          {SITE.name}, and we don&apos;t collect your name or email.
        </li>
        <li>
          <strong className="text-fg">Saved events stay on your device.</strong> Bookmarks are
          stored in your browser only. Clearing your browser data removes them.
        </li>
        <li>
          <strong className="text-fg">Location is optional.</strong> If you tap &ldquo;Use my
          location&rdquo;, your browser shares an approximate position with this page so it can
          show distances. It is used on your device only. It isn&apos;t sent to our servers or
          stored.
        </li>
        <li>
          <strong className="text-fg">Map tiles.</strong> The map loads its images from
          OpenStreetMap. Like any website, their servers see your IP address when the map
          loads.
        </li>
      </ul>

      <p className="mt-10">
        <Link href="/" className="font-semibold text-accent hover:underline">
          ← Find something free to do
        </Link>
      </p>
    </article>
  );
}
