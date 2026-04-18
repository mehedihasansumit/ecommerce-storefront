"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-admin-text-subtle hover:text-red-400 hover:bg-red-950/30 transition-all text-[13px] font-medium"
    >
      <LogOut size={15} />
      <span>Sign out</span>
    </button>
  );
}
