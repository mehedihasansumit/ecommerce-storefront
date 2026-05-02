import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/shared/components/ui";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await StoreService.getById(storeId);

  if (!store) notFound();

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
        title="Add New Category"
        description="Group products under a localized category name."
      />

      <CategoryForm storeId={storeId} supportedLanguages={store.supportedLanguages} />
    </div>
  );
}
