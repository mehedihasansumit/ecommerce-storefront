"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import type { IProduct, IProductOption, IProductVariant, IProductImage } from "../types";
import type { ICategory } from "@/features/categories/types";

interface ProductFormProps {
  storeId: string;
  categories: ICategory[];
  product?: IProduct;
}

// Cartesian product helper
function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesian(rest);
  return first.flatMap((val) => restProduct.map((combo) => [val, ...combo]));
}

function regenerateVariants(
  newOptions: IProductOption[],
  existing: IProductVariant[],
  colorImages: Record<string, IProductImage[]>,
  basePrice: number
): IProductVariant[] {
  const nonEmpty = newOptions.filter((o) => o.values.length > 0);
  if (nonEmpty.length === 0) return [];

  const combos = cartesian(nonEmpty.map((o) => o.values));
  return combos.map((combo) => {
    const optionValues: Record<string, string> = {};
    nonEmpty.forEach((opt, i) => {
      optionValues[opt.name] = combo[i];
    });

    const key = JSON.stringify(optionValues);
    const existingMatch = existing.find(
      (v) => JSON.stringify(v.optionValues) === key
    );

    const colorValue = optionValues["Color"];
    const images = colorValue ? (colorImages[colorValue] ?? existingMatch?.images ?? []) : (existingMatch?.images ?? []);

    return {
      _id: existingMatch?._id,
      optionValues,
      price: existingMatch?.price ?? basePrice,
      compareAtPrice: existingMatch?.compareAtPrice ?? 0,
      stock: existingMatch?.stock ?? 0,
      sku: existingMatch?.sku ?? "",
      images,
    };
  });
}

export function ProductForm({ storeId, categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: product?.name ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    compareAtPrice: product?.compareAtPrice ?? 0,
    costPrice: product?.costPrice ?? 0,
    sku: product?.sku ?? "",
    stock: product?.stock ?? 0,
    categoryId: product?.categoryId ?? "",
    thumbnail: product?.thumbnail ?? "",
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    tags: product?.tags.join(", ") ?? "",
  });

  const [options, setOptions] = useState<IProductOption[]>(product?.options ?? []);
  const [variants, setVariants] = useState<IProductVariant[]>(product?.variants ?? []);

  // colorImages: { Red: [{url, alt}, ...], Blue: [...] }
  const [colorImages, setColorImages] = useState<Record<string, IProductImage[]>>(() => {
    const initial: Record<string, IProductImage[]> = {};
    if (product?.variants) {
      product.variants.forEach((v) => {
        const color = v.optionValues["Color"];
        if (color && v.images.length > 0) {
          initial[color] = v.images;
        }
      });
    }
    return initial;
  });

  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({});
  const [newImageUrls, setNewImageUrls] = useState<Record<string, string>>({});

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Re-generate variants whenever options or colorImages change
  useEffect(() => {
    setVariants((prev) =>
      regenerateVariants(options, prev, colorImages, Number(form.price) || 0)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, colorImages]);

  // --- Options management ---
  const addOption = () => {
    if (!newOptionName.trim()) return;
    if (options.some((o) => o.name === newOptionName.trim())) {
      setError("Option type already exists");
      return;
    }
    setOptions([...options, { name: newOptionName.trim(), values: [] }]);
    setNewOptionName("");
    setError("");
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const addValueToOption = (idx: number) => {
    const val = (newOptionValues[idx] ?? "").trim();
    if (!val) return;
    if (options[idx].values.includes(val)) return;
    const updated = [...options];
    updated[idx] = { ...updated[idx], values: [...updated[idx].values, val] };
    setOptions(updated);
    setNewOptionValues((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeValueFromOption = (optIdx: number, valIdx: number) => {
    const updated = [...options];
    updated[optIdx] = {
      ...updated[optIdx],
      values: updated[optIdx].values.filter((_, i) => i !== valIdx),
    };
    setOptions(updated);
  };

  // --- Color images management ---
  const colorOption = options.find((o) => o.name.toLowerCase() === "color");

  const addColorImage = (color: string) => {
    const url = (newImageUrls[color] ?? "").trim();
    if (!url) return;
    setColorImages((prev) => ({
      ...prev,
      [color]: [...(prev[color] ?? []), { url, alt: color }],
    }));
    setNewImageUrls((prev) => ({ ...prev, [color]: "" }));
  };

  const removeColorImage = (color: string, imgIdx: number) => {
    setColorImages((prev) => ({
      ...prev,
      [color]: (prev[color] ?? []).filter((_, i) => i !== imgIdx),
    }));
  };

  // --- Variants table editing ---
  const updateVariant = (idx: number, field: keyof IProductVariant, value: unknown) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // --- Form submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice),
      costPrice: Number(form.costPrice),
      stock: Number(form.stock),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categoryId: form.categoryId || undefined,
      options,
      variants: variants.map((v) => ({
        ...v,
        price: Number(v.price),
        compareAtPrice: Number(v.compareAtPrice ?? 0),
        stock: Number(v.stock),
      })),
    };

    try {
      const url = isEdit ? `/api/products/${product._id}` : `/api/products`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? payload : { storeId, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      router.push(`/admin/stores/${storeId}/products`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm("Delete this product? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/admin/stores/${storeId}/products`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Product Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Compare At Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cost Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Inventory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Organization</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="casual, summer, sale"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
          <input
            type="text"
            value={form.thumbnail}
            onChange={(e) => set("thumbnail", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="w-4 h-4"
            />
            Featured
          </label>
        </div>
      </div>

      {/* Options (variant axes) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Product Options</h2>
          <p className="text-xs text-gray-500">Define variant dimensions like Color and Size. Variant combinations are auto-generated below.</p>
        </div>

        {options.map((opt, optIdx) => (
          <div key={optIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-900">{opt.name}</span>
              <button
                type="button"
                onClick={() => removeOption(optIdx)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Values */}
            <div className="flex flex-wrap gap-2">
              {opt.values.map((val, valIdx) => (
                <span
                  key={valIdx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeValueFromOption(optIdx, valIdx)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add value input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionValues[optIdx] ?? ""}
                onChange={(e) =>
                  setNewOptionValues((prev) => ({ ...prev, [optIdx]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValueToOption(optIdx);
                  }
                }}
                placeholder={`Add ${opt.name} value...`}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => addValueToOption(optIdx)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Add option type */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
            placeholder="Option name (e.g., Color, Size, Material)..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <button
            type="button"
            onClick={addOption}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            + Add Option
          </button>
        </div>
      </div>

      {/* Color Images (shown only when Color option exists) */}
      {colorOption && colorOption.values.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Color Images</h2>
            <p className="text-xs text-gray-500">Add images per color. These will show in the gallery when that color is selected.</p>
          </div>

          {colorOption.values.map((color) => (
            <div key={color} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm text-gray-900">{color}</h3>

              {/* Existing images */}
              {(colorImages[color] ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(colorImages[color] ?? []).map((img, imgIdx) => (
                    <div key={imgIdx} className="relative group w-20 h-20">
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-cover rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeColorImage(color, imgIdx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add image URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrls[color] ?? ""}
                  onChange={(e) =>
                    setNewImageUrls((prev) => ({ ...prev, [color]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColorImage(color);
                    }
                  }}
                  placeholder="Image URL..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => addColorImage(color)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Variant Combinations</h2>
            <p className="text-xs text-gray-500">Auto-generated from your options. Set price, stock, and SKU per combination.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {options.map((opt) => (
                    <th key={opt.name} className="px-3 py-2 text-left font-medium text-gray-700">
                      {opt.name}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Price</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Stock</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    {options.map((opt) => (
                      <td key={opt.name} className="px-3 py-2 text-gray-700 font-medium">
                        {variant.optionValues[opt.name]}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
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
            Delete Product
          </button>
        )}
      </div>
    </form>
  );
}
