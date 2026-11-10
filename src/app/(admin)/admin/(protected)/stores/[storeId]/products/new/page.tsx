import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../../_components/AdminBreadcrumbs";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const [store, categories] = await Promise.all([
    StoreService.getById(storeId),
    CategoryService.getByStore(storeId),
  ]);

  if (!store) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add New Product"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Products", href: `/admin/stores/${storeId}/products` },
              { label: "New Product" },
            ]}
          />
        }
      />

      <ProductForm
        storeId={storeId}
        categories={categories}
        supportedLanguages={store.supportedLanguages}
      />
    </div>
  );
}
