"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import type { IAddress } from "../types";
import { Button, Alert, LocationSelect } from "@/shared/components/ui";

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
  const locale = useLocale();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    label: initialData?.label ?? "",
    street: initialData?.street ?? "",
    city: initialData?.city ?? "",
    division: initialData?.division ?? "",
    district: initialData?.district ?? "",
    upazila: initialData?.upazila ?? "",
    union: initialData?.union ?? "",
    state: initialData?.state ?? "",
    postalCode: initialData?.postalCode ?? "",
    country: initialData?.country ?? "Bangladesh",
    isDefault: initialData?.isDefault ?? false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.street.trim()) errs.street = t("street") + " is required";
    if (!form.division.trim()) errs.division = t("division") + " is required";
    if (!form.district.trim()) errs.district = t("district") + " is required";
    if (!form.upazila.trim()) errs.upazila = t("upazila") + " is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      // backward-compat: city mirrors district
      await onSubmit({ ...form, city: form.district });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  const inputBase =
    "w-full px-3 py-2.5 border rounded-lg text-sm bg-bg text-[var(--color-text)] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors";
  const inputClass = (field: string) =>
    `${inputBase} ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-border-subtle focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
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
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
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

      {/* Location: Division → District → Upazila → Union */}
      <LocationSelect
        value={{
          division: form.division,
          district: form.district,
          upazila: form.upazila,
          union: form.union,
        }}
        onChange={(v) => setForm((f) => ({ ...f, ...v }))}
        locale={locale}
        required={{ division: true, district: true, upazila: true }}
        errors={{
          division: fieldErrors.division,
          district: fieldErrors.district,
          upazila: fieldErrors.upazila,
        }}
        labels={{
          division: t("division"),
          district: t("district"),
          upazila: t("upazila"),
          union: t("union"),
        }}
        placeholders={{
          division: t("selectDivision"),
          district: t("selectDistrict"),
          upazila: t("selectUpazila"),
          union: t("selectUnion"),
        }}
      />

      {/* Postal */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
          {t("postalCode")}
        </label>
        <input
          type="text"
          value={form.postalCode}
          onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
          placeholder={t("postalCode")}
          className={inputClass("postalCode")}
        />
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
          {t("country")}
        </label>
        <select
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          className={`${inputBase} border-border-subtle focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]`}
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
          className="w-4 h-4 rounded border-border-subtle"
          style={{ accentColor: "var(--color-primary)" }}
        />
        <span className="text-sm text-text-secondary">{t("setAsDefault")}</span>
      </label>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="brand"
          loading={saving}
          leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : undefined}
        >
          {submitLabel ?? (initialData ? t("updateAddress") : t("saveAddress"))}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
