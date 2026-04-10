import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponService } from "@/features/coupons/service";
import { CouponTable } from "@/features/coupons/components/CouponTable";

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.COUPONS_VIEW)) redirect("/admin");

  const { coupons } = await CouponService.listByStore(storeId);
  const canCreate = hasPermission(adminUser, PERMISSIONS.COUPONS_CREATE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-gray-500">
            Manage discount coupons for your store
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/stores/${storeId}/coupons/new`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Coupon
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CouponTable coupons={JSON.parse(JSON.stringify(coupons))} storeId={storeId} />
      </div>
    </div>
  );
}
