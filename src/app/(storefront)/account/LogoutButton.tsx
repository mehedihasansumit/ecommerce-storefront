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
      className="px-4 py-2 text-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      {label}
    </button>
  );
}
