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
  inactive:  "bg-gray-100 text-gray-500",
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
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No coupons found</h3>
        <p className="text-sm text-gray-500">
          {filterStatus && filterStatus !== "all"
            ? `No ${filterStatus} coupons.`
            : "Create your first coupon to start offering discounts."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valid</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((coupon) => {
              const status = getCouponStatus(coupon);
              const usagePct =
                coupon.usageLimit !== null && coupon.usageLimit > 0
                  ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)
                  : null;

              return (
                <tr key={coupon._id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Code + description */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-bold text-gray-900 tracking-wider">
                      {coupon.code}
                    </span>
                    {coupon.description && (
                      <p className="text-xs text-gray-400 mt-0.5 max-w-40 truncate">
                        {coupon.description}
                      </p>
                    )}
                  </td>

                  {/* Discount value */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `৳${coupon.value}`}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{coupon.type}</p>
                    {coupon.maxDiscountAmount !== null && coupon.type === "percentage" && (
                      <p className="text-[10px] text-gray-400">
                        max ৳{coupon.maxDiscountAmount}
                      </p>
                    )}
                  </td>

                  {/* Usage */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <span className="font-medium">{coupon.usedCount}</span>
                      {coupon.usageLimit !== null && (
                        <span className="text-gray-400">/ {coupon.usageLimit}</span>
                      )}
                    </div>
                    {usagePct !== null && (
                      <div className="mt-1.5 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                      <p className="text-[10px] text-gray-400 mt-1">
                        {coupon.perCustomerLimit}× per customer
                      </p>
                    )}
                  </td>

                  {/* Min order */}
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {coupon.minOrderAmount > 0 ? (
                      <span>৳{coupon.minOrderAmount.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Valid date range */}
                  <td className="px-5 py-4 text-xs text-gray-500">
                    <p>
                      {new Date(coupon.validFrom).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-gray-400">
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
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon._id, coupon.code)}
                        disabled={deleting === coupon._id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
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
