import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Plus, ChevronRight } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CampaignService } from "@/features/campaigns/service";
import { StoreService } from "@/features/stores/service";
import { tAdmin } from "@/shared/lib/i18n";

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
      <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted mb-3 flex-wrap">
        <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">
          Stores
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link
          href={`/admin/stores/${storeId}`}
          className="hover:text-admin-text-secondary transition-colors"
        >
          {store.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-admin-text-secondary font-medium">Campaigns</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Campaigns</h1>
          <p className="text-sm text-admin-text-muted mt-0.5">
            {campaigns.length} {campaigns.length === 1 ? "campaign" : "campaigns"}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/stores/${storeId}/campaigns/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        )}
      </div>

      {campaigns.length === 0 ? (
        <div className="border border-dashed rounded-xl p-10 text-center text-admin-text-muted">
          No campaigns yet. Create the first one to start running promotions.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-admin-border-md">
          <table className="w-full text-sm">
            <thead className="bg-admin-surface">
              <tr className="text-left text-xs uppercase tracking-wide text-admin-text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id} className="border-t border-admin-border-md">
                  <td className="px-4 py-3 font-medium">{tAdmin(c.name)}</td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize bg-gray-100 dark:bg-gray-800">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(c.startDate).toLocaleDateString()} →{" "}
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.usageCount}
                    {c.usageLimit !== null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/stores/${storeId}/campaigns/${c._id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
