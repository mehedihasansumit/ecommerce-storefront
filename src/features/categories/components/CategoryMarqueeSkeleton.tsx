import type { ReactNode } from "react";
import { MarqueeSkeletonRow } from "@/shared/components/storefront/MarqueeSkeleton";

/** Loading state of CategoryMarqueeRow: one non-moving set with the same geometry. */
export function CategoryMarqueeSkeletonRow(props: {
  className?: string;
  setClassName?: string;
  children: ReactNode;
}) {
  return <MarqueeSkeletonRow {...props} />;
}
