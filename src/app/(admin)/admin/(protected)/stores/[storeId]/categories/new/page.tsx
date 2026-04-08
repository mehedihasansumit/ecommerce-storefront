import { StoreService } from "@/features/stores/service";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await StoreService.getById(storeId);

  if (!store) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={`/admin/stores/${storeId}/categories`} className="hover:text-gray-900">
          Categories
        </Link>
        <span>/</span>
        <span className="text-gray-900">New Category</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Add New Category</h1>

      <CategoryForm storeId={storeId} supportedLanguages={store.supportedLanguages} />
    </div>
  );
}
