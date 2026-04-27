import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { IStore } from "@/shared/types/store";

interface TenantState {
  store: IStore | null;
  domain: string;
  setStore: (store: IStore, domain: string) => void;
  clearStore: () => void;
  hydrate: () => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  store: null,
  domain: "",

  setStore: (store, domain) => {
    AsyncStorage.setItem("tenant:store", JSON.stringify(store));
    AsyncStorage.setItem("tenant:domain", domain);
    set({ store, domain });
  },

  clearStore: () => {
    AsyncStorage.removeItem("tenant:store");
    AsyncStorage.removeItem("tenant:domain");
    set({ store: null, domain: "" });
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem("tenant:store");
    const domain = (await AsyncStorage.getItem("tenant:domain")) ?? "";
    if (raw) {
      try {
        set({ store: JSON.parse(raw), domain });
      } catch {
        AsyncStorage.removeItem("tenant:store");
      }
    }
  },
}));
