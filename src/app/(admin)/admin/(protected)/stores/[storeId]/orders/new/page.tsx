import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateOrderForm } from "./CreateOrderForm";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/admin/stores/${storeId}/orders`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manually create an order on behalf of a customer.
        </p>
      </div>

      <CreateOrderForm storeId={storeId} />
    </div>
  );
}
