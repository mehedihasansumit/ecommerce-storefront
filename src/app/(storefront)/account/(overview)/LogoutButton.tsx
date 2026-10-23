"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/account/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-sm border border-border-subtle text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors shrink-0"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      {label}
    </button>
  );
}
