/**
 * Tests for the pipeline rules. Run with: npm test (from functions/).
 * Pure functions only: no network, no Firestore.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPubliclyReadable, type SourceConfig } from "../../shared/event-model";
import { classifyPrice, exclusionReason, guessCategory } from "../src/pipeline/classify";
import { newRecord, updateRecord, type Stored } from "../src/pipeline/decide";
import { canonicalId, collapseSeries, dedupeKey, EventIndex } from "../src/pipeline/dedupe";
import { eventsFromIcs } from "../src/pipeline/fetchers/ics";
import { cleanTitle, normalize, parseLocation, type Candidate } from "../src/pipeline/normalize";
import { isAllowed, parseRobots } from "../src/pipeline/robots";
import type { RawEvent } from "../src/pipeline/types";

const NOW = new Date("2026-11-18T08:00:00-07:00");

const SOURCE: SourceConfig = {
  id: "tempe-city-calendar",
  name: "City of Tempe Calendar",
  homepage_url: "https://www.tempe.gov/calendar",
  feed_url: "https://example.org/tempe.ics",
  method: "ics",
  enabled: true,
  review_policy: "review",
  default_city: "Tempe",
  owner: "test",
  terms_checked_at: null,
  attribution_note: null,
  notes: null,
};

function raw(fields: Partial<RawEvent>): RawEvent {
  return {
    source_event_id: "evt-1",
    title: "Community Festival",
    description: "Free and open to the public.",
    start: new Date("2026-11-28T11:00:00-07:00"),
    end: new Date("2026-11-28T15:00:00-07:00"),
    all_day: false,
    location_text: "Kiwanis Park, 6111 S All-America Way, Tempe, AZ 85283",
    latitude: 33.37,
    longitude: -111.93,
    url: "https://www.tempe.gov/calendar/festival",
    categories: [],
    price_text: null,
    cancelled: false,
    recurrence_rule: null,
    recurrence_note: null,
    organizer: null,
    image_url: null,
    ...fields,
  };
}

function keep(fields: Partial<RawEvent>, source = SOURCE): Candidate {
  const result = normalize(raw(fields), source);
  assert.equal(result.kind, "keep", `expected keep, got ${JSON.stringify(result)}`);
  return (result as { candidate: Candidate }).candidate;
}

describe("robots.txt", () => {
  const policy = {
    groups: parseRobots(`
      User-agent: *
      Disallow: /private/
      Allow: /private/events/
      Disallow: /*.pdf$

      User-agent: ValleyVibeBot
      Disallow: /calendar/admin
    `),
  };
  it("uses the most specific user-agent group", () => {
    assert.equal(isAllowed(policy, "valleyvibebot", "/private/x"), true); // our group has no /private rule
    assert.equal(isAllowed(policy, "valleyvibebot", "/calendar/admin"), false);
  });
  it("longest match wins, Allow beats Disallow", () => {
    assert.equal(isAllowed(policy, "otherbot", "/private/x"), false);
    assert.equal(isAllowed(policy, "otherbot", "/private/events/1"), true);
    assert.equal(isAllowed(policy, "otherbot", "/files/a.pdf"), false);
  });
  it("missing robots.txt allows; unreachable denies", () => {
    assert.equal(isAllowed({ groups: null }, "x", "/"), true);
    assert.equal(isAllowed({ groups: "deny-all" }, "x", "/"), false);
  });
});

describe("free vs paid", () => {
  const price = (text: string) =>
    classifyPrice({ title: "Event", description: text, price_text: null, categories: [] });

  it("clearly free", () => {
    assert.deepEqual([price("Free admission!").is_free, price("Free admission!").confidence], [true, "high"]);
  });
  it("free with optional purchases stays free", () => {
    const p = price("Free to attend. Food trucks on site; parking $10.");
    assert.equal(p.is_free, true);
    assert.equal(p.review_reason, null);
  });
  it("admission price is paid", () => {
    const p = price("General admission $25. Tickets at the door.");
    assert.equal(p.is_free, false);
    assert.equal(p.confidence, "high");
  });
  it("$0 counts as free", () => {
    assert.equal(price("Cost: $0. Free for everyone.").is_free, true);
  });
  it("ambiguous wording goes to review", () => {
    assert.equal(price("Suggested donation $5").review_reason, "suggested_donation");
    assert.equal(price("Free for residents with ID").review_reason, "resident_only_free");
    assert.equal(price("Free, registration required").review_reason, "registration_required");
    assert.equal(price("A fun afternoon in the park.").review_reason, "no_price_info");
  });
});

describe("scope exclusions", () => {
  const ex = (title: string) => exclusionReason({ title, description: null, categories: [], location_text: null });
  it("drops sports and fitness entirely", () => {
    assert.equal(ex("Thanksgiving 5K Fun Run"), "sports_fitness");
    assert.equal(ex("Yoga in the Park"), "sports_fitness");
    assert.equal(ex("Adult Softball League Games"), "sports_fitness");
  });
  it("drops routine public meetings", () => {
    assert.equal(ex("City Council Work Study Session"), "public_meeting");
    assert.equal(ex("Planning and Zoning Hearing"), "public_meeting");
  });
  it("keeps in-scope events", () => {
    assert.equal(ex("Arts Commission presents a Free Concert"), null);
    assert.equal(ex("Junior League Holiday Market"), null);
    assert.equal(ex("Saturday Farmers Market"), null);
  });
});

describe("categories", () => {
  const cat = (title: string) => guessCategory({ title, description: null, categories: [] }).category;
  it("prefers the primary categories", () => {
    assert.equal(cat("Uptown Farmers Market"), "farmers-markets");
    assert.equal(cat("Chandler Chocolate Festival"), "festivals");
    assert.equal(cat("Juneteenth Celebration"), "celebrations");
  });
  it("covers the included categories", () => {
    assert.equal(cat("Concert in the Park"), "music-performance");
    assert.equal(cat("Holiday Tree Lighting"), "celebrations");
    assert.equal(cat("Gallery Night Art Walk"), "arts-culture");
    assert.equal(cat("Guided Nature Hike"), "parks-outdoors");
  });
});

describe("normalize", () => {
  it("parses venue, address, city and ZIP", () => {
    const loc = parseLocation("Tempe Public Library, 3500 S Rural Rd, Tempe, AZ 85282");
    assert.equal(loc.venue_name, "Tempe Public Library");
    assert.equal(loc.address, "3500 S Rural Rd, Tempe, AZ 85282");
    assert.equal(loc.city, "Tempe");
    assert.equal(loc.postal_code, "85282");
  });
  it("drops events outside the Valley", () => {
    const result = normalize(raw({ location_text: "Reid Park, Tucson, AZ 85716", latitude: null, longitude: null }), SOURCE);
    assert.deepEqual(result, { kind: "drop", reason: "out_of_area" });
    const byCoords = normalize(raw({ latitude: 32.22, longitude: -110.97 }), SOURCE);
    assert.deepEqual(byCoords, { kind: "drop", reason: "out_of_area" });
  });
  it("strips status prefixes from titles", () => {
    assert.equal(cleanTitle("CANCELLED: Movie Night"), "Movie Night");
    assert.equal(cleanTitle("[Postponed] - Holiday Lights"), "Holiday Lights");
  });
  it("falls back to the source's default city and homepage", () => {
    const c = keep({ location_text: "Kiwanis Park", url: null, latitude: null, longitude: null });
    assert.equal(c.city, "Tempe");
    assert.equal(c.source_url, SOURCE.homepage_url);
    assert.ok(c.review_reasons.includes("needs_geocode"));
  });
});

describe("iCal fetcher", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "UID:market-1",
    "DTSTAMP:20261101T000000Z",
    "DTSTART;TZID=America/Phoenix:20261003T080000",
    "DTEND;TZID=America/Phoenix:20261003T130000",
    "RRULE:FREQ=WEEKLY;BYDAY=SA;UNTIL=20270529T000000Z",
    "SUMMARY:Downtown Farmers Market",
    "LOCATION:Civic Space Park\\, 424 N Central Ave\\, Phoenix\\, AZ 85004",
    "DESCRIPTION:Free to attend. Produce for sale.",
    "ORGANIZER;CN=Downtown Market:mailto:market@example.org",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:movie-1",
    "DTSTAMP:20261101T000000Z",
    "DTSTART:20261212T010000Z",
    "SUMMARY:Movie Night",
    "STATUS:CANCELLED",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:old-1",
    "DTSTAMP:20261101T000000Z",
    "DTSTART:20261001T010000Z",
    "SUMMARY:Already happened",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const events = eventsFromIcs(ics, NOW);

  it("turns a weekly series into its next occurrence", () => {
    const market = events.find((e) => e.source_event_id === "market-1")!;
    assert.equal(market.start!.toISOString(), new Date("2026-11-21T08:00:00-07:00").toISOString());
    assert.match(market.recurrence_note ?? "", /week/i);
    assert.equal(market.organizer, "Downtown Market");
    assert.equal(market.location_text, "Civic Space Park, 424 N Central Ave, Phoenix, AZ 85004");
  });
  it("marks cancelled events and skips past ones", () => {
    assert.equal(events.find((e) => e.source_event_id === "movie-1")?.cancelled, true);
    assert.equal(events.some((e) => e.source_event_id === "old-1"), false);
  });
});

describe("dedupe", () => {
  it("same event from two sources has the same key", () => {
    const a = keep({ title: "The Tempe Fall Festival" });
    const b = keep({ title: "Tempe Fall Festival!", source_event_id: "x" }, { ...SOURCE, id: "visit-phoenix" });
    assert.equal(dedupeKey(a), dedupeKey(b));
  });

  it("merges across sources, flags same-source lookalikes", () => {
    const a = keep({ title: "Tempe Fall Festival" });
    const keyA = dedupeKey(a);
    const recordA = newRecord(a, { id: canonicalId({ ...a, dedupe_key: keyA }), dedupe_key: keyA }, NOW);
    const index = new EventIndex();
    index.add(recordA);

    const fromOther = keep({ title: "Tempe Fall Festival", source_event_id: "other-9" }, { ...SOURCE, id: "visit-phoenix" });
    const keyB = dedupeKey(fromOther);
    assert.equal(index.find(fromOther, keyB, canonicalId({ ...fromOther, dedupe_key: keyB })).kind, "duplicate");

    const again = keep({ title: "Tempe Fall Festival" });
    assert.equal(index.find(again, keyA, recordA.id).kind, "same_listing");

    const similar = keep({ title: "Tempe Fall Festival Kids Zone", source_event_id: "evt-2" });
    const keyS = dedupeKey(similar);
    assert.equal(index.find(similar, keyS, canonicalId({ ...similar, dedupe_key: keyS })).kind, "possible_duplicate");
  });

  it("collapses a listed-every-week market into one recurring record", () => {
    const weeks = [0, 7, 14, 21].map((d) =>
      keep({
        title: "Uptown Farmers Market",
        source_event_id: `m-${d}`,
        start: new Date(new Date("2026-11-14T08:00:00-07:00").getTime() + d * 86400000),
        end: new Date(new Date("2026-11-14T12:00:00-07:00").getTime() + d * 86400000),
      }),
    );
    const { kept, collapsed } = collapseSeries(weeks, NOW);
    assert.equal(kept.length, 1);
    assert.equal(collapsed, 3);
    assert.equal(kept[0].start_at.toISOString(), new Date("2026-11-21T08:00:00-07:00").toISOString());
    assert.equal(kept[0].recurrence_note, "Weekly on Saturdays");
  });
});

describe("workflow decisions", () => {
  const record = (fields: Partial<RawEvent>) => {
    const c = keep(fields);
    const key = dedupeKey(c);
    return { c, rec: newRecord(c, { id: canonicalId({ ...c, dedupe_key: key }), dedupe_key: key }, NOW) };
  };

  it("first-seen free events wait for review and are not public", () => {
    const { rec } = record({});
    assert.equal(rec.status, "pending_review");
    assert.equal(rec.needs_review, true);
    assert.equal(isPubliclyReadable(rec), false);
  });

  it("paid events are stored hidden, never public", () => {
    const { rec } = record({ description: "General admission $30." });
    assert.equal(rec.is_free, false);
    assert.equal(rec.visibility, "hidden");
    assert.equal(isPubliclyReadable(rec), false);
  });

  const published = (rec: Stored): Stored => ({ ...rec, status: "published", needs_review: false, review_reasons: [] });

  it("a source switching to paid hides the event immediately", () => {
    const { rec } = record({});
    const update = keep({ description: "Tickets $15 general admission." });
    const patch = updateRecord(published(rec), update, SOURCE, NOW);
    assert.equal(patch.visibility, "hidden");
    assert.equal(isPubliclyReadable({ ...published(rec), ...patch }), false);
  });

  it("source cancellation is applied and flagged", () => {
    const { rec } = record({});
    const patch = updateRecord(published(rec), keep({ cancelled: true }), SOURCE, NOW);
    assert.equal(patch.status, "cancelled");
    assert.ok(patch.review_reasons?.includes("cancelled_by_source"));
  });

  it("curator edits are not overwritten by the source", () => {
    const { rec } = record({});
    const curated = { ...published(rec), title: "Curated Title", curated_by: "uid-1" };
    const patch = updateRecord(curated, keep({ title: "Tempe Neighborhood Festival 2026" }), SOURCE, NOW);
    assert.equal(patch.title, undefined);
    assert.equal(patch.needs_review, true);
  });

  it("new doubt takes a published event out of the public list", () => {
    const { rec } = record({});
    const patch = updateRecord(published(rec), keep({ description: "Suggested donation $5." }), SOURCE, NOW);
    assert.equal(patch.status, "pending_review");
  });
});
