# Free Event App

Find free things to do nearby: no tickets, no fees. A mobile-first, social-style event discovery app,
built with [Next.js](https://nextjs.org) (TypeScript + Tailwind CSS) and hosted on Vercel.

## Screens

| Route | What it does |
| --- | --- |
| `/` **Discover** | Search, category "story" circles, date chips, filters sheet, Trending carousel, event grid. Filters are kept in the URL, so filtered views can be shared as links. |
| `/explore` **Explore** | TikTok-style full-screen vertical feed with Save / Share / Details buttons. |
| `/events/[id]` **Event** | Full details, open in Maps, add to Google/Apple calendar, share, related events. Has its own social preview image and Google event data. |
| `/publish` **Post** | One-page form for publishers with a live card preview. Free events only. |
| `/saved` **Saved** | Bookmarked events (upcoming and past). |

## Getting started

```bash
npm install      # first time only
npm run dev      # start local dev server at http://localhost:3000
npm run lint     # check code style
npm run build    # production build check (run before pushing)
```

## Project structure

```
src/
├── app/                 # Routes (pages), metadata, share images
├── components/
│   ├── layout/          # Top bar + mobile bottom tab bar
│   ├── discover/        # Home screen
│   ├── explore/         # Swipe feed
│   ├── events/          # Event card, cover, detail page, save/share/calendar buttons
│   ├── filters/         # Search bar, category rail, date chips, filters sheet
│   ├── publish/         # Post-an-event form
│   ├── saved/           # Saved screen
│   └── ui/              # Icons, empty states, loading skeletons
├── hooks/               # React hooks (URL filters, saved events, clock)
├── lib/                 # Plain logic, no UI: types, dates, filtering, validation
└── data/                # Sample events (temporary)
docs/                    # Planning notes
design/                  # Brand assets & mockups
```

**Where to change things**

- App name, time zone, areas: `src/lib/site.ts`
- Colors (light and dark mode): `src/app/globals.css` (top of file)
- Categories: `src/lib/types.ts` + `src/lib/categories.ts`
- Search / filter / trending rules: `src/lib/events.ts`
- Post form validation rules: `src/lib/event-draft.ts`

## Current limitations (preview mode)

- **Sample data:** events come from `src/data/sample-events.ts`. They're fictional and dated Nov 2026 – Feb 2027.
- **Posted and saved events are stored in the browser only** (localStorage). Other people can't see them yet.
  The next step is a database; code marked `TEMPORARY` shows what to replace.

## Deployment

Pushing to `main` deploys automatically to Vercel. Other branches get preview URLs.
Optional: set `NEXT_PUBLIC_SITE_URL` in Vercel if you add a custom domain.
