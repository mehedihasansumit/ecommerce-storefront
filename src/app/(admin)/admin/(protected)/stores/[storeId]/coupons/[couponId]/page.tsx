import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponService } from "@/features/coupons/service";
import { CouponForm } from "@/features/coupons/components/CouponForm";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ storeId: string; couponId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId, couponId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.COUPONS_EDIT)) redirect("/admin");

  const coupon = await CouponService.getById(storeId, couponId);
  if (!coupon) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Coupon</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CouponForm
          storeId={storeId}
          coupon={JSON.parse(JSON.stringify(coupon))}
        />
      </div>
    </div>
  );
}
