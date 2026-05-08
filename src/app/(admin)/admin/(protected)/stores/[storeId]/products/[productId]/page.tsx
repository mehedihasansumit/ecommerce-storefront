import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tAdmin } from "@/shared/lib/i18n";
import { PageHeader } from "@/shared/components/ui";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeId: string; productId: string }>;
}) {
  const { storeId, productId } = await params;

  const [product, categories, store] = await Promise.all([
    ProductService.getById(productId),
    CategoryService.getByStore(storeId),
    StoreService.getById(storeId),
  ]);

  if (!product || !store) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Product"
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
            <span className="text-admin-text-secondary font-medium">{tAdmin(product.name)}</span>
          </nav>
        }
      />

      <ProductForm
        storeId={storeId}
        categories={categories}
        product={product}
        supportedLanguages={store.supportedLanguages}
      />
    </div>
  );
}
