import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { IUser } from "@/shared/types/auth";

const TOKEN_KEY = "customer-token";

export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  fullUser: IUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  setFullUser: (user: IUser) => void;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  fullUser: null,
  token: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  setFullUser: (fullUser) =>
    set({
      fullUser,
      user: { userId: fullUser._id, email: fullUser.email, name: fullUser.name },
    }),

  setToken: (token) => {
    SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ user: null, fullUser: null, token: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ token: token ?? null, isLoading: false });
  },
}));
