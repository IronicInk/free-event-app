import { PRIMARY_CATEGORY_IDS } from "@shared/event-model";
import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  /** Primary categories (§4.2) are shown first and highlighted. */
  primary: boolean;
  /** Two hex colors used for the gradient cover when an event has no image. */
  colors: [from: string, to: string];
}

const isPrimary = (id: CategoryId) => (PRIMARY_CATEGORY_IDS as readonly string[]).includes(id);

/**
 * Display info for each category, in the order shown in the UI.
 * Taxonomy from PROJECT_REQUIREMENTS.md §4.2. Sports & fitness are out of scope.
 */
export const CATEGORIES: Category[] = (
  [
    { id: "farmers-markets", label: "Farmers Markets", emoji: "🥕", colors: ["#84cc16", "#15803d"] },
    { id: "festivals", label: "Festivals", emoji: "🎪", colors: ["#f97316", "#db2777"] },
    { id: "celebrations", label: "Celebrations", emoji: "🎉", colors: ["#f43f5e", "#9333ea"] },
    { id: "parks-outdoors", label: "Parks & Outdoors", emoji: "🌵", colors: ["#22c55e", "#0d9488"] },
    { id: "arts-culture", label: "Arts & Culture", emoji: "🎨", colors: ["#f59e0b", "#dc2626"] },
    { id: "music-performance", label: "Music & Performance", emoji: "🎵", colors: ["#d946ef", "#4f46e5"] },
    { id: "seasonal-holiday", label: "Seasonal & Holiday", emoji: "🎄", colors: ["#0ea5e9", "#6366f1"] },
  ] satisfies Omit<Category, "primary">[]
).map((c) => ({ ...c, primary: isPrimary(c.id) }));

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): Category {
  // Every CategoryId has an entry above, so this lookup never fails.
  return BY_ID.get(id)!;
}

/** CSS background for a category gradient (used for covers and OG images). */
export function categoryGradient(id: CategoryId): string {
  const [from, to] = getCategory(id).colors;
  return `linear-gradient(135deg, ${from}, ${to})`;
}

/** Friendly labels for the supporting tags in shared/event-model.ts. */
const TAG_LABELS: Record<string, string> = {
  family: "Family & Kids",
  "library-learning": "Library & Learning",
  "markets-fairs-popups": "Markets, Fairs & Pop-ups",
  "volunteer-civic": "Volunteer & Civic",
  "health-wellness": "Health & Wellness",
};

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag;
}
