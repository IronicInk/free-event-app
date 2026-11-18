/**
 * Classification rules (PROJECT_REQUIREMENTS.md §4.1, §4.2, §7.3).
 *
 * Plain keyword rules, kept deliberately simple and readable so founders and
 * curators can tune them as real inventory arrives. Anything uncertain is sent to
 * the curator queue rather than guessed (NFR-3: accuracy over volume).
 */
import type { CategoryId, Confidence } from "../../../shared/event-model";

/** Builds a case-insensitive whole-word matcher from a list of phrases. */
function words(phrases: string[]): RegExp {
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "i");
}

// ---------------------------------------------------------------------------
// Scope: things that are never stored (§4.2 exclusion rules, §17)
// ---------------------------------------------------------------------------

/** Sports and fitness are out of scope entirely: not public, not in the hidden catalog. */
const SPORTS_FITNESS = words([
  "5k", "10k", "half marathon", "marathon", "fun run", "run club", "running club", "walk run",
  "triathlon", "fitness", "workout", "bootcamp", "boot camp", "yoga", "zumba", "pilates",
  "aerobics", "crossfit", "spin class", "aqua fit", "water aerobics", "strength training",
  "pickleball", "basketball", "soccer", "softball", "baseball", "volleyball", "tennis",
  "football", "flag football", "hockey", "lacrosse", "kickball", "golf", "disc golf",
  "sports league", "league game", "league games", "league play", "tournament", "open gym", "open play", "watch party", "lap swim",
  "swim lessons", "sports camp", "sports clinic",
]);

/** Routine public meetings: proposed as out of the consumer list (§4.2, open question 3). */
const PUBLIC_MEETING = words([
  "city council", "council meeting", "council work study", "work study session",
  "commission meeting", "board meeting", "committee meeting", "public hearing",
  "planning and zoning", "planning & zoning", "board of adjustment", "advisory board",
  "advisory commission", "commission hearing", "subcommittee", "study session", "executive session",
  "special meeting", "regular meeting",
]);

export type ExclusionReason = "sports_fitness" | "public_meeting" | "excluded_venue";

/**
 * Non-free concert venues are not ingested (§4.2). The founders still need to define
 * this list (open question 19); add venue names here as they are identified.
 */
export const EXCLUDED_VENUES: string[] = [];

export function exclusionReason(fields: {
  title: string;
  description: string | null;
  categories: string[];
  location_text: string | null;
}): ExclusionReason | null {
  const titleAndCategories = [fields.title, ...fields.categories].join(" \n ");
  // Titles and categories are strong signals. Descriptions often mention parking,
  // nearby fields, etc., so they only count for sports when they're explicit.
  if (SPORTS_FITNESS.test(titleAndCategories)) return "sports_fitness";
  if (PUBLIC_MEETING.test(titleAndCategories)) return "public_meeting";
  const location = (fields.location_text ?? "").toLowerCase();
  if (EXCLUDED_VENUES.some((venue) => location.includes(venue.toLowerCase()))) return "excluded_venue";
  return null;
}

// ---------------------------------------------------------------------------
// Free vs paid (§7.3 step 3)
// ---------------------------------------------------------------------------

const FREE_SIGNALS = words([
  "free", "free admission", "free entry", "free event", "free to attend", "free and open to the public",
  "no cost", "no charge", "complimentary", "admission is free", "no admission",
]);

const PAID_SIGNALS = words([
  "tickets", "ticket", "admission", "entry fee", "registration fee", "cover charge", "per person",
  "general admission", "vip", "pre-sale", "presale", "early bird", "fee", "cost", "price",
]);

/** "$5", "$ 10", "$12.50"; "$0" is treated as free. */
const DOLLAR_AMOUNT = /\$\s?(\d+(?:\.\d{2})?)/g;

/** Ambiguous wording a curator must decide on (§4.1, §7.3, open question 2). */
const AMBIGUOUS = [
  { re: words(["suggested donation", "donations welcome", "donation requested", "pay what you wish", "pay what you can"]), reason: "suggested_donation" },
  { re: words(["free for residents", "residents free", "resident only", "residents only", "free with resident id"]), reason: "resident_only_free" },
  { re: words(["free for members", "members free", "member only", "members only", "free with membership"]), reason: "member_only_free" },
  { re: words(["registration required", "rsvp required", "pre-registration required", "must register", "space is limited", "limited capacity"]), reason: "registration_required" },
  { re: words(["free with admission", "included with admission", "with paid admission"]), reason: "free_with_paid_admission" },
] as const;

/** Words around a dollar amount that mean the cost is optional, not admission. */
const OPTIONAL_PURCHASE = words([
  "parking", "food", "drinks", "beverages", "concessions", "vendors", "for sale", "for purchase",
  "available for purchase", "rides", "carriage", "merchandise", "raffle", "optional",
]);

export interface PriceDecision {
  is_free: boolean;
  confidence: Confidence;
  /** Set when a curator needs to decide. */
  review_reason: string | null;
  /** Short human-readable note for `price_note`, when we have one. */
  note: string | null;
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?;\n])\s+/).map((s) => s.trim()).filter(Boolean);
}

export function classifyPrice(input: {
  title: string;
  description: string | null;
  price_text: string | null;
  categories: string[];
}): PriceDecision {
  const all = [input.title, input.price_text ?? "", input.description ?? "", ...input.categories].join(" \n ");

  for (const { re, reason } of AMBIGUOUS) {
    if (re.test(all)) {
      return { is_free: FREE_SIGNALS.test(all), confidence: "low", review_reason: reason, note: input.price_text };
    }
  }

  // Dollar amounts that are admission (not parking, food, etc.).
  let admissionAmount = false;
  let optionalAmount = false;
  for (const sentence of sentences(all)) {
    for (const match of sentence.matchAll(DOLLAR_AMOUNT)) {
      if (Number(match[1]) === 0) continue;
      if (OPTIONAL_PURCHASE.test(sentence)) optionalAmount = true;
      else admissionAmount = true;
    }
  }

  const free = FREE_SIGNALS.test(all);
  const paidWords = sentences(all).some(
    (s) => PAID_SIGNALS.test(s) && !FREE_SIGNALS.test(s) && !OPTIONAL_PURCHASE.test(s),
  );

  if (free && !admissionAmount && !paidWords) {
    return {
      is_free: true,
      confidence: optionalAmount ? "medium" : "high",
      review_reason: null,
      note: optionalAmount ? "Free to attend; some items or activities cost extra." : null,
    };
  }
  if (!free && (admissionAmount || paidWords)) {
    return { is_free: false, confidence: admissionAmount ? "high" : "medium", review_reason: admissionAmount ? null : "paid_wording_only", note: input.price_text };
  }
  if (free && (admissionAmount || paidWords)) {
    // e.g. "Free admission; VIP tickets $40". Usually free to attend, but check.
    return { is_free: true, confidence: "low", review_reason: "mixed_price_signals", note: input.price_text };
  }
  // Nothing about price at all. Many city calendars only list free events, but a person should confirm.
  return { is_free: true, confidence: "low", review_reason: "no_price_info", note: null };
}

// ---------------------------------------------------------------------------
// Category and tags (§4.2)
// ---------------------------------------------------------------------------

/** First match wins, so primary categories are checked first. */
const CATEGORY_RULES: { id: CategoryId; re: RegExp }[] = [
  { id: "farmers-markets", re: words(["farmers market", "farmer's market", "farmers' market", "produce market", "mobile market", "market day", "growers market"]) },
  { id: "festivals", re: words(["festival", "fest", "fiesta", "street fair", "block party", "fair"]) },
  { id: "celebrations", re: words(["celebration", "celebrate", "parade", "dia de los muertos", "día de los muertos", "juneteenth", "independence day", "fourth of july", "4th of july", "lunar new year", "cinco de mayo", "pride", "heritage month", "mlk", "martin luther king", "veterans day", "memorial day", "anniversary", "commemoration", "tree lighting"]) },
  { id: "seasonal-holiday", re: words(["holiday", "christmas", "halloween", "trunk or treat", "thanksgiving", "hanukkah", "kwanzaa", "easter", "egg hunt", "new year", "new year's", "lights", "santa", "winter wonderland", "pumpkin"]) },
  { id: "music-performance", re: words(["concert", "live music", "music", "band", "symphony", "orchestra", "jazz", "mariachi", "choir", "open mic", "performance", "recital", "dance performance", "theater", "theatre", "comedy"]) },
  { id: "arts-culture", re: words(["art", "arts", "art walk", "gallery", "museum", "exhibit", "exhibition", "mural", "cultural", "culture", "film", "movie screening", "poetry", "author", "book", "craft", "crafts", "storytime", "story time", "history", "heritage"]) },
  { id: "parks-outdoors", re: words(["park", "parks", "hike", "hiking", "nature", "trail", "garden", "gardening", "splash pad", "outdoor", "outdoors", "movie in the park", "movies in the park", "birding", "bird walk", "stargazing", "preserve", "lake", "cleanup", "clean-up"]) },
];

const TAG_RULES: { tag: string; re: RegExp }[] = [
  { tag: "family", re: words(["kids", "kid", "family", "families", "children", "child", "toddler", "toddlers", "teen", "teens", "youth", "storytime", "story time", "all ages"]) },
  { tag: "library-learning", re: words(["library", "workshop", "class", "lecture", "talk", "learn", "learning", "book club", "storytime", "story time", "stem", "steam"]) },
  { tag: "markets-fairs-popups", re: words(["market", "fair", "pop-up", "popup", "bazaar", "swap meet", "craft fair", "vendors"]) },
  { tag: "volunteer-civic", re: words(["volunteer", "volunteers", "cleanup", "clean-up", "service project", "civic", "community service", "food drive"]) },
  { tag: "health-wellness", re: words(["health", "wellness", "health fair", "clinic", "vaccine", "screening", "mental health", "meditation"]) },
];

export function guessCategory(fields: { title: string; description: string | null; categories: string[] }): {
  category: CategoryId | null;
  confidence: Confidence;
} {
  const strong = [fields.title, ...fields.categories].join(" \n ");
  for (const rule of CATEGORY_RULES) if (rule.re.test(strong)) return { category: rule.id, confidence: "high" };
  const weak = fields.description ?? "";
  for (const rule of CATEGORY_RULES) if (rule.re.test(weak)) return { category: rule.id, confidence: "low" };
  return { category: null, confidence: "low" };
}

export function guessTags(fields: { title: string; description: string | null; categories: string[] }): string[] {
  const text = [fields.title, fields.description ?? "", ...fields.categories].join(" \n ");
  return TAG_RULES.filter((rule) => rule.re.test(text)).map((rule) => rule.tag);
}
