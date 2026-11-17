/**
 * Tiny wrapper around localStorage that React components can subscribe to.
 *
 * Used for "Saved" events and events posted from this browser until a real
 * database is added. Every read/write is wrapped in try/catch because
 * localStorage can be unavailable (private mode, blocked storage, full quota).
 */
import { useSyncExternalStore } from "react";

export interface LocalStore<T> {
  /** Current value (cached, so React gets a stable reference). */
  read: () => T;
  /** Saves a new value. Returns false if the browser refused (e.g. storage full). */
  write: (next: T) => boolean;
  /** Read-modify-write helper. */
  update: (fn: (prev: T) => T) => boolean;
  /** React hook: re-renders when the value changes (also across browser tabs). */
  useValue: () => T;
}

export function createLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;

  function read(): T {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cachedValue;
    }
    // Only re-parse when the stored string actually changed.
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        console.warn(`[local-store] Ignoring corrupted value for "${key}"`);
        cachedValue = fallback;
      }
    }
    return cachedValue;
  }

  function write(next: T): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {
      console.warn(`[local-store] Could not save "${key}"`, error);
      return false;
    }
    listeners.forEach((notify) => notify());
    return true;
  }

  function subscribe(notify: () => void): () => void {
    listeners.add(notify);
    // Keep multiple tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) notify();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(notify);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    read,
    write,
    update: (fn) => write(fn(read())),
    // On the server there is no localStorage, so we render the fallback.
    useValue: () => useSyncExternalStore(subscribe, read, () => fallback),
  };
}
