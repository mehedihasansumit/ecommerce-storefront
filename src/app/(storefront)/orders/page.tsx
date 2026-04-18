import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft, Package } from "lucide-react";
import { getCustomerToken } from "@/shared/lib/auth";
import { getStoreId } from "@/shared/lib/tenant";
import { OrderService } from "@/features/orders/service";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { Card, Badge, EmptyState, Button, Price } from "@/shared/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("myOrders") };
}

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, { tone: "warning" | "neutral" | "success" | "danger" }> = {
  pending:    { tone: "warning" },
  confirmed:  { tone: "neutral" },
  processing: { tone: "neutral" },
  shipped:    { tone: "neutral" },
  delivered:  { tone: "success" },
  cancelled:  { tone: "danger"  },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations("orders");
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    redirect("/account/login");
  }

  const customerPayload = payload as JwtCustomerPayload;
  const storeId = await getStoreId();
  if (!storeId) redirect("/");

  const user = await AuthRepository.findUserById(customerPayload.userId);
  if (!user || !user.phone) redirect("/account");

  const { orders, total } = await OrderService.getByPhonePaginated(storeId, user.phone, {
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/account"
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg border border-border-subtle hover:border-primary/30 transition-colors shrink-0"
          aria-label="Back to account"
        >
          <ArrowLeft size={16} className="text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{t("myOrders")}</h1>
          {total > 0 && (
            <p className="text-xs text-text-tertiary mt-0.5">{total} orders total</p>
          )}
        </div>
      </div>

      {total === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={ShoppingBag}
            title={t("noOrders")}
            description="Your orders will appear here after you make a purchase."
            action={
              <Link href="/products">
                <Button variant="brand" size="lg">Start Shopping</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? { tone: "neutral" as const };
              const previewItems = order.items.slice(0, 2);
              const moreCount = order.items.length - previewItems.length;
              return (
                <Card key={order._id} padding="none">
                  <Link href={`/orders/${order._id}`} className="block hover:bg-surface dark:hover:bg-gray-800 transition-colors rounded-lg overflow-hidden">
                    <div className="px-5 py-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[var(--color-text)]">
                              #{order.orderNumber}
                            </span>
                            <Badge tone={badge.tone} size="sm">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-tertiary mt-1">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {" · "}
                            {t("items", { count: order.items.length })}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Price amount={order.total} size="md" />
                        </div>
                      </div>

                      {/* Item preview */}
                      {previewItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2">
                          <Package size={13} className="text-text-tertiary shrink-0" />
                          <p className="text-xs text-text-secondary truncate">
                            {previewItems.map((i) => i.productName).join(", ")}
                            {moreCount > 0 && ` +${moreCount} more`}
                          </p>
                          <ChevronRight size={14} className="text-text-tertiary shrink-0 ml-auto" />
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-text-secondary">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={`?page=${Math.max(1, currentPage - 1)}`}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-border-subtle text-text-tertiary"
                      : "border-border-subtle text-text-secondary hover:bg-surface dark:hover:bg-gray-800"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-text-tertiary"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={`?page=${item}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors ${
                          currentPage === item
                            ? "border-transparent text-white"
                            : "border-border-subtle text-text-secondary hover:bg-surface dark:hover:bg-gray-800"
                        }`}
                        style={
                          currentPage === item
                            ? { backgroundColor: "var(--color-primary)" }
                            : {}
                        }
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-border-subtle text-text-tertiary"
                      : "border-border-subtle text-text-secondary hover:bg-surface dark:hover:bg-gray-800"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
