"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { SITE } from "@/lib/site";
import { BookmarkIcon, CompassIcon, PlusIcon, ZapIcon } from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The "Post" button gets the highlighted center style on mobile. */
  primary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Discover", icon: CompassIcon },
  { href: "/explore", label: "Explore", icon: ZapIcon },
  { href: "/publish", label: "Post", icon: PlusIcon, primary: true },
  { href: "/saved", label: "Saved", icon: BookmarkIcon },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * App navigation:
 * - Mobile: slim top bar + Instagram-style bottom tab bar (thumb-friendly).
 * - Desktop: one top bar with links and a "Post an event" button.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="bg-brand grid size-8 place-items-center rounded-xl text-sm text-accent-fg">
              F
            </span>
            <span className="text-lg">{SITE.name}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.filter((item) => !item.primary).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/publish"
              className="bg-brand ml-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-accent-fg shadow-sm transition hover:opacity-90"
            >
              <PlusIcon className="size-4" />
              Post an event
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid h-[var(--nav-h)] max-w-md grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon, primary }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                    active ? "text-fg" : "text-muted"
                  }`}
                >
                  {primary ? (
                    <span className="bg-brand grid h-8 w-12 place-items-center rounded-xl text-accent-fg shadow-md">
                      <Icon className="size-5" strokeWidth={2.5} />
                    </span>
                  ) : (
                    <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                  )}
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
