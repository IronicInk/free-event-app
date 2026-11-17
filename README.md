# Free Event App

A tool for discovering and sharing free events.

## Project structure

```
Free-event-app/
├── docs/            # Planning notes, requirements, research
├── design/
│   ├── assets/      # Logos, icons, images, brand files
│   └── mockups/     # Wireframes and UI mockups
├── public/          # Static files served as-is (images, icons)
└── src/app/         # Next.js pages and layouts (App Router)
```

## Getting started

Built with [Next.js](https://nextjs.org) (TypeScript + Tailwind CSS) and hosted on Vercel.

```bash
npm install      # first time only
npm run dev      # start local dev server at http://localhost:3000
npm run build    # production build check
```

## Deployment

Pushing to `main` deploys automatically to Vercel. Other branches get preview URLs.
