import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
      <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted mb-3 flex-wrap">
        <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link
          href={`/admin/stores/${storeId}/campaigns`}
          className="hover:text-admin-text-secondary transition-colors"
        >
          Campaigns
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-admin-text-secondary font-medium">New</span>
      </nav>

      <h1 className="text-2xl font-bold text-admin-text-primary mb-6">New Campaign</h1>

      <CampaignForm storeId={storeId} categories={categories} />
    </div>
  );
}
