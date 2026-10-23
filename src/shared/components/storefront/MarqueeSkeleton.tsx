import type { ReactNode } from "react";
import { MARQUEE_SET, MARQUEE_VIEWPORT } from "./marquee-classes";

/** Loading state of MarqueeRow: one non-moving set with the same geometry. Server-safe. */
export function MarqueeSkeletonRow({
  className = "",
  setClassName = "",
  children,
}: {
  className?: string;
  setClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${MARQUEE_VIEWPORT} overflow-hidden! ${className}`}>
      <div className="flex w-max">
        <ul className={`${MARQUEE_SET} ${setClassName}`}>{children}</ul>
      </div>
    </div>
  );
}
