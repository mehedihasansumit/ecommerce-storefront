import { redirect, notFound } from "next/navigation";
import { Card, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
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
      <PageHeader
        title="Create Coupon"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Coupons", href: `/admin/stores/${storeId}/coupons` },
              { label: "New Coupon" },
            ]}
          />
        }
      />
      <Card padding="lg" className="max-w-2xl">
        <CouponForm storeId={storeId} />
      </Card>
    </div>
  );
}
