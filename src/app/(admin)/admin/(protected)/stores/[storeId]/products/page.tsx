import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductService } from "@/features/products/service";
import { tAdmin } from "@/shared/lib/i18n";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (
    !adminUser ||
    (!hasPermission(adminUser, PERMISSIONS.PRODUCTS_CREATE) &&
      !hasPermission(adminUser, PERMISSIONS.PRODUCTS_EDIT) &&
      !hasPermission(adminUser, PERMISSIONS.PRODUCTS_DELETE))
  ) {
    redirect("/admin");
  }

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  const result = await ProductService.getByStore(storeId, { page: 1, limit: 50 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href={`/admin/stores/${storeId}/products/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          + New Product
        </Link>
      </div>

      {result.data.length === 0 ? (
        <p className="text-gray-500">No products yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Product
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Price
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.data.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={tAdmin(product.name)}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <span className="font-medium">{tAdmin(product.name)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">৳{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/stores/${storeId}/products/${product._id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
