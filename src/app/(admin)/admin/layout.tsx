import Link from "next/link";
import { Store, Package, Tag, ShoppingBag, Users, LayoutDashboard } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
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
      <main className="flex-1 bg-gray-50">
        <div className="p-6 md:p-8">{children}</div>
      </main>
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
