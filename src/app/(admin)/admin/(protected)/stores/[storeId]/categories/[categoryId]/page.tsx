import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tAdmin } from "@/shared/lib/i18n";

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

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/admin/stores/${storeId}/categories`} className="hover:text-gray-900">
          Categories
        </Link>
        <span>/</span>
        <span className="text-gray-900">{tAdmin(category.name)}</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Category</h1>

      <CategoryForm
        storeId={storeId}
        category={category}
        supportedLanguages={store.supportedLanguages}
      />
    </div>
  );
}
