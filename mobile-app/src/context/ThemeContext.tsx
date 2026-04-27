import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
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
  // Semantic tokens (new)
  surface: string;
  border: string;
  textSecondary: string;
  textTertiary: string;
  error: string;
  success: string;
  warning: string;
  borderRadius: string;
  isDark: boolean;
  raw: IStoreTheme | null;
}

const LIGHT: AppTheme = {
  primaryColor: "#3B82F6",
  secondaryColor: "#6B7280",
  accentColor: "#F59E0B",
  bgColor: "#FFFFFF",
  textColor: "#111827",
  headerBg: "#FFFFFF",
  headerText: "#111827",
  cardBg: "#FFFFFF",
  surface: "#FAFAFA",
  border: "#F3F4F6",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  borderRadius: "8px",
  isDark: false,
  raw: null,
};

const DARK: AppTheme = {
  ...LIGHT,
  bgColor: "#0F172A",
  textColor: "#F1F5F9",
  headerBg: "#1E293B",
  headerText: "#F1F5F9",
  cardBg: "#1E293B",
  surface: "#1E293B",
  border: "#334155",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  error: "#F87171",
  success: "#4ADE80",
  warning: "#FBBF24",
  isDark: true,
};

const ThemeContext = createContext<AppTheme>(LIGHT);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storeTheme = useTenantStore((s) => s.store?.theme ?? null);
  const colorSchemeSetting = useSettingsStore((s) => s.colorScheme);
  const systemScheme = useColorScheme();

  const isDark =
    colorSchemeSetting === "dark" ||
    (colorSchemeSetting === "system" && systemScheme === "dark");

  const base = isDark ? DARK : LIGHT;

  let theme: AppTheme;

  if (!storeTheme) {
    theme = { ...base };
  } else {
    const darkOverride = isDark && storeTheme.dark ? storeTheme.dark : null;

    theme = {
      // Semantic tokens — always use dark/light system defaults (store doesn't supply these)
      surface: base.surface,
      border: base.border,
      textSecondary: base.textSecondary,
      textTertiary: base.textTertiary,
      error: base.error,
      success: base.success,
      warning: base.warning,
      // Store-supplied colors with dark override priority
      primaryColor:
        darkOverride?.primaryColor ?? storeTheme.primaryColor ?? base.primaryColor,
      secondaryColor:
        darkOverride?.secondaryColor ?? storeTheme.secondaryColor ?? base.secondaryColor,
      accentColor:
        darkOverride?.accentColor ?? storeTheme.accentColor ?? base.accentColor,
      bgColor:
        darkOverride?.backgroundColor ?? storeTheme.backgroundColor ?? base.bgColor,
      textColor:
        darkOverride?.textColor ?? storeTheme.textColor ?? base.textColor,
      headerBg:
        darkOverride?.headerBg ?? storeTheme.headerBg ?? base.headerBg,
      headerText:
        darkOverride?.headerText ?? storeTheme.headerText ?? base.headerText,
      cardBg:
        darkOverride?.cardBg ?? storeTheme.cardBg ?? base.cardBg,
      borderRadius: storeTheme.borderRadius ?? base.borderRadius,
      isDark,
      raw: storeTheme,
    };
  }

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
