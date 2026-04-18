import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { tAdmin } from "@/shared/lib/i18n";

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
      <div className="flex items-center gap-2 text-sm text-admin-text-muted mb-6">
        <Link href={`/admin/stores/${storeId}/products`} className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900">{tAdmin(product.name)}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <ProductForm
        storeId={storeId}
        categories={categories}
        product={product}
        supportedLanguages={store.supportedLanguages}
      />
    </div>
  );
}
