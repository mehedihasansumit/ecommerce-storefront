import { StoreService } from "@/features/stores/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Tag, ShoppingBag, Users } from "lucide-react";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await StoreService.getById(storeId);

  if (!store) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-gray-500">
            {store.domains.join(", ")}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            store.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {store.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickLink
          href={`/admin/stores/${storeId}/products`}
          icon={<Package size={24} />}
          label="Products"
        />
        <QuickLink
          href={`/admin/stores/${storeId}/categories`}
          icon={<Tag size={24} />}
          label="Categories"
        />
        <QuickLink
          href={`/admin/stores/${storeId}/orders`}
          icon={<ShoppingBag size={24} />}
          label="Orders"
        />
        <QuickLink
          href={`/admin/stores/${storeId}/customers`}
          icon={<Users size={24} />}
          label="Customers"
        />
      </div>

      {/* Theme Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Theme</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch label="Primary" color={store.theme.primaryColor} />
          <ColorSwatch label="Secondary" color={store.theme.secondaryColor} />
          <ColorSwatch label="Accent" color={store.theme.accentColor} />
          <ColorSwatch label="Header BG" color={store.theme.headerBg} />
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Font: {store.theme.fontFamily} | Layout: {store.theme.layoutStyle} |
          Radius: {store.theme.borderRadius}
        </p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
    >
      <span className="text-gray-600">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-md border border-gray-200"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-mono">{color}</p>
      </div>
    </div>
  );
}
