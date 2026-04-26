import { createContext, useContext, type ReactNode } from "react";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import type { IStoreTheme } from "@/shared/types/store";

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  borderRadius: string;
  isDark: boolean;
  // raw theme for advanced use
  raw: IStoreTheme | null;
}

const DEFAULT_THEME: AppTheme = {
  primaryColor: "#3B82F6",
  secondaryColor: "#6B7280",
  accentColor: "#F59E0B",
  bgColor: "#FFFFFF",
  textColor: "#111827",
  headerBg: "#FFFFFF",
  headerText: "#111827",
  cardBg: "#FFFFFF",
  borderRadius: "8px",
  isDark: false,
  raw: null,
};

const ThemeContext = createContext<AppTheme>(DEFAULT_THEME);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storeTheme = useTenantStore((s) => s.store?.theme ?? null);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const isDark = colorScheme === "dark";

  let theme: AppTheme;

  if (!storeTheme) {
    theme = { ...DEFAULT_THEME, isDark };
  } else {
    const dark = isDark && storeTheme.dark ? storeTheme.dark : null;

    theme = {
      primaryColor: dark?.primaryColor ?? storeTheme.primaryColor ?? DEFAULT_THEME.primaryColor,
      secondaryColor: dark?.secondaryColor ?? storeTheme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
      accentColor: dark?.accentColor ?? storeTheme.accentColor ?? DEFAULT_THEME.accentColor,
      bgColor: dark?.backgroundColor ?? storeTheme.backgroundColor ?? "#FFFFFF",
      textColor: dark?.textColor ?? storeTheme.textColor ?? "#111827",
      headerBg: dark?.headerBg ?? storeTheme.headerBg ?? "#FFFFFF",
      headerText: dark?.headerText ?? storeTheme.headerText ?? "#111827",
      cardBg: dark?.cardBg ?? storeTheme.cardBg ?? "#FFFFFF",
      borderRadius: storeTheme.borderRadius ?? "8px",
      isDark,
      raw: storeTheme,
    };
  }

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
