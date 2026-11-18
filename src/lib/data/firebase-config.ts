/**
 * Firebase web config, read from NEXT_PUBLIC_FIREBASE_* environment variables.
 * These values are not secrets (Firebase web config is public by design);
 * access is enforced by firestore.rules.
 *
 * When they're missing, the app runs on built-in sample data.
 */
import type { FirebaseOptions } from "firebase/app";

export function getFirebaseConfig(): FirebaseOptions | null {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;

  return {
    apiKey,
    projectId,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}
