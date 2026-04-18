"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { IAddress } from "../types";

interface AddressFormProps {
  initialData?: IAddress;
  onSubmit: (data: Omit<IAddress, "_id">) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: AddressFormProps) {
  const t = useTranslations("addresses");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    label: initialData?.label ?? "",
    street: initialData?.street ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    postalCode: initialData?.postalCode ?? "",
    country: initialData?.country ?? "Bangladesh",
    isDefault: initialData?.isDefault ?? false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.street.trim()) errs.street = t("street") + " is required";
    if (!form.city.trim()) errs.city = t("city") + " is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-admin-border focus:ring-primary/20 focus:border-primary"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-admin-text-secondary mb-1">
          {t("label")}
        </label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder={t("labelPlaceholder")}
          className={inputClass("label")}
        />
      </div>

      {/* Street */}
      <div>
        <label className="block text-sm font-medium text-admin-text-secondary mb-1">
          {t("street")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.street}
          onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
          placeholder={t("street")}
          className={inputClass("street")}
        />
        {fieldErrors.street && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.street}</p>
        )}
      </div>

      {/* City + Postal */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            {t("city")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder={t("city")}
            className={inputClass("city")}
          />
          {fieldErrors.city && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-admin-text-secondary mb-1">
            {t("postalCode")}
          </label>
          <input
            type="text"
            value={form.postalCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, postalCode: e.target.value }))
            }
            placeholder={t("postalCode")}
            className={inputClass("postalCode")}
          />
        </div>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-admin-text-secondary mb-1">
          {t("state")}
        </label>
        <input
          type="text"
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          placeholder={t("state")}
          className={inputClass("state")}
        />
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-admin-text-secondary mb-1">
          {t("country")}
        </label>
        <select
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-admin-surface"
        >
          <option>Bangladesh</option>
          <option>India</option>
          <option>Pakistan</option>
          <option>Other</option>
        </select>
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm((f) => ({ ...f, isDefault: e.target.checked }))
          }
          className="w-4 h-4 rounded border-admin-border-md"
          style={{ accentColor: "var(--color-primary)" }}
        />
        <span className="text-sm text-admin-text-secondary">{t("setAsDefault")}</span>
      </label>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-white text-sm font-medium transition-all hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {saving
            ? "..."
            : submitLabel ||
              (initialData ? t("updateAddress") : t("saveAddress"))}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-admin-text-secondary border border-admin-border rounded-lg hover:bg-admin-surface-hover transition-colors"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
