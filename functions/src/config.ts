/**
 * Pipeline settings. Values marked "proposed" come from PROJECT_REQUIREMENTS.md
 * and are open founder questions; change them here.
 */
import { defineString } from "firebase-functions/params";

/**
 * Contact page or email for the crawler's User-Agent (§7.9: "contactable user-agent").
 * No default on purpose: `firebase deploy` asks for it the first time and saves it
 * to functions/.env.<project-id>.
 */
export const BOT_CONTACT = defineString("BOT_CONTACT", {
  description: "Contact URL or email shown in the crawler User-Agent (e.g. https://yourdomain/about)",
});

export function userAgent(): string {
  return `ValleyVibeBot/0.1 (+${BOT_CONTACT.value()})`;
}

/** Token matched against robots.txt `User-agent:` lines. */
export const ROBOTS_AGENT_TOKEN = "valleyvibebot";

/** Nightly schedule, America/Phoenix (proposed: shortly after midnight, §7.1 / Q8). */
export const NIGHTLY_SCHEDULE = "30 0 * * *";

/** Minimum gap between requests to the same host (polite rate limit, §7.9). */
export const MIN_HOST_INTERVAL_MS = 2_000;
export const FETCH_TIMEOUT_MS = 20_000;
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

/** How far ahead to look when picking the next occurrence of a recurring event. */
export const RECURRENCE_LOOKAHEAD_DAYS = 90;
/** Ignore events further out than this (keeps the catalog focused on what's coming up). */
export const MAX_DAYS_AHEAD = 180;

/** Runs an event may be missing from its source before it is flagged (proposed, §7.7). */
export const MISSING_RUNS_THRESHOLD = 3;

/** Grace period before an end-less event counts as over (§7.7). */
export const NO_END_GRACE_HOURS = 6;

/** Alert when the curator queue grows past this (§7.8). */
export const PENDING_QUEUE_ALERT_THRESHOLD = 75;

/** Raw snapshots are truncated to stay under Firestore's 1 MiB document limit. */
export const RAW_SNAPSHOT_MAX_CHARS = 400_000;
