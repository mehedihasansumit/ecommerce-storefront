"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  isDark: false,
  toggle: () => {},
});

function getSystemDark() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as ThemeMode) || "system";
    setTheme(stored);

    const dark =
      stored === "dark" || (stored === "system" && getSystemDark());
    setIsDark(dark);
    applyDark(dark);

    if (stored === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        applyDark(e.matches);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode =
        prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      localStorage.setItem("theme", next);
      const dark = next === "dark" || (next === "system" && getSystemDark());
      setIsDark(dark);
      applyDark(dark);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
