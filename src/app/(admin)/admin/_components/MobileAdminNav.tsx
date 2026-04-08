"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, LayoutDashboard, ShoppingBag, Menu, X } from "lucide-react";

export function MobileAdminNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden bg-gray-900 text-white border-b border-gray-800">
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

      {isOpen && (
        <nav className="px-4 pb-4 space-y-1 border-t border-gray-800">
          <Link
            href="/admin"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link
            href="/admin/stores"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Store size={18} />
            <span className="text-sm">Stores</span>
          </Link>
          <Link
            href="/admin/orders"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ShoppingBag size={18} />
            <span className="text-sm">All Orders</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
