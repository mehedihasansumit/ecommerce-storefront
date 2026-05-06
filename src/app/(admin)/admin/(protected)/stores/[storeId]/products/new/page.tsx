import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import Link from "next/link";
import { notFound } from "next/navigation";
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
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href={`/admin/stores/${storeId}/products`} className="hover:text-gray-900">
              Products
            </Link>
            <span>/</span>
            <span className="text-gray-900">New Product</span>
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
