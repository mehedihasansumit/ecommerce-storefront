import Link from "next/link";
import { Store, LayoutDashboard, ShoppingBag, Users } from "lucide-react";
import { MobileAdminNav } from "./_components/MobileAdminNav";

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
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <Link
            href="/admin/stores"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Store size={18} />
            <span className="text-sm">Stores</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ShoppingBag size={18} />
            <span className="text-sm">All Orders</span>
          </Link>
          <Link
            href="/admin/customers"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Users size={18} />
            <span className="text-sm">Customers</span>
          </Link>
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
