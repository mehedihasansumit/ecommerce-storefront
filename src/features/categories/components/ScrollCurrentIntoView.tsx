"use client";

import { useEffect } from "react";

/**
 * Brings the `aria-current` link of a horizontally scrolling list into view, so a shopper
 * who lands on a category further along the chip row still sees it highlighted. Only the
 * list scrolls (never the page), and only when the chip is actually off-screen. Re-runs
 * when `activeKey` changes, since a client-side navigation keeps this component mounted.
 */
export function ScrollCurrentIntoView({
  targetId,
  activeKey,
}: {
  targetId: string;
  activeKey?: string;
}) {
  useEffect(() => {
    const list = document.getElementById(targetId);
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const l = list.getBoundingClientRect();
    const c = current.getBoundingClientRect();
    if (c.left >= l.left && c.right <= l.right) return;
    list.scrollLeft += c.left - l.left - (l.width - c.width) / 2;
  }, [targetId, activeKey]);
  return null;
}
