"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ICategory } from "../types";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";
import { ImageInput } from "@/shared/components/ui";

interface CategoryFormProps {
  storeId: string;
  category?: ICategory;
  supportedLanguages?: string[];
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

export function CategoryForm({ storeId, category, supportedLanguages = ["en"] }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!category;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeLang, setActiveLang] = useState(supportedLanguages[0] ?? "en");

  // Localized fields
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const url = isEdit
        ? `/api/categories/${category._id}`
        : `/api/categories`;

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
    if (!category || !confirm("Delete this category? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${category._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/admin/stores/${storeId}/categories`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Language Tabs */}
      {supportedLanguages.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeLang === lang
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">
          Category Information
          {supportedLanguages.length > 1 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              — {LANGUAGE_LABELS[activeLang] || activeLang}
            </span>
          )}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">Category Name *</label>
          <input
            type="text"
            value={localizedName[activeLang] ?? ""}
            onChange={(e) => setLocalized(setLocalizedName, activeLang, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            required={activeLang === (supportedLanguages[0] ?? "en")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={localizedDesc[activeLang] ?? ""}
            onChange={(e) => setLocalized(setLocalizedDesc, activeLang, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <ImageInput
          label="Image"
          value={form.image}
          onChange={(url) => set("image", url)}
          storeId={storeId}
          folder="categories"
          aspect="16/9"
        />

        <div>
          <label className="block text-sm font-medium mb-1">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Delete Category
          </button>
        )}
      </div>
    </form>
  );
}
