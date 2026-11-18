# Firebase setup

How to turn on the real backend: the Firestore database, the nightly data pull and the curator tool.
Until you do this, the app runs on built-in sample events.

You'll need a Google account that can create a Firebase project with billing. Scheduled functions
require the pay-as-you-go **Blaze** plan; set a budget alert (NFR-10).

## 1. Create the project

1. Go to <https://console.firebase.google.com> → **Add project**. Use separate projects for dev and
   prod if you want (an open decision in §8).
2. **Build → Firestore Database → Create database.** Pick a US region (for example `us-west2`),
   **production mode**.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable.** This is only for
   curators. Visitors never sign in (FR-13).
4. **Authentication → Settings → Authorized domains:** add your Vercel domain (for example
   `free-event-app.vercel.app`) and any custom domain.
5. **Project settings → Your apps → Add app → Web.** Copy the config values.
6. Upgrade to **Blaze** (needed for scheduled Cloud Functions).

## 2. Connect the website

Add these in **Vercel → Project → Settings → Environment Variables** (and in `.env.local` for local
development; see `.env.example`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Redeploy. The site now reads from Firestore. It will show **no events** until the pull runs and a
curator publishes some. That's expected.

## 3. Deploy rules, indexes and functions

Install the Firebase CLI once: `npm install -g firebase-tools`, then `firebase login`.

```bash
firebase use --add                  # pick your project, alias "default"
cd functions && npm install && npm test && cd ..
firebase deploy --only firestore    # security rules + indexes
firebase deploy --only functions    # nightlyPull + runPullNow
```

On the first functions deploy you'll be asked for **BOT_CONTACT**: a URL or email that source
owners can use to reach you. It is sent in the crawler's User-Agent (§7.9).

## 4. Make yourself a curator

1. Open `https://<your-site>/admin` and **Sign in with Google**. You'll see "No curator access".
2. On your computer:

   ```bash
   gcloud auth application-default login     # once
   cd functions
   GCLOUD_PROJECT=<project-id> npm run set-curator -- you@example.com
   ```

3. Sign out of `/admin` and back in.

## 5. Add the candidate sources

```bash
cd functions
GCLOUD_PROJECT=<project-id> npm run seed-sources
```

This adds the §5 candidates (City of Phoenix, Tempe, libraries, farmers markets) **switched off**.

## 6. Turn on a source (repeat for each one)

The requirements (§5.4) say a source must be checked before it's used. For each source:

1. **Find a feed.** Look for an "iCal", "Subscribe" or ".ics" link on the calendar page. The pull
   reads iCal today; API, RSS and HTML sources need a dedicated fetcher in
   `functions/src/pipeline/fetchers/`.
2. **Read the terms of use and `robots.txt`.** Don't use a source that forbids automated access.
   (The pull also checks `robots.txt` on every run and skips anything disallowed.)
3. **Record it** in the Firestore console under `sources/<id>`: `feed_url`, `method: "ics"`,
   `terms_checked_at` (date), `owner` (who looks after this source), `attribution_note`.
4. **Turn it on** in `/admin` → **Sources**, then **Run now** for that source.
5. **Review** what came in under **Review queue**. Tune `functions/src/pipeline/classify.ts` if it
   misclassifies things.

If a source later withdraws permission, turn it off in **Sources** right away (FR-17). Its events
stay in the database, so reject or hide them in the curator tool.

## 7. Alerts (§7.8)

The pull logs every problem with `alert: true`. In Google Cloud console → **Logging → Log-based
alerts**, create:

| Alert | Query |
| --- | --- |
| Pull problem (source failed, source empty, queue too large, write errors) | `jsonPayload.alert=true` |
| Nightly pull didn't run | Absence of `jsonPayload.message="pull_run_completed"` for 26 hours |

Send them to a founder's email (who receives alerts is open question 8).

## What runs when

| What | When | Where |
| --- | --- | --- |
| `nightlyPull` | 00:30 every night, Phoenix time (`functions/src/config.ts`) | Cloud Functions |
| `runPullNow` | Curator clicks **Run now** in `/admin` | Cloud Functions |
| Public site refresh | Event lists are cached for up to 1 hour | Vercel |

## Collections

| Collection | Written by | Readable by |
| --- | --- | --- |
| `events` | Pull (Admin SDK), curators | Public: only `visibility=public`, `is_free=true`, `status` published or cancelled. Curators: all. |
| `sources` | Seed script, pull (health fields), curators (on/off) | Curators |
| `pull_runs` | Pull | Curators |
| `raw_snapshots` | Pull (emails and phone numbers redacted) | Curators |

The field-by-field event shape is in `shared/event-model.ts` (it follows §13 of the requirements).
