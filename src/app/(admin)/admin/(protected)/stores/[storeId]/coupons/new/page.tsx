import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { StoreService } from "@/features/stores/service";
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

  const store = await StoreService.getById(storeId);
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
        <span className="text-admin-text-secondary font-medium">New Coupon</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Create Coupon</h1>
      <div className="bg-admin-surface rounded-lg border border-admin-border p-6">
        <CouponForm storeId={storeId} />
      </div>
    </div>
  );
}
