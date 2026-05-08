import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
          <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted flex-wrap">
            <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}/categories`} className="hover:text-admin-text-secondary transition-colors">Categories</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-admin-text-secondary font-medium">New Category</span>
          </nav>
        }
        title="Add New Category"
        description="Group products under a localized category name."
      />

      <CategoryForm storeId={storeId} supportedLanguages={store.supportedLanguages} />
    </div>
  );
}
