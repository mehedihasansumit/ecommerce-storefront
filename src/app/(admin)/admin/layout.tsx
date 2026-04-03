"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, LayoutDashboard, Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink href="/admin" icon={<LayoutDashboard size={18} />}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/admin/stores" icon={<Store size={18} />}>
            Stores
          </SidebarLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <MobileAdminNav />
        <main className="flex-1">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function MobileAdminNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden bg-gray-900 text-white border-b border-gray-800">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="text-lg font-bold">
          Admin
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Panel */}
      {isOpen && (
        <nav className="px-4 pb-4 space-y-1 border-t border-gray-800">
          <MobileSidebarLink
            href="/admin"
            icon={<LayoutDashboard size={18} />}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </MobileSidebarLink>
          <MobileSidebarLink
            href="/admin/stores"
            icon={<Store size={18} />}
            onClick={() => setIsOpen(false)}
          >
            Stores
          </MobileSidebarLink>
        </nav>
      )}
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
    >
      {icon}
      <span className="text-sm">{children}</span>
    </Link>
  );
}

function MobileSidebarLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
    >
      {icon}
      <span className="text-sm">{children}</span>
    </Link>
  );
}
