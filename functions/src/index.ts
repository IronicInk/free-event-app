/**
 * Valley Vibe Cloud Functions (PROJECT_REQUIREMENTS.md §7, §8).
 *
 * - nightlyPull: scheduled, once a night in America/Phoenix.
 * - runPullNow:  on demand, for curators; can run a single source.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/scheduler";
import { VALLEY_TIMEZONE } from "../../shared/event-model";
import { NIGHTLY_SCHEDULE } from "./config";
import { runPull } from "./pipeline/run";

initializeApp();

const RUN_OPTIONS = { timeoutSeconds: 1800, memory: "512MiB" as const, maxInstances: 1 };

export const nightlyPull = onSchedule(
  { ...RUN_OPTIONS, schedule: NIGHTLY_SCHEDULE, timeZone: VALLEY_TIMEZONE, retryCount: 0 },
  async () => {
    await runPull(getFirestore(), { trigger: "schedule" });
  },
);

/** Called from the curator tool's "Run pull now" button. Curators only. */
export const runPullNow = onCall<{ sourceId?: string }>(RUN_OPTIONS, async (request) => {
  if (request.auth?.token.curator !== true) {
    throw new HttpsError("permission-denied", "Only curators can run the pull.");
  }
  const sourceId = typeof request.data?.sourceId === "string" ? request.data.sourceId : undefined;
  const summary = await runPull(getFirestore(), {
    trigger: "manual",
    sourceId,
    requestedBy: request.auth.uid,
  });
  return {
    run_id: summary.run_id,
    duration_ms: summary.duration_ms,
    sources: summary.sources,
    expired: summary.expired,
    pending_queue: summary.pending_queue,
    alerts: summary.alerts,
  };
});
