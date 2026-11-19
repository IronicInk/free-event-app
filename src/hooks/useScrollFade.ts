"use client";

import { useEffect, useRef } from "react";

/**
 * Fades the edge of a horizontal scroller when there's more content that way,
 * so people know they can swipe. Pair with the `scroll-fade` class (globals.css).
 *
 * It sets `data-fade-left` / `data-fade-right` on the element directly (no re-renders while
 * scrolling). The right fade shows until the end is reached; the left one once scrolled.
 */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.toggleAttribute("data-fade-left", el.scrollLeft > 2);
      el.toggleAttribute("data-fade-right", el.scrollLeft < max - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    // Re-check when the scroller or its content changes size (rotation, new results, fonts).
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const observeChildren = () => {
      for (const child of el.children) resize.observe(child);
    };
    observeChildren();
    const mutations = new MutationObserver(() => {
      observeChildren();
      update();
    });
    mutations.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, []);

  return ref;
}
