import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EventsProvider } from "@/components/layout/EventsProvider";
import { SiteNav } from "@/components/layout/SiteNav";
import { getPublicEvents } from "@/lib/data/events";
import { SITE, getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // "cover" lets the app use the full screen on notched phones (safe areas handled in CSS).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The public catalog is small (one metro), so it is loaded once here and shared with
  // every screen. Cached for an hour (see lib/data/events.ts).
  const events = await getPublicEvents();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <SiteNav />
        {/* Bottom padding keeps content clear of the mobile tab bar */}
        <main className="pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))]">
          <EventsProvider events={events}>{children}</EventsProvider>
        </main>
      </body>
    </html>
  );
}
