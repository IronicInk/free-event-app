/**
 * Picks the fetcher for a source's method (§7.2: best permitted structured format first).
 *
 * Only iCal is implemented generically. API, RSS and HTML sources differ per site,
 * so add a dedicated fetcher once a source has passed the §5.4 checklist
 * (terms + robots.txt read, access method confirmed, owner recorded).
 */
import type { SourceConfig } from "../../../../shared/event-model";
import type { PoliteHttp } from "../http";
import type { FetchedSource } from "../types";
import { fetchIcs } from "./ics";

export async function fetchSource(
  http: PoliteHttp,
  source: SourceConfig,
  now: Date,
): Promise<FetchedSource> {
  switch (source.method) {
    case "ics":
      return fetchIcs(http, source, now);
    case "api":
    case "rss":
    case "html":
      throw new Error(
        `No "${source.method}" fetcher for source "${source.id}" yet. ` +
          `Use its iCal feed if it has one, or add a dedicated fetcher in functions/src/pipeline/fetchers/.`,
      );
  }
}
