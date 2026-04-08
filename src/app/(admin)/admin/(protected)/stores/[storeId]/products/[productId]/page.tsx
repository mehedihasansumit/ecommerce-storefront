import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeId: string; productId: string }>;
}) {
  const { storeId, productId } = await params;

  const [product, categories] = await Promise.all([
    ProductService.getById(productId),
    CategoryService.getByStore(storeId),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/admin/stores/${storeId}/products`} className="hover:text-gray-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <ProductForm storeId={storeId} categories={categories} product={product} />
    </div>
  );
}
