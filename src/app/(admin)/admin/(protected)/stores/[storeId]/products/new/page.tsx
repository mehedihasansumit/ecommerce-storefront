import { CategoryService } from "@/features/categories/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import Link from "next/link";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const categories = await CategoryService.getByStore(storeId);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/admin/stores/${storeId}/products`} className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900">New Product</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <ProductForm storeId={storeId} categories={categories} />
    </div>
  );
}
