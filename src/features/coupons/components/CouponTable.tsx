"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Ticket } from "lucide-react";
import type { ICoupon } from "../types";

type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive";

interface Props {
  coupons: ICoupon[];
  storeId: string;
  filterStatus?: string;
}

function getCouponStatus(coupon: ICoupon): CouponStatus {
  if (!coupon.isActive) return "inactive";
  const now = new Date();
  if (now < new Date(coupon.validFrom)) return "scheduled";
  if (now > new Date(coupon.validUntil)) return "expired";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "exhausted";
  return "active";
}

const STATUS_STYLES: Record<CouponStatus, string> = {
  active:    "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  expired:   "bg-red-100 text-red-700",
  exhausted: "bg-orange-100 text-orange-700",
  inactive:  "bg-admin-chip text-admin-text-muted",
};

const STATUS_DOT: Record<CouponStatus, string> = {
  active:    "bg-green-500",
  scheduled: "bg-blue-500",
  expired:   "bg-red-400",
  exhausted: "bg-orange-400",
  inactive:  "bg-gray-400",
};

export function CouponTable({ coupons: initialCoupons, storeId, filterStatus }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(couponId: string, code: string) {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    setDeleting(couponId);
    try {
      const res = await fetch(`/api/coupons/${couponId}?storeId=${storeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c._id !== couponId));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  const filtered = filterStatus && filterStatus !== "all"
    ? coupons.filter((c) => getCouponStatus(c) === filterStatus)
    : coupons;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
        <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7 text-admin-text-subtle" />
        </div>
        <h3 className="text-base font-semibold text-admin-text-primary mb-1">No coupons found</h3>
        <p className="text-sm text-admin-text-muted">
          {filterStatus && filterStatus !== "all"
            ? `No ${filterStatus} coupons.`
            : "Create your first coupon to start offering discounts."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200">
          <thead className="bg-admin-surface-raised border-b border-admin-border-md">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Discount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Usage</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Min Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Valid</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {filtered.map((coupon) => {
              const status = getCouponStatus(coupon);
              const usagePct =
                coupon.usageLimit !== null && coupon.usageLimit > 0
                  ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)
                  : null;

              return (
                <tr key={coupon._id} className="hover:bg-admin-surface-raised/60 transition-colors group">
                  {/* Code + description */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-bold text-admin-text-primary tracking-wider">
                      {coupon.code}
                    </span>
                    {coupon.description && (
                      <p className="text-xs text-admin-text-subtle mt-0.5 max-w-40 truncate">
                        {coupon.description}
                      </p>
                    )}
                  </td>

                  {/* Discount value */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-admin-text-primary">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `৳${coupon.value}`}
                    </span>
                    <p className="text-xs text-admin-text-subtle mt-0.5 capitalize">{coupon.type}</p>
                    {coupon.maxDiscountAmount !== null && coupon.type === "percentage" && (
                      <p className="text-[10px] text-admin-text-subtle">
                        max ৳{coupon.maxDiscountAmount}
                      </p>
                    )}
                  </td>

                  {/* Usage */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-admin-text-secondary">
                      <span className="font-medium">{coupon.usedCount}</span>
                      {coupon.usageLimit !== null && (
                        <span className="text-admin-text-subtle">/ {coupon.usageLimit}</span>
                      )}
                    </div>
                    {usagePct !== null && (
                      <div className="mt-1.5 w-20 h-1.5 bg-admin-chip rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePct >= 100
                              ? "bg-red-400"
                              : usagePct >= 75
                              ? "bg-orange-400"
                              : "bg-green-400"
                          }`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    )}
                    {coupon.perCustomerLimit > 1 && (
                      <p className="text-[10px] text-admin-text-subtle mt-1">
                        {coupon.perCustomerLimit}× per customer
                      </p>
                    )}
                  </td>

                  {/* Min order */}
                  <td className="px-5 py-4 text-sm text-admin-text-secondary">
                    {coupon.minOrderAmount > 0 ? (
                      <span>৳{coupon.minOrderAmount.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Valid date range */}
                  <td className="px-5 py-4 text-xs text-admin-text-muted">
                    <p>
                      {new Date(coupon.validFrom).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-admin-text-subtle">
                      →{" "}
                      {new Date(coupon.validUntil).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                      {status}
                    </span>
                    {coupon.requiresLogin && (
                      <p className="text-[10px] text-purple-600 mt-1 font-medium">Login required</p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/stores/${storeId}/coupons/${coupon._id}`}
                        className="p-1.5 text-admin-text-subtle hover:text-admin-text-secondary hover:bg-admin-chip rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon._id, coupon.code)}
                        disabled={deleting === coupon._id}
                        className="p-1.5 text-admin-text-subtle hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
