import type { LocalizedString } from "@/shared/types/i18n";

/**
 * A size chart for every product in a category. Column headings are localized;
 * cells are measurements ("38", "71 cm") and stay as typed.
 */
export interface ISizeGuide {
  columns: LocalizedString[];
  rows: string[][];
  note: LocalizedString;
}

export interface ICategory {
  _id: string;
  storeId: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString;
  image: string;
  sizeGuide: ISizeGuide | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

