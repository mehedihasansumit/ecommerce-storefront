import { apiClient } from "./client";
import type { IUser } from "@/shared/types/auth";
import type { AuthUser } from "@/store/auth.store";

export async function login(email: string, password: string): Promise<IUser> {
  const { data } = await apiClient.post<{ user: IUser }>("/api/auth/login", {
    email,
    password,
  });
  return data.user;
}

export async function register(payload: {
  name: string;
  email?: string;
  password: string;
  phone: string;
}): Promise<IUser> {
  const { data } = await apiClient.post<{ user: IUser }>("/api/auth/register", payload);
  return data.user;
}

// Returns lightweight shape (userId, email, name) or null
export async function getMe(): Promise<AuthUser | null> {
  try {
    const { data } = await apiClient.get<{ user: AuthUser | null }>("/api/auth/customer");
    return data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout");
  } catch {}
}
