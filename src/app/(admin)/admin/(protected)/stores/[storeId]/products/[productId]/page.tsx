import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { ProductForm } from "@/features/products/components/ProductForm";
import { notFound } from "next/navigation";
import { tAdmin } from "@/shared/lib/i18n";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../../_components/AdminBreadcrumbs";

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
    <div className="max-w-3xl">
      <PageHeader
        title="Edit Product"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Products", href: `/admin/stores/${storeId}/products` },
              { label: tAdmin(product.name) },
            ]}
          />
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
