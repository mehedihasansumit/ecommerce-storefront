/**
 * The logged-in customer as the storefront header shows it, or null.
 *
 * The header and the mobile bottom nav both ask on every page change; calls
 * within SHARE_MS of each other share one request instead of sending two. The
 * window is short so a login or logout is never hidden behind an old answer.
 * Always `no-store`: the browser must not keep a copy (a cached `null` would
 * show a shopper as logged out after logging in).
 */
import type { IAvatarPosition } from "@/features/auth/types";

export type CustomerSession = {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  avatarPosition: IAvatarPosition | null;
} | null;

const SHARE_MS = 1000;
let recent: { at: number; promise: Promise<CustomerSession> } | null = null;

export function fetchCustomerSession(): Promise<CustomerSession> {
  const now = Date.now();
  if (recent && now - recent.at < SHARE_MS) return recent.promise;
  const promise = fetch("/api/auth/customer", { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => (data?.user ?? null) as CustomerSession);
  recent = { at: now, promise };
  promise.catch(() => {
    if (recent?.promise === promise) recent = null;
  });
  return promise;
}
