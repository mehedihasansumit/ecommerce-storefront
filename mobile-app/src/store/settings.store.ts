import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

type ColorScheme = "light" | "dark" | "system";

interface SettingsState {
  locale: string;
  colorScheme: ColorScheme;
  setLocale: (locale: string) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  hydrate: () => Promise<void>;
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
    AsyncStorage.setItem("settings:locale", locale);
    set({ locale });
  },

  setColorScheme: (colorScheme) => {
    AsyncStorage.setItem("settings:colorScheme", colorScheme);
    set({ colorScheme });
  },

  hydrate: async () => {
    const locale = (await AsyncStorage.getItem("settings:locale")) ?? detectLocale();
    const colorScheme = ((await AsyncStorage.getItem("settings:colorScheme")) as ColorScheme) ?? "system";
    set({ locale, colorScheme });
  },
}));
