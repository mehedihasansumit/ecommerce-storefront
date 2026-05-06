"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ICategory } from "../types";
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
            onChange={(url) => set("image", url)}
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

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
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

        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? "Save Changes" : "Create Category"}
        </Button>
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
