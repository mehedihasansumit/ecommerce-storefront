"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ICoupon, CouponType } from "../types";

interface CouponFormProps {
  storeId: string;
  coupon?: ICoupon;
}

export function CouponForm({ storeId, coupon }: CouponFormProps) {
  const router = useRouter();
  const isEdit = !!coupon;

  const [form, setForm] = useState({
    code: coupon?.code ?? "",
    description: coupon?.description ?? "",
    type: coupon?.type ?? "percentage",
    value: coupon?.value ?? 0,
    minOrderAmount: coupon?.minOrderAmount ?? 0,
    maxDiscountAmount: coupon?.maxDiscountAmount ?? "",
    validFrom: coupon ? new Date(coupon.validFrom).toISOString().slice(0, 16) : "",
    validUntil: coupon ? new Date(coupon.validUntil).toISOString().slice(0, 16) : "",
    usageLimit: coupon?.usageLimit ?? "",
    perCustomerLimit: coupon?.perCustomerLimit ?? 1,
    requiresLogin: coupon?.requiresLogin ?? false,
    isActive: coupon?.isActive ?? true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      storeId,
      code: form.code,
      description: form.description,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: Number(form.perCustomerLimit),
      requiresLogin: form.requiresLogin,
      isActive: form.isActive,
    };

    try {
      const url = isEdit
        ? `/api/coupons/${coupon._id}`
        : "/api/coupons";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save coupon");
        return;
      }

      router.push(`/admin/stores/${storeId}/coupons`);
      router.refresh();
    } catch {
      setError("Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-admin-border-md rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-admin-text-secondary mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            Coupon Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. SUMMER20"
            className={`${inputClass} uppercase`}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Internal note about this coupon"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            Discount Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}
            className={inputClass}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (৳)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Discount Value <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value as unknown as number }))}
            min={0}
            max={form.type === "percentage" ? 100 : undefined}
            step="any"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Minimum Order Amount</label>
          <input
            type="number"
            value={form.minOrderAmount}
            onChange={(e) =>
              setForm((f) => ({ ...f, minOrderAmount: e.target.value as unknown as number }))
            }
            min={0}
            step="any"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Max Discount Amount{" "}
            <span className="text-admin-text-subtle font-normal">(for % coupons)</span>
          </label>
          <input
            type="number"
            value={form.maxDiscountAmount}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))
            }
            min={0}
            step="any"
            placeholder="No limit"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            Valid From <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.validFrom}
            onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            Valid Until <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            Total Usage Limit{" "}
            <span className="text-admin-text-subtle font-normal">(leave empty for unlimited)</span>
          </label>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
            min={1}
            placeholder="Unlimited"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Per Customer Limit</label>
          <input
            type="number"
            value={form.perCustomerLimit}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                perCustomerLimit: e.target.value as unknown as number,
              }))
            }
            min={1}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-lg border border-admin-border bg-admin-surface-raised">
          <input
            type="checkbox"
            id="requiresLogin"
            checked={form.requiresLogin}
            onChange={(e) => setForm((f) => ({ ...f, requiresLogin: e.target.checked }))}
            className="w-4 h-4 mt-0.5 rounded border-admin-border-md"
          />
          <div>
            <label htmlFor="requiresLogin" className="text-sm font-medium text-admin-text-secondary cursor-pointer">
              Requires login to use
            </label>
            <p className="text-xs text-admin-text-muted mt-0.5">
              When enabled, only logged-in customers can apply this coupon. Guest checkouts will be rejected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-admin-border-md"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-admin-text-secondary">
            Active
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Coupon" : "Create Coupon"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-admin-surface text-admin-text-secondary text-sm font-medium rounded-lg border border-admin-border-md hover:bg-admin-surface-hover"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
