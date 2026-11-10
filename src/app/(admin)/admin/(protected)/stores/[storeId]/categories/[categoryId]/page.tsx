import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { notFound } from "next/navigation";
import { tAdmin } from "@/shared/lib/i18n";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../../_components/AdminBreadcrumbs";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string; categoryId: string }>;
}) {
  const { storeId, categoryId } = await params;
  const [category, store] = await Promise.all([
    CategoryService.getById(categoryId),
    StoreService.getById(storeId),
  ]);

  if (!category || !store) {
    notFound();
  }

  const name = tAdmin(category.name);

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
              { label: name },
            ]}
          />
        }
        title={`Edit · ${name}`}
        description="Update category name, slug, and visibility."
      />

      <CategoryForm
        storeId={storeId}
        category={category}
        supportedLanguages={store.supportedLanguages}
      />
    </div>
  );
}
