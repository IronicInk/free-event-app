/**
 * Candidate sources from PROJECT_REQUIREMENTS.md §5.1 and §5.2.
 *
 * ALL ARE DISABLED. None has been verified: the requirements say URLs, feeds,
 * terms of use and robots.txt still need checking, and "a source appearing here is
 * not approval to scrape or republish it."
 *
 * To turn one on (§5.4):
 *   1. Confirm the official URL and find a structured feed (iCal preferred). Put it in `feed_url`
 *      and set `method: "ics"`.
 *   2. Read the terms of use, copyright and robots.txt. Record the date in `terms_checked_at`.
 *   3. Record an `owner` and any `attribution_note`.
 *   4. Look at what the feed contains, and tune functions/src/pipeline/classify.ts if needed.
 *   5. Enable it (curator tool → Sources, or here then `npm run seed-sources`), keeping
 *      `review_policy: "review"` until its quality is proven.
 */
import type { SourceConfig } from "../../../shared/event-model";

function candidate(fields: Pick<SourceConfig, "id" | "name" | "homepage_url"> & Partial<SourceConfig>): SourceConfig {
  return {
    feed_url: null,
    method: "ics",
    enabled: false,
    review_policy: "review",
    default_city: null,
    owner: null,
    terms_checked_at: null,
    attribution_note: null,
    notes: "Not verified. Complete the §5.4 checklist before enabling.",
    ...fields,
  };
}

export const CANDIDATE_SOURCES: SourceConfig[] = [
  // §5.1 Priority: Phoenix
  candidate({ id: "phoenix-city-calendar", name: "City of Phoenix Calendar", homepage_url: "https://www.phoenix.gov/calendar.html", default_city: "Phoenix" }),
  candidate({ id: "phoenix-parks-events", name: "Phoenix Parks Events", homepage_url: "https://www.phoenix.gov/calendar/parks-events.html", default_city: "Phoenix" }),
  candidate({
    id: "phoenix-major-events",
    name: "City of Phoenix Major Events",
    homepage_url: "https://www.phoenix.gov/major-events.html",
    default_city: "Phoenix",
    notes: "Not verified. Paid listings are stored hidden; ticketed concert-venue events must not be ingested (§5.1).",
  }),
  candidate({ id: "phoenix-public-library", name: "Phoenix Public Library", homepage_url: "https://calendar.phoenixpubliclibrary.org/", default_city: "Phoenix" }),
  // §5.1 Priority: Tempe
  candidate({
    id: "tempe-city-calendar",
    name: "City of Tempe Calendar",
    homepage_url: "https://www.tempe.gov/calendar",
    default_city: "Tempe",
    notes: "Not verified. Mixes meetings with community events; meetings are filtered by classify.ts.",
  }),
  candidate({ id: "tempe-things-to-do", name: "City of Tempe Things to Do", homepage_url: "https://www.tempe.gov/government/communication-and-marketing/things-to-do", default_city: "Tempe" }),
  candidate({
    id: "tempe-parks-recreation",
    name: "Tempe Parks & Recreation",
    homepage_url: "https://teamsideline.com/sites/tempe/calendar",
    default_city: "Tempe",
    notes: "Not verified. Expect many sports leagues/games, which are out of scope and filtered by classify.ts.",
  }),
  candidate({ id: "tempe-public-library", name: "Tempe Public Library", homepage_url: "https://tempepubliclibrary.libnet.info/", default_city: "Tempe" }),
  // §5.2 Farmers markets
  candidate({ id: "az-community-farmers-markets", name: "Arizona Community Farmers Markets", homepage_url: "https://arizonacommunityfarmersmarkets.com/" }),
  candidate({ id: "downtown-phx-farmers-market", name: "Downtown PHX Farmers Market", homepage_url: "https://downtownphoenixfarmersmarket.org/", default_city: "Phoenix" }),
];
