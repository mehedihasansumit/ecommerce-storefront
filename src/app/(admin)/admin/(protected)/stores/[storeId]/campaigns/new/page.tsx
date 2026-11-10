import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { StoreService } from "@/features/stores/service";
import { CategoryService } from "@/features/categories/service";
import { CampaignForm } from "@/features/campaigns/components/CampaignForm";

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.CAMPAIGNS_CREATE)) redirect("/admin");

  const [store, categories] = await Promise.all([
    StoreService.getById(storeId),
    CategoryService.getByStore(storeId),
  ]);
  if (!store) notFound();

  return (
    <div>
      <PageHeader
        title="New Campaign"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Campaigns", href: `/admin/stores/${storeId}/campaigns` },
              { label: "New" },
            ]}
          />
        }
      />

      <CampaignForm storeId={storeId} categories={categories} />
    </div>
  );
}
