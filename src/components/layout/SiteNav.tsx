"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { SITE } from "@/lib/site";
import { BookmarkIcon, CompassIcon, MapIcon, ZapIcon } from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Discover", icon: CompassIcon },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/explore", label: "Explore", icon: ZapIcon },
  { href: "/saved", label: "Saved", icon: BookmarkIcon },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * App navigation:
 * - Mobile: slim top bar + Instagram-style bottom tab bar (thumb-friendly).
 * - Desktop: one top bar with links.
 * There is no "post an event" button: user-submitted events are out of scope for the MVP.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="bg-brand grid size-8 place-items-center rounded-xl text-sm text-accent-fg">
              V
            </span>
            <span className="text-lg">{SITE.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid h-[var(--nav-h)] max-w-md grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs ${
                    active ? "font-semibold text-fg" : "font-medium text-muted"
                  }`}
                >
                  {/* Pill behind the active icon makes "where am I" obvious at a glance */}
                  <span
                    className={`grid h-8 w-14 place-items-center rounded-full transition ${
                      active ? "bg-surface-2" : ""
                    }`}
                  >
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
