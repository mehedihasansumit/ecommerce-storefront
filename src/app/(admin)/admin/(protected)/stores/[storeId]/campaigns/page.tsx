import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Plus, Megaphone } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CampaignService } from "@/features/campaigns/service";
import { StoreService } from "@/features/stores/service";
import { tAdmin } from "@/shared/lib/i18n";

const STATUS_TONE = {
  active: "success",
  scheduled: "warning",
  paused: "warning",
  expired: "neutral",
  archived: "neutral",
  draft: "neutral",
} as const;

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.CAMPAIGNS_VIEW)) redirect("/admin");

  const [{ campaigns }, store] = await Promise.all([
    CampaignService.listByStore(storeId, { limit: 200 }),
    StoreService.getById(storeId),
  ]);
  if (!store) notFound();

  const canCreate = hasPermission(adminUser, PERMISSIONS.CAMPAIGNS_CREATE);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description={`${campaigns.length} ${campaigns.length === 1 ? "campaign" : "campaigns"}`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Campaigns" },
            ]}
          />
        }
        actions={
          canCreate && (
            <Link
              href={`/admin/stores/${storeId}/campaigns/new`}
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              <Plus aria-hidden className="w-4 h-4" />
              New Campaign
            </Link>
          )
        }
      />

      {campaigns.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create the first one to start running promotions."
            action={
              canCreate && (
                <Link
                  href={`/admin/stores/${storeId}/campaigns/new`}
                  className={buttonClassName({ variant: "primary", size: "md" })}
                >
                  <Plus aria-hidden className="w-4 h-4" />
                  New Campaign
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-175 text-sm">
              <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                <tr className="text-left text-xs uppercase tracking-wide text-admin-text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Window</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Usage</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-admin-text-primary">{tAdmin(c.name)}</td>
                    <td className="px-4 py-3 capitalize text-admin-text-secondary">{c.type}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE] ?? "neutral"} className="capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-admin-text-muted whitespace-nowrap">
                      {new Date(c.startDate).toLocaleDateString()} →{" "}
                      {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-admin-text-secondary">
                      {c.usageCount}
                      {c.usageLimit !== null ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/stores/${storeId}/campaigns/${c._id}`}
                        aria-label={`Edit ${tAdmin(c.name)}`}
                        className={buttonClassName({ variant: "ghost", size: "sm" })}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
