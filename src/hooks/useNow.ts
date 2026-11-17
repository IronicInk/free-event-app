"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, refreshed every minute.
 * Using one shared clock keeps "Today" / "Live now" labels consistent
 * and keeps render functions pure (no Date.now() inside components).
 */
const TICK_MS = 60_000;
const listeners = new Set<() => void>();
let current = new Date();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  current = new Date();
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (!timer) {
    current = new Date(); // refresh in case the page sat idle
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): Date {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
