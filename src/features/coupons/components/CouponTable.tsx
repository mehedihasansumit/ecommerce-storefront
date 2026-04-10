"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";
import type { ICoupon } from "../types";

interface CouponTableProps {
  coupons: ICoupon[];
  storeId: string;
}

export function CouponTable({ coupons: initialCoupons, storeId }: CouponTableProps) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(couponId: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    setDeleting(couponId);
    try {
      const res = await fetch(`/api/coupons/${couponId}?storeId=${storeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c._id !== couponId));
      }
    } finally {
      setDeleting(null);
    }
  }

  function getStatus(coupon: ICoupon) {
    if (!coupon.isActive) return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
    const now = new Date();
    if (now < new Date(coupon.validFrom)) return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
    if (now > new Date(coupon.validUntil)) return { label: "Expired", color: "bg-red-100 text-red-700" };
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      return { label: "Exhausted", color: "bg-orange-100 text-orange-700" };
    return { label: "Active", color: "bg-green-100 text-green-700" };
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No coupons yet. Create your first coupon to start offering discounts.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium">Code</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Value</th>
            <th className="pb-3 font-medium">Usage</th>
            <th className="pb-3 font-medium">Valid Until</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Access</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {coupons.map((coupon) => {
            const status = getStatus(coupon);
            return (
              <tr key={coupon._id} className="hover:bg-gray-50">
                <td className="py-3 font-mono font-semibold">{coupon.code}</td>
                <td className="py-3 capitalize">{coupon.type}</td>
                <td className="py-3">
                  {coupon.type === "percentage"
                    ? `${coupon.value}%`
                    : `৳${coupon.value}`}
                </td>
                <td className="py-3">
                  {coupon.usedCount}
                  {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
                </td>
                <td className="py-3 text-gray-500">
                  {new Date(coupon.validUntil).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    coupon.requiresLogin
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {coupon.requiresLogin ? "Login required" : "Anyone"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/stores/${storeId}/coupons/${coupon._id}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      disabled={deleting === coupon._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
