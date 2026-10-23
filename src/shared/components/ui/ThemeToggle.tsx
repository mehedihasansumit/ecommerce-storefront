"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/shared/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  /** "header" renders styled for the storefront header (white/10 hover) */
  variant?: "header" | "sidebar" | "default";
}

export function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { theme, isDark, toggle } = useTheme();
  const tr = useTranslations("header");

  // Icon shows the current mode (sun = light, moon = dark), not the next one.
  const Icon = theme === "system" ? Monitor : isDark ? Moon : Sun;

  const base =
    "inline-flex min-h-10 min-w-10 items-center justify-center p-2.5 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring,var(--color-primary))]";

  const styles: Record<string, string> = {
    header: "hover:bg-current/10",
    sidebar: "text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]",
    default: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={tr("toggleTheme")}
      className={[base, styles[variant], className ?? ""].filter(Boolean).join(" ")}
    >
      <Icon size={18} />
    </button>
  );
}
