import type { SourceConfig } from "../../../shared/event-model";

/**
 * One event as a fetcher found it, before normalizing (§7.3 step 1).
 * Fetchers fill in what the source provides; everything else stays null.
 */
export interface RawEvent {
  source_event_id: string | null;
  title: string;
  description: string | null;
  start: Date | null;
  end: Date | null;
  all_day: boolean;
  /** Free-text location as the source wrote it, e.g. "Library, 123 Main St, Tempe, AZ 85281". */
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Link to the listing on the source site. */
  url: string | null;
  categories: string[];
  /** Any price/admission/ticket wording the source gave. */
  price_text: string | null;
  cancelled: boolean;
  recurrence_rule: string | null;
  recurrence_note: string | null;
  organizer: string | null;
  image_url: string | null;
}

export interface FetchedSource {
  events: RawEvent[];
  /** What was retrieved, for the raw snapshot (§7.2). */
  raw: { url: string; contentType: string | null; body: string; fetchedAt: Date };
}

export type Fetcher = (source: SourceConfig, now: Date) => Promise<FetchedSource>;
