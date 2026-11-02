"use client";

import { createContext, useContext } from "react";
import type { LocalizedString } from "@/shared/types/i18n";

/** categoryId → category name, for the small category line on product cards. */
export type CategoryNames = Record<string, LocalizedString>;

const CategoryNamesContext = createContext<CategoryNames>({});

/** Filled once by the storefront layout so every product card can name its category. */
export function CategoryNamesProvider({
  names,
  children,
}: {
  names: CategoryNames;
  children: React.ReactNode;
}) {
  return <CategoryNamesContext.Provider value={names}>{children}</CategoryNamesContext.Provider>;
}

/** The category's name, or undefined when it is unknown (or outside a storefront). */
export function useCategoryName(categoryId: string | null | undefined): LocalizedString | undefined {
  const names = useContext(CategoryNamesContext);
  return categoryId ? names[categoryId] : undefined;
}
