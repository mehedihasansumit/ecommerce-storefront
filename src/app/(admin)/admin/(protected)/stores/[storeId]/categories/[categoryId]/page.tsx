import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tAdmin } from "@/shared/lib/i18n";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/shared/components/ui";

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
    <div className="max-w-3xl mx-auto">
      <PageHeader
        breadcrumbs={
          <Link
            href={`/admin/stores/${storeId}/categories`}
            className="inline-flex items-center gap-1 text-xs text-admin-text-subtle hover:text-admin-text-primary transition-colors"
          >
            <ChevronLeft size={14} />
            Categories
          </Link>
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
