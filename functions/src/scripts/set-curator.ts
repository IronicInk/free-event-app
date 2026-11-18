/**
 * Grants (or removes) curator access for an operator account.
 * Curator access is separate from consumer accounts, which the MVP doesn't have (FR-17).
 *
 * Usage (from functions/):
 *   npm run set-curator -- someone@example.com
 *   npm run set-curator -- someone@example.com --remove
 *
 * Needs admin credentials: run `gcloud auth application-default login` first,
 * and set GCLOUD_PROJECT=<your-firebase-project-id>.
 * The person must have signed in to /admin once so their account exists.
 * They need to sign out and back in for the change to take effect.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) {
    console.error("Usage: npm run set-curator -- <email> [--remove]");
    process.exit(1);
  }
  initializeApp();
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const remove = flag === "--remove";
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), curator: !remove });
  console.log(`${remove ? "Removed" : "Granted"} curator access for ${email} (uid ${user.uid}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
