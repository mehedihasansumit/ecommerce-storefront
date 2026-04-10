import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponForm } from "@/features/coupons/components/CouponForm";

export default async function NewCouponPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.COUPONS_CREATE)) redirect("/admin");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Coupon</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CouponForm storeId={storeId} />
      </div>
    </div>
  );
}
