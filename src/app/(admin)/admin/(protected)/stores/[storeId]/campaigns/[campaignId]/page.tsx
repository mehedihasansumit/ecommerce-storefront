import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CampaignService } from "@/features/campaigns/service";
import { StoreService } from "@/features/stores/service";
import { CategoryService } from "@/features/categories/service";
import { CampaignForm } from "@/features/campaigns/components/CampaignForm";
import { tAdmin } from "@/shared/lib/i18n";
import { PageHeader, Badge } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";

const STATUS_TONE = {
  active: "success",
  scheduled: "warning",
  paused: "warning",
  expired: "neutral",
  archived: "neutral",
  draft: "neutral",
} as const;

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ storeId: string; campaignId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId, campaignId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.CAMPAIGNS_EDIT)) redirect("/admin");

  const [campaign, store, categories] = await Promise.all([
    CampaignService.getById(storeId, campaignId),
    StoreService.getById(storeId),
    CategoryService.getByStore(storeId),
  ]);
  if (!campaign || !store) notFound();

  const statusTone =
    STATUS_TONE[campaign.status as keyof typeof STATUS_TONE] ?? "neutral";

  return (
    <div>
      <PageHeader
        title={tAdmin(campaign.name)}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Campaigns", href: `/admin/stores/${storeId}/campaigns` },
              { label: tAdmin(campaign.name) },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="capitalize">
              {campaign.type}
            </Badge>
            <Badge tone={statusTone} className="capitalize">
              {campaign.status}
            </Badge>
          </div>
        }
      />

      <CampaignForm
        storeId={storeId}
        categories={categories}
        initial={{
          _id: campaign._id,
          slug: campaign.slug,
          name: campaign.name as { en: string; bn?: string },
          description: campaign.description as { en?: string; bn?: string } | null,
          type: campaign.type,
          status: campaign.status,
          priority: campaign.priority,
          stackable: campaign.stackable,
          repeatable: campaign.repeatable,
          audience: campaign.audience,
          minCartTotal: campaign.minCartTotal,
          startDate: new Date(campaign.startDate).toISOString(),
          endDate: new Date(campaign.endDate).toISOString(),
          usageLimit: campaign.usageLimit,
          perUserLimit: campaign.perUserLimit,
          conditions: campaign.conditions,
          rewards: campaign.rewards,
          isActive: campaign.isActive,
        }}
      />
    </div>
  );
}
