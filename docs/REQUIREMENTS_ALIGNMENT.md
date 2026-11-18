# Requirements alignment

How this codebase lines up with
[`PROJECT_REQUIREMENTS.md`](https://github.com/events-near-me/valleyvibe/blob/main/PROJECT_REQUIREMENTS.md)
(draft v0.4, November 17, 2026).

## Where we differ from the plan

| Requirement | What we have | Why |
| --- | --- | --- |
| Phase 1 is a **React Native** mobile app; the web app is Phase 2 on **Firebase Hosting** (§8, §10) | A mobile-first **Next.js** web app on **Vercel**, reading the same Firestore catalog | We already had a working web app. It now follows the Phase 1 feature list and works on phones. It can be installed to the home screen. The React Native app can be built next on the same Firestore data, rules and pipeline, with no backend changes. |
| Name decided later (Q20) | Shows **Valley Vibe** (working name) | One-line change in `src/lib/site.ts` when the name is final. |

## Functional requirements

| ID | Status | Where |
| --- | --- | --- |
| FR-1 Public, published, upcoming, free events only; hidden/paid unreadable | Done | `shared/event-model.ts` (`isPubliclyReadable`), `firestore.rules`, `src/lib/data/events.ts` |
| FR-2 Filter by date (day / weekend / custom range), category, city; clear | Done | `src/lib/filters.ts`, `src/components/filters/` |
| FR-3 Map and "near me" | Done | `/map`, "Use my location", distance sort and radius |
| FR-4 Works without location | Done | Location is only requested on tap; everything else works without it |
| FR-5 Plain empty-results message | Done | "No free events match these filters" |
| FR-6 Detail: title, when, where, description, category | Done | `src/components/events/EventDetail.tsx` |
| FR-7 Visible source link | Done | "View the original listing on …" on every event |
| FR-8 Cancelled/postponed labeled | Done | Banner on the event page, CANCELLED badge in Saved |
| FR-9 Recurring events show next occurrence | Done | "Next: <date>" plus "Repeats: …"; pipeline turns iCal RRULEs and weekly listings into one record |
| FR-10 No impersonation of a city/agency | Done | Disclaimer on every event page, footer and `/about` |
| FR-11 On-device save, no account | Done | Bookmarks in the browser only |
| FR-12 Share | Done | Native share sheet, or copy link on desktop |
| FR-13 No consumer auth in MVP | Done | Only curators sign in, at `/admin` |
| FR-14 Auth later | Not started (P2) | |
| FR-15 Curators review, publish, reject, merge, edit, fix free/paid and visibility; see hidden events | Done | `/admin` |
| FR-16 Nightly pull classifies free/paid, stores paid hidden, excludes sports/fitness and concert venues | Done, but needs verified sources | `functions/` (see "Not done yet") |
| FR-17 Disable a source quickly | Done | `/admin` → Sources |
| FR-18–21 | Later phases | |

**Removed:** the "Post an event" page. User-submitted events are out of scope for the MVP (§10.2,
FR-20).

**Changed:** categories now follow §4.2. The primary ones are Farmers Markets, Festivals and
Celebrations. Parks & Outdoors, Arts & Culture, Music & Performance and Seasonal & Holiday are
also included. Sports & Fitness was removed. The made-up "people interested" counts and
"Trending" are gone; nothing in the requirements backs them.

## Non-functional requirements

- **NFR-1 Timezone:** all times are shown and computed in America/Phoenix. The nightly job is
  scheduled in Phoenix time.
- **NFR-3 Accuracy over volume:** anything uncertain goes to review. Doubt added to a published
  event takes it out of the public list until a curator checks it.
- **NFR-6 Security:** Firestore rules allow public reads of free, public, published events only.
  No client can create or delete events. Curators can't make a paid event public.
- **NFR-7 Privacy:** no accounts, and location stays on the device (rounded to about 100 m).
  `/about` has a plain-language privacy section. **Have it reviewed before any store submission.**
- **NFR-9 Compliance:** the pull checks `robots.txt` before every request. It sends a contactable
  User-Agent and waits at least 2 seconds between requests to the same host.

## Defaults chosen for open questions

These are easy to change; each one is a single setting or list.

| Question | Default | Change it in |
| --- | --- | --- |
| Q1 Geography | Phoenix metro cities (21) + a bounding box | `VALLEY_CITIES` / `VALLEY_BOUNDS` in `shared/event-model.ts` |
| Q2 Definition of "free" | Suggested donation, resident-only, member-only, registration-required, and missing price info all go to review | `functions/src/pipeline/classify.ts` |
| Q3 Public meetings | Never shown (dropped by the pull) | `PUBLIC_MEETING` in `classify.ts` |
| Q4 Auto-publish | First-seen events **always** go to review. Routine updates to published events stay published. | `functions/src/pipeline/decide.ts` |
| Q8 Nightly run time | 00:30 Phoenix | `NIGHTLY_SCHEDULE` in `functions/src/config.ts` |
| Q12 Geocoding provider | None yet. Events without coordinates are flagged; curators can add them. | `functions/src/pipeline/geocode.ts` |
| Q16 Expired retention | Kept indefinitely (status `expired`, never deleted) | |
| Q19 Non-free concert venues | Empty list, to be filled in | `EXCLUDED_VENUES` in `classify.ts` |

## Not done yet

1. **No sources are switched on.** None of the §5 candidates has been verified (feed URL, terms,
   `robots.txt`). They are seeded **disabled**. Follow `docs/FIREBASE_SETUP.md` step 6 for each one.
2. **Only iCal feeds can be read.** API, RSS and HTML sources need a per-site fetcher once their
   terms are confirmed.
3. **Firebase project not created.** The app runs on clearly-labeled sample events until it is.
4. **Geocoding provider** not chosen (Q12).
5. **React Native app** (Phase 1 per the requirements), if the founders still want a native app.
6. **Map tiles:** using OpenStreetMap's public tiles, which are fine for light use. Pick a tile
   provider before launch.
7. **Alerts** need a log-based alert set up in Google Cloud (setup step 7).
