/**
 * Polite HTTP for source fetchers (§7.2, §7.9):
 * - checks robots.txt before every request (cached per host for the run)
 * - sends a contactable User-Agent
 * - waits at least MIN_HOST_INTERVAL_MS between requests to the same host
 * - enforces a timeout and a maximum response size
 */
import {
  FETCH_TIMEOUT_MS,
  MAX_RESPONSE_BYTES,
  MIN_HOST_INTERVAL_MS,
  ROBOTS_AGENT_TOKEN,
  userAgent,
} from "../config";
import { isAllowed, parseRobots, type RobotsPolicy } from "./robots";

export class FetchError extends Error {
  constructor(
    message: string,
    readonly kind: "robots" | "http" | "timeout" | "too_large" | "network",
    readonly status?: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export interface FetchResult {
  url: string;
  status: number;
  contentType: string | null;
  body: string;
  fetchedAt: Date;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One instance per pull run, so robots.txt and rate limits are shared across sources. */
export class PoliteHttp {
  private robots = new Map<string, Promise<RobotsPolicy>>();
  private lastRequestAt = new Map<string, number>();

  private async throttle(host: string) {
    const last = this.lastRequestAt.get(host);
    if (last !== undefined) {
      const wait = last + MIN_HOST_INTERVAL_MS - Date.now();
      if (wait > 0) await sleep(wait);
    }
    this.lastRequestAt.set(host, Date.now());
  }

  private async rawGet(url: string): Promise<FetchResult> {
    const host = new URL(url).host;
    await this.throttle(host);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent(), Accept: "text/calendar, application/rss+xml, application/json, text/html;q=0.8, */*;q=0.5" },
        redirect: "follow",
        signal: controller.signal,
      });
      const length = Number(res.headers.get("content-length"));
      if (length > MAX_RESPONSE_BYTES) {
        throw new FetchError(`Response too large (${length} bytes)`, "too_large", res.status);
      }
      const body = await res.text();
      if (body.length > MAX_RESPONSE_BYTES) {
        throw new FetchError(`Response too large (${body.length} chars)`, "too_large", res.status);
      }
      return {
        url: res.url || url,
        status: res.status,
        contentType: res.headers.get("content-type"),
        body,
        fetchedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof FetchError) throw error;
      if ((error as Error).name === "AbortError") {
        throw new FetchError(`Timed out after ${FETCH_TIMEOUT_MS} ms`, "timeout");
      }
      throw new FetchError(`Network error: ${(error as Error).message}`, "network");
    } finally {
      clearTimeout(timer);
    }
  }

  private policyFor(origin: string): Promise<RobotsPolicy> {
    let policy = this.robots.get(origin);
    if (!policy) {
      policy = this.rawGet(`${origin}/robots.txt`).then(
        (res): RobotsPolicy => {
          if (res.status >= 200 && res.status < 300) return { groups: parseRobots(res.body) };
          // 4xx: no robots.txt, so crawling is allowed. 5xx: be conservative and stay away.
          if (res.status >= 400 && res.status < 500) return { groups: null };
          return { groups: "deny-all" };
        },
        (): RobotsPolicy => ({ groups: "deny-all" }),
      );
      this.robots.set(origin, policy);
    }
    return policy;
  }

  /** GET a URL if robots.txt allows it. Throws FetchError otherwise or on non-2xx. */
  async get(url: string): Promise<FetchResult> {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new FetchError(`Unsupported protocol ${parsed.protocol}`, "network");
    }
    const policy = await this.policyFor(parsed.origin);
    if (!isAllowed(policy, ROBOTS_AGENT_TOKEN, parsed.pathname + parsed.search)) {
      throw new FetchError(`robots.txt does not allow ${parsed.pathname}`, "robots");
    }
    const res = await this.rawGet(url);
    if (res.status < 200 || res.status >= 300) {
      throw new FetchError(`HTTP ${res.status}`, "http", res.status);
    }
    return res;
  }
}
