import Link from "next/link";
import { CreateOrderForm } from "./CreateOrderForm";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/stores/${storeId}/orders`}
          className="text-sm text-gray-500 hover:text-gray-800 mb-1 inline-block"
        >
          ← Orders
        </Link>
        <h1 className="text-2xl font-bold">Create Order</h1>
      </div>

      <CreateOrderForm storeId={storeId} />
    </div>
  );
}
