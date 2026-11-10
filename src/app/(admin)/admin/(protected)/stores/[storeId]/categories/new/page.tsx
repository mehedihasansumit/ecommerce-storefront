import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../../_components/AdminBreadcrumbs";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await StoreService.getById(storeId);

  if (!store) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Categories", href: `/admin/stores/${storeId}/categories` },
              { label: "New Category" },
            ]}
          />
        }
        title="Add New Category"
        description="Group products under a localized category name."
      />

      <CategoryForm storeId={storeId} supportedLanguages={store.supportedLanguages} />
    </div>
  );
}
