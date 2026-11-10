import { redirect, notFound } from "next/navigation";
import { Card, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
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
      <PageHeader
        title="Edit Coupon"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Coupons", href: `/admin/stores/${storeId}/coupons` },
              { label: "Edit Coupon" },
            ]}
          />
        }
      />
      <Card padding="lg" className="max-w-2xl">
        <CouponForm
          storeId={storeId}
          coupon={JSON.parse(JSON.stringify(coupon))}
        />
      </Card>
    </div>
  );
}
