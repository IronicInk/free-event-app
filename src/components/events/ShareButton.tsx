"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

interface ShareButtonProps {
  /** Path to share, e.g. "/events/abc". Turned into a full URL at click time. */
  path: string;
  title: string;
  text?: string;
  variant?: "rail" | "pill" | "icon" | "overlay";
}

/**
 * Opens the phone's native share sheet (Instagram, Messages, TikTok…).
 * On desktop, where that isn't available, it copies the link instead.
 */
export function ShareButton({ path, title, text, variant = "pill" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = new URL(path, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // The user closing the share sheet is not an error.
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Otherwise fall through to copying the link.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort for browsers that block clipboard access.
      window.prompt("Copy this link:", url);
    }
  }

  const Icon = copied ? CheckIcon : ShareIcon;
  const label = copied ? "Link copied" : "Share";

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${title}`}
        className="flex flex-col items-center gap-1 text-xs font-semibold text-white"
      >
        <span className="grid size-12 place-items-center rounded-full bg-black/30 backdrop-blur-sm transition active:scale-90">
          <Icon className="size-6" />
        </span>
        {copied ? "Copied" : "Share"}
      </button>
    );
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? "Link copied" : `Share ${title}`}
        className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-90"
      >
        <Icon className="size-5" />
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? "Link copied" : `Share ${title}`}
        className="grid size-10 place-items-center rounded-full bg-surface-2 transition hover:opacity-80 active:scale-90"
      >
        <Icon className="size-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 rounded-full bg-surface-2 px-5 py-3 text-sm font-semibold transition hover:opacity-80 active:scale-95"
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
