"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ICategory, ISizeGuide } from "../types";
import { SizeGuideInput } from "./SizeGuideInput";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Field,
  ImageInput,
  Input,
  LangTabs,
  Textarea,
} from "@/shared/components/ui";

interface CategoryFormProps {
  storeId: string;
  category?: ICategory;
  supportedLanguages?: string[];
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

export function CategoryForm({
  storeId,
  category,
  supportedLanguages = ["en"],
}: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!category;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(supportedLanguages[0] ?? "en");

  const [localizedName, setLocalizedName] = useState<LocalizedString>(
    () => toLocalized(category?.name)
  );
  const [localizedDesc, setLocalizedDesc] = useState<LocalizedString>(
    () => toLocalized(category?.description)
  );

  const [sizeGuide, setSizeGuide] = useState<ISizeGuide | null>(category?.sizeGuide ?? null);

  const [form, setForm] = useState({
    image: category?.image ?? "",
    sortOrder: category?.sortOrder ?? 0,
  });

  const setLocalized = (
    setter: React.Dispatch<React.SetStateAction<LocalizedString>>,
    lang: string,
    value: string
  ) => setter((prev) => ({ ...prev, [lang]: value }));

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      name: localizedName,
      description: localizedDesc,
      // Blank rows (no size in the first cell) are dropped.
      sizeGuide: sizeGuide
        ? { ...sizeGuide, rows: sizeGuide.rows.filter((row) => row[0]?.trim()) }
        : null,
      sortOrder: Number(form.sortOrder),
    };

    try {
      const url = isEdit ? `/api/categories/${category._id}` : `/api/categories`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? payload : { storeId, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      router.push(`/admin/stores/${storeId}/categories`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/categories/${category!._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/admin/stores/${storeId}/categories`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const langLabel = LANG_LABELS[activeLang] ?? activeLang.toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <Alert tone="error">{error}</Alert>}

      <LangTabs
        languages={supportedLanguages}
        active={activeLang}
        onChange={setActiveLang}
      />

      <Card>
        <CardHeader
          title={
            supportedLanguages.length > 1 ? (
              <>
                Category Information
                <span className="ml-2 text-xs font-normal text-gray-400">— {langLabel}</span>
              </>
            ) : (
              "Category Information"
            )
          }
        />
        <div className="space-y-4">
          <Field label="Category Name" required>
            <Input
              value={localizedName[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedName, activeLang, e.target.value)}
              required={activeLang === (supportedLanguages[0] ?? "en")}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={localizedDesc[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedDesc, activeLang, e.target.value)}
              rows={4}
            />
          </Field>
          <ImageInput
            label="Image"
            value={form.image}
            // Category tiles are at most ~450px wide on screen; save the 800px copy
            // the upload made instead of the full (up to 2048px) image. Images under
            // 800px get no such copy and keep their own URL.
            onChange={(url, meta) => set("image", meta?.variants?.w800 ?? url)}
            storeId={storeId}
            folder="categories"
            aspect="16/9"
          />
          <Field label="Sort Order" hint="Lower numbers appear first.">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={
            supportedLanguages.length > 1 ? (
              <>
                Size Chart
                <span className="ml-2 text-xs font-normal text-gray-400">— {langLabel}</span>
              </>
            ) : (
              "Size Chart"
            )
          }
          description="Every product in this category shows this chart in a “Size guide” section, and the chosen size’s measurements under the size buttons. The first column must match the product’s size values (S, M, 40…)."
        />
        <SizeGuideInput value={sizeGuide} onChange={setSizeGuide} lang={activeLang} />
      </Card>

      {/* Actions */}
      {/* Spec: primary + secondary on the left, destructive on the right. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" loading={loading}>
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="danger-outline"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            Delete Category
          </Button>
        )}
      </div>

      {isEdit && (
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Category"
          description="This will permanently delete the category and cannot be undone."
          confirmLabel="Delete"
          tone="danger"
        />
      )}
    </form>
  );
}
