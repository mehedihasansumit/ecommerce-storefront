import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../../_components/AdminBreadcrumbs";
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
    <div>
      <PageHeader
        title="Create Order"
        description="Manually create an order on behalf of a customer."
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Orders", href: `/admin/stores/${storeId}/orders` },
              { label: "Create Order" },
            ]}
          />
        }
      />

      <CreateOrderForm storeId={storeId} />
    </div>
  );
}
