import type { CategoryStyle } from "@/features/stores/styles";
import { CategoryShowcase, CategoryShowcaseSkeleton, type CategoryShowcaseItem } from "./CategoryShowcase";
import { PlateShowcase, PlateShowcaseSkeleton } from "./PlateShowcase";
import { ScrollRowShowcase, ScrollRowShowcaseSkeleton } from "./ScrollRowShowcase";
import { CardShowcase, CardShowcaseSkeleton } from "./CardShowcase";

interface CategorySectionProps {
  /** The Store's categoryStyle Style Switch. */
  categoryStyle: CategoryStyle;
  title: string;
  /** One-line intro under the title (only the "plates" style shows it). */
  description: string;
  items: CategoryShowcaseItem[];
  viewAllHref: string;
  viewAllLabel: string;
  locale: string;
}

/** Home "Shop by Category" in the Store's categoryStyle. */
export function CategorySection({ categoryStyle, ...props }: CategorySectionProps) {
  switch (categoryStyle) {
    case "plates":
      return <PlateShowcase {...props} />;
    case "scroll-row":
      return <ScrollRowShowcase {...props} />;
    case "cards":
      return <CardShowcase {...props} />;
    default:
      return <CategoryShowcase {...props} />;
  }
}

/** Loading state of CategorySection: same style, same count-driven geometry. */
export function CategorySectionSkeleton({
  categoryStyle,
  count,
  longestName,
}: {
  categoryStyle: CategoryStyle;
  count: number;
  longestName: number;
}) {
  switch (categoryStyle) {
    case "plates":
      return <PlateShowcaseSkeleton count={count} longestName={longestName} />;
    case "scroll-row":
      return <ScrollRowShowcaseSkeleton count={count} longestName={longestName} />;
    case "cards":
      return <CardShowcaseSkeleton count={count} longestName={longestName} />;
    default:
      return <CategoryShowcaseSkeleton count={count} longestName={longestName} />;
  }
}
