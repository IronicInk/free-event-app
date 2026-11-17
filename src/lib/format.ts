/** 1280 -> "1.3K", 342 -> "342" (social-media style counts). */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
