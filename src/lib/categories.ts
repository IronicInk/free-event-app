import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  /** Two hex colors used for the gradient cover when an event has no image. */
  colors: [from: string, to: string];
}

/** Display info for each category, in the order shown in the UI. */
export const CATEGORIES: Category[] = [
  { id: "music", label: "Music", emoji: "🎵", colors: ["#d946ef", "#4f46e5"] },
  { id: "arts", label: "Arts", emoji: "🎨", colors: ["#f97316", "#db2777"] },
  { id: "food", label: "Food", emoji: "🌮", colors: ["#f59e0b", "#dc2626"] },
  { id: "outdoors", label: "Outdoors", emoji: "🌵", colors: ["#22c55e", "#0d9488"] },
  { id: "fitness", label: "Fitness", emoji: "🏃", colors: ["#06b6d4", "#2563eb"] },
  { id: "community", label: "Community", emoji: "🤝", colors: ["#f43f5e", "#9333ea"] },
  { id: "learning", label: "Learning", emoji: "📚", colors: ["#6366f1", "#0ea5e9"] },
  { id: "family", label: "Family", emoji: "🧸", colors: ["#facc15", "#f97316"] },
];

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
