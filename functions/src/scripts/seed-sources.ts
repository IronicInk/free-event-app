/**
 * Adds the candidate sources (all disabled) to the Firestore `sources` collection.
 * Existing sources are left untouched, so operator changes are never overwritten.
 *
 * Usage (from functions/): GCLOUD_PROJECT=<project-id> npm run seed-sources
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { CANDIDATE_SOURCES } from "../sources/candidates";

async function main() {
  initializeApp();
  const db = getFirestore();
  for (const source of CANDIDATE_SOURCES) {
    const ref = db.collection("sources").doc(source.id);
    if ((await ref.get()).exists) {
      console.log(`skip    ${source.id} (already exists)`);
      continue;
    }
    const { id: _id, ...data } = source;
    await ref.create({ ...data, created_at: new Date() });
    console.log(`added   ${source.id} (disabled)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
