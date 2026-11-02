import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware Link / router / redirect for the storefront: they keep the
 * shopper on /bn when they are reading Bangla. Use these instead of
 * next/link and next/navigation in storefront code. Admin is outside
 * [locale] and keeps using next/link.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
