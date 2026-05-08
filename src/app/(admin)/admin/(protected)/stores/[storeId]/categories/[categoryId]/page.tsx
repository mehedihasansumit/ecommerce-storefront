import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tAdmin } from "@/shared/lib/i18n";
import { ChevronRight } from "lucide-react";
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
          <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted flex-wrap">
            <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}/categories`} className="hover:text-admin-text-secondary transition-colors">Categories</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-admin-text-secondary font-medium">{name}</span>
          </nav>
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
