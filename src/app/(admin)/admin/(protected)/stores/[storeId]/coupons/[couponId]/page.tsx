import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponService } from "@/features/coupons/service";
import { StoreService } from "@/features/stores/service";
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

  const [coupon, store] = await Promise.all([
    CouponService.getById(storeId, couponId),
    StoreService.getById(storeId),
  ]);
  if (!coupon) notFound();
  if (!store) notFound();

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted mb-3 flex-wrap">
        <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/admin/stores/${storeId}/coupons`} className="hover:text-admin-text-secondary transition-colors">Coupons</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-admin-text-secondary font-medium">Edit Coupon</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Edit Coupon</h1>
      <div className="bg-admin-surface rounded-lg border border-admin-border p-6">
        <CouponForm
          storeId={storeId}
          coupon={JSON.parse(JSON.stringify(coupon))}
        />
      </div>
    </div>
  );
}
