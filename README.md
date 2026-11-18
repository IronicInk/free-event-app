# Valley Vibe

A curated list of **free** local events across the Phoenix metro ("the Valley"): farmers markets,
festivals, celebrations, parks, arts and more. No tickets, no fees, no sign-in.

"Valley Vibe" is a working name. Built to
[`PROJECT_REQUIREMENTS.md`](https://github.com/events-near-me/valleyvibe/blob/main/PROJECT_REQUIREMENTS.md);
see [docs/REQUIREMENTS_ALIGNMENT.md](docs/REQUIREMENTS_ALIGNMENT.md) for what's done, the defaults
chosen, and what's left.

- **Website:** [Next.js](https://nextjs.org) (TypeScript + Tailwind CSS), mobile-first, hosted on Vercel.
- **Data:** Cloud Firestore. Until it's connected, the site shows built-in sample events.
- **Nightly pull:** Cloud Functions for Firebase. It collects events from public calendars,
  classifies them as free or paid, filters and de-duplicates them, and queues them for a curator.

## Screens

| Route | What it does |
| --- | --- |
| `/` **Discover** | Search, categories, date chips (including a custom range), city and near-me filters. Filters live in the URL, so filtered views can be shared. |
| `/map` **Map** | Events on a map, with "use my location" for distances. Location is optional. |
| `/explore` **Explore** | Full-screen swipe feed. |
| `/events/[id]` | Details, source link, open in Maps, add to calendar, share. Cancelled events are clearly labeled. |
| `/saved` **Saved** | Bookmarks, stored on this device only. |
| `/about` | About, sources disclaimer, privacy. |
| `/admin` | Curator tool (operators only): review queue, publish/reject/merge, hidden paid events, sources, pull runs. |

## Getting started

```bash
npm install      # first time only
npm run dev      # start local dev server at http://localhost:3000
npm run lint     # check code style
npm run build    # production build check (run before pushing)

cd functions
npm install
npm test         # pipeline rule tests
```

To connect Firebase, follow [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

## Project structure

```
shared/event-model.ts    # THE event model, categories, Valley cities, public-visibility rule
src/
├── app/                 # Routes (pages), metadata, share images
├── components/
│   ├── layout/          # Top bar + mobile tab bar, events provider
│   ├── discover/        # Home screen
│   ├── map/             # Map view (Leaflet)
│   ├── explore/         # Swipe feed
│   ├── events/          # Event card, cover, detail page, save/share/calendar buttons
│   ├── filters/         # Search, categories, dates, city / near-me sheet
│   ├── saved/           # Saved screen
│   ├── admin/           # Curator tool
│   └── ui/              # Icons, empty states, skeletons
├── hooks/               # URL filters, saved events, location, clock
├── lib/                 # Plain logic: dates, filtering, distances
│   └── data/            # Loading events (Firestore or sample data)
└── data/                # Sample events (used until Firebase is connected)
functions/               # Nightly pull + curator functions (Cloud Functions for Firebase)
├── src/pipeline/        # fetch → normalize → classify → dedupe → store
├── src/sources/         # Candidate source list (all disabled until verified)
└── test/                # Pipeline tests
firestore.rules          # Who can read/write what
docs/                    # Setup guide, requirements alignment
```

**Where to change things**

- App name, map tiles: `src/lib/site.ts`
- Categories, Valley cities, event fields: `shared/event-model.ts` (+ labels in `src/lib/categories.ts`)
- Free/paid, sports, meeting and category rules: `functions/src/pipeline/classify.ts`
- Publish/review workflow: `functions/src/pipeline/decide.ts`
- Nightly schedule and limits: `functions/src/config.ts`
- Colors: `src/app/globals.css`

## Deployment

Pushing to `main` deploys the website to Vercel automatically. Other branches get preview URLs.
Firebase rules and functions deploy separately with `firebase deploy` (see the setup guide).
