/**
 * Count rules for the home "Shop by Category" section, in one place.
 *
 * Phones (< 640px):
 *   1–3  → one row, 3-column grid
 *   4    → 2×2 grid
 *   5–6  → 3-column grid, 2 rows
 *   7–12 → horizontal snap-scroll row (~3.5 tiles visible)
 *   > 12 → scroll row of the first 8 + a "View all" tile
 *
 * Tablet/desktop (>= 640px):
 *   1–4  → existing compact "collection" row cards (one row)
 *   5–6  → one row of equal tiles
 *   7–12 → two balanced rows (e.g. 4+3, 5+5), the shorter row centred
 *   > 12 → 11 tiles + "View all" in two rows of 6
 */
export type CategoryPhoneLayout = "grid-3" | "grid-2" | "scroll";

export interface CategoryLayout {
  phone: CategoryPhoneLayout;
  /** Tiles rendered on phones (excluding the "View all" tile). */
  phoneCount: number;
  /** Tiles rendered on tablet/desktop (excluding the "View all" tile). */
  desktopCount: number;
  /** Columns per row on tablet/desktop. */
  desktopCols: number;
  /** Compact horizontal row cards on >= md (only for small counts). */
  desktopRowCards: boolean;
  /** Append a "View all" tile linking to the full catalogue. */
  viewAllTile: boolean;
}

export const CATEGORY_LAYOUT_MAX = 12;
const PHONE_OVERFLOW_COUNT = 8;

export function getCategoryLayout(n: number): CategoryLayout {
  const count = Math.max(0, Math.floor(n));
  if (count > CATEGORY_LAYOUT_MAX) {
    return {
      phone: "scroll",
      phoneCount: PHONE_OVERFLOW_COUNT,
      desktopCount: CATEGORY_LAYOUT_MAX - 1,
      desktopCols: 6,
      desktopRowCards: false,
      viewAllTile: true,
    };
  }
  const phone: CategoryPhoneLayout = count === 4 ? "grid-2" : count <= 6 ? "grid-3" : "scroll";
  return {
    phone,
    phoneCount: count,
    desktopCount: count,
    desktopCols: count <= 6 ? Math.max(count, 1) : Math.ceil(count / 2),
    desktopRowCards: count <= 4,
    viewAllTile: false,
  };
}
