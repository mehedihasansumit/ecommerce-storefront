"use client";

import { useRef, type ComponentProps } from "react";
import { Link, useRouter } from "@/i18n/navigation";

/**
 * A storefront Link that loads its page ahead of time only when the shopper
 * points at it (mouse over, or finger down on a phone), not as soon as it
 * scrolls into view. A product grid can hold 24+ links; prefetching all of them
 * cost the server about 20 extra requests per page view, most for products the
 * shopper never opens. Pointing gives ~100-300 ms of head start before the
 * click, which is enough for the page to feel instant.
 */
export function HoverPrefetchLink({ onMouseEnter, onTouchStart, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  const done = useRef(false);

  const prefetch = () => {
    if (done.current || typeof props.href !== "string") return;
    done.current = true;
    router.prefetch(props.href);
  };

  return (
    <Link
      {...props}
      prefetch={false}
      onMouseEnter={(e) => {
        prefetch();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        prefetch();
        onTouchStart?.(e);
      }}
    />
  );
}
