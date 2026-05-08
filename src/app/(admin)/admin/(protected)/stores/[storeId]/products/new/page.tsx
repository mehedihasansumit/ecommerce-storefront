import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/shared/components/ui";

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
    <div>
      <PageHeader
        title="Add New Product"
        breadcrumbs={
          <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted flex-wrap">
            <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/admin/stores/${storeId}/products`} className="hover:text-admin-text-secondary transition-colors">Products</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-admin-text-secondary font-medium">New Product</span>
          </nav>
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
