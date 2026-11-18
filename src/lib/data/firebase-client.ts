"use client";

/**
 * Browser-side Firebase, used only by the curator tool (/admin).
 * Consumer pages never sign in and read events on the server (lib/data/events.ts).
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig } from "./firebase-config";

export function getClientApp(): FirebaseApp | null {
  const config = getFirebaseConfig();
  if (!config) return null;
  return getApps().length ? getApp() : initializeApp(config);
}
