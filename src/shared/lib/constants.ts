import type { IStoreTheme } from "@/features/stores/types";
import {
  getDefaultLightTheme,
  getDefaultDarkTheme,
} from "@/features/stores/theme-tokens";

// Source colors from THEME_TOKENS registry — single source of truth.
// Required IStoreTheme fields are guaranteed by registry `lightDefault`s.
// Adding a color in `theme-tokens.ts` automatically reflects here.
export const DEFAULT_THEME: IStoreTheme = {
  ...(getDefaultLightTheme() as Partial<IStoreTheme>),
  fontFamily: "Inter",
  borderRadius: "0.5rem",
  layoutStyle: "grid",
  dark: getDefaultDarkTheme() as IStoreTheme["dark"],
} as IStoreTheme;

export const ITEMS_PER_PAGE = 12;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};
