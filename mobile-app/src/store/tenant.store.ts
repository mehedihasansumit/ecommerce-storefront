import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import type { IStore } from "@/shared/types/store";

const storage = createMMKV({ id: "tenant-store" });

interface TenantState {
  store: IStore | null;
  domain: string;
  setStore: (store: IStore, domain: string) => void;
  clearStore: () => void;
  hydrate: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  store: null,
  domain: "",

  setStore: (store, domain) => {
    storage.set("store", JSON.stringify(store));
    storage.set("domain", domain);
    set({ store, domain });
  },

  clearStore: () => {
    storage.remove("store");
    storage.remove("domain");
    set({ store: null, domain: "" });
  },

  hydrate: () => {
    const raw = storage.getString("store");
    const domain = storage.getString("domain") ?? "";
    if (raw) {
      try {
        set({ store: JSON.parse(raw), domain });
      } catch {
        storage.remove("store");
}
    }
  },
}));
