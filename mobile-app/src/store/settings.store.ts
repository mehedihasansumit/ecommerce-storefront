import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import { getLocales } from "expo-localization";

const storage = createMMKV({ id: "settings-store" });

type ColorScheme = "light" | "dark" | "system";

interface SettingsState {
  locale: string;
  colorScheme: ColorScheme;
  setLocale: (locale: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  hydrate: () => void;
}

function detectLocale(): string {
  const locales = getLocales();
  const tag = locales[0]?.languageTag ?? "en";
  return tag.startsWith("bn") ? "bn" : "en";
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: "en",
  colorScheme: "system",

  setLocale: (locale) => {
    storage.set("locale", locale);
    set({ locale });
  },

  setColorScheme: (colorScheme) => {
    storage.set("colorScheme", colorScheme);
    set({ colorScheme });
  },

  hydrate: () => {
    const locale = storage.getString("locale") ?? detectLocale();
    const colorScheme = (storage.getString("colorScheme") as ColorScheme) ?? "system";
    set({ locale, colorScheme });
  },
}));
