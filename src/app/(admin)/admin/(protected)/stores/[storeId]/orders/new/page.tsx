import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StoreService } from "@/features/stores/service";
import { CreateOrderForm } from "./CreateOrderForm";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const store = await StoreService.getById(storeId);
  if (!store) notFound();

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted mb-3 flex-wrap">
          <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/admin/stores/${storeId}/orders`} className="hover:text-admin-text-secondary transition-colors">Orders</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-admin-text-secondary font-medium">Create Order</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manually create an order on behalf of a customer.
        </p>
      </div>

      <CreateOrderForm storeId={storeId} />
    </div>
  );
}
