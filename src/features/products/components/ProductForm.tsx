"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Sparkles } from "lucide-react";
import type { IPricingTier, IProduct, IProductOption, IProductVariant, IProductImage } from "../types";
import type { ICategory } from "@/features/categories/types";
import { PricingTiersInput } from "./PricingTiersInput";
import { generateBaseSku, generateVariantSku, dedupeVariantSkus } from "../sku";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Field,
  ImageGalleryInput,
  ImageInput,
  Input,
  LangTabs,
  RichTextEditor,
  Select,
  Textarea,
} from "@/shared/components/ui";

interface ProductFormProps {
  storeId: string;
  categories: ICategory[];
  product?: IProduct;
  supportedLanguages?: string[];
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesian(rest);
  return first.flatMap((val) => restProduct.map((combo) => [val, ...combo]));
}

function getColorOptionName(options: IProductOption[]): string | undefined {
  return options.find((o) => o.name.toLowerCase() === "color")?.name;
}

// Key-order-independent compare: Postgres jsonb does not preserve key order,
// so optionValues reloaded from DB may have reordered keys vs. regenerated combos.
function sameOptionValues(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  return ak.every((k) => a[k] === b[k]);
}

function regenerateVariants(
  newOptions: IProductOption[],
  existing: IProductVariant[],
  colorImages: Record<string, IProductImage[]>,
  basePrice: number
): IProductVariant[] {
  const nonEmpty = newOptions.filter((o) => o.values.length > 0);
  if (nonEmpty.length === 0) return [];

  const colorOptName = getColorOptionName(newOptions);
  const combos = cartesian(nonEmpty.map((o) => o.values));
  return combos.map((combo) => {
    const optionValues: Record<string, string> = {};
    nonEmpty.forEach((opt, i) => {
      optionValues[opt.name] = combo[i];
    });

    const existingMatch = existing.find((v) =>
      sameOptionValues(v.optionValues, optionValues)
    );

    const colorValue = colorOptName ? optionValues[colorOptName] : undefined;
    const images = colorValue
      ? (colorImages[colorValue] ?? existingMatch?.images ?? [])
      : (existingMatch?.images ?? []);

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

export function ProductForm({
  storeId,
  categories,
  product,
  supportedLanguages = ["en"],
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(supportedLanguages[0] ?? "en");

  const [localizedName, setLocalizedName] = useState<LocalizedString>(
    () => toLocalized(product?.name)
  );
  const [localizedShortDesc, setLocalizedShortDesc] = useState<LocalizedString>(
    () => toLocalized(product?.shortDescription)
  );
  const [localizedDesc, setLocalizedDesc] = useState<LocalizedString>(
    () => toLocalized(product?.description)
  );
  const [localizedSeoTitle, setLocalizedSeoTitle] = useState<LocalizedString>(
    () => toLocalized(product?.seo?.title)
  );
  const [localizedSeoDesc, setLocalizedSeoDesc] = useState<LocalizedString>(
    () => toLocalized(product?.seo?.description)
  );

  const [form, setForm] = useState({
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

  const [productImages, setProductImages] = useState<IProductImage[]>(product?.images ?? []);

  const [options, setOptions] = useState<IProductOption[]>(product?.options ?? []);
  const [variants, setVariants] = useState<IProductVariant[]>(product?.variants ?? []);
  const [pricingTiers, setPricingTiers] = useState<IPricingTier[]>(product?.pricingTiers ?? []);

  const [colorImages, setColorImages] = useState<Record<string, IProductImage[]>>(() => {
    const initial: Record<string, IProductImage[]> = {};
    if (product?.variants && product.options) {
      const colorOptName = getColorOptionName(product.options);
      if (colorOptName) {
        product.variants.forEach((v) => {
          const color = v.optionValues?.[colorOptName];
          if (color && v.images.length > 0) {
            initial[color] = v.images;
          }
        });
      }
    }
    return initial;
  });

  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({});

  const setLocalized = (
    setter: React.Dispatch<React.SetStateAction<LocalizedString>>,
    lang: string,
    value: string
  ) => setter((prev) => ({ ...prev, [lang]: value }));

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    setVariants((prev) =>
      regenerateVariants(options, prev, colorImages, Number(form.price) || 0)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, colorImages]);

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

  const colorOption = options.find((o) => o.name.toLowerCase() === "color");

  const setColorGallery = (color: string, images: IProductImage[]) => {
    setColorImages((prev) => ({ ...prev, [color]: images }));
  };

  const updateVariant = (idx: number, field: keyof IProductVariant, value: unknown) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const selectedCategoryName = categories.find((c) => c._id === form.categoryId)?.name;

  const generateBaseSkuHandler = () => {
    const base = generateBaseSku(localizedName, selectedCategoryName);
    set("sku", base);
    setVariants((prev) =>
      dedupeVariantSkus(
        prev.map((v) => ({
          ...v,
          sku: v.sku?.trim() ? v.sku : generateVariantSku(base, v.optionValues),
        })),
      ),
    );
  };

  const generateAllVariantSkus = () => {
    const base = form.sku?.trim() || generateBaseSku(localizedName, selectedCategoryName);
    if (!form.sku?.trim()) set("sku", base);
    setVariants((prev) =>
      dedupeVariantSkus(
        prev.map((v) => ({ ...v, sku: generateVariantSku(base, v.optionValues) })),
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      name: localizedName,
      shortDescription: localizedShortDesc,
      description: localizedDesc,
      seo: {
        title: localizedSeoTitle,
        description: localizedSeoDesc,
      },
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice),
      costPrice: Number(form.costPrice),
      stock: Number(form.stock),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categoryId: form.categoryId || undefined,
      images: productImages,
      options,
      pricingTiers: pricingTiers
        .map((t) => ({ quantity: Number(t.quantity), totalPrice: Number(t.totalPrice) }))
        .filter((t) => t.quantity > 0 && t.totalPrice > 0),
      variants: variants.map((v) => {
        const colorOptName = getColorOptionName(options);
        const colorVal = colorOptName ? v.optionValues?.[colorOptName] : undefined;
        return {
          ...v,
          price: Number(v.price),
          compareAtPrice: Number(v.compareAtPrice ?? 0),
          stock: Number(v.stock),
          images: colorVal
            ? (colorImages[colorVal] ?? v.images ?? [])
            : (v.images ?? []),
        };
      }),
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
    try {
      const res = await fetch(`/api/products/${product!._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push(`/admin/stores/${storeId}/products`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const langLabel = LANG_LABELS[activeLang] ?? activeLang.toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && <Alert tone="error">{error}</Alert>}

      <LangTabs
        languages={supportedLanguages}
        active={activeLang}
        onChange={setActiveLang}
      />

      {/* Basic Info */}
      <Card>
        <CardHeader
          title={
            supportedLanguages.length > 1 ? (
              <>
                Basic Information
                <span className="ml-2 text-xs font-normal text-gray-400">— {langLabel}</span>
              </>
            ) : (
              "Basic Information"
            )
          }
        />
        <div className="space-y-4">
          <Field label="Product Name" required>
            <Input
              value={localizedName[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedName, activeLang, e.target.value)}
              required={activeLang === (supportedLanguages[0] ?? "en")}
            />
          </Field>
          <Field label="Short Description">
            <Input
              value={localizedShortDesc[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedShortDesc, activeLang, e.target.value)}
            />
          </Field>
          <Field label="Description" hint="Use the toolbar to format — headings, lists, bold, links.">
            <RichTextEditor
              value={localizedDesc[activeLang] ?? ""}
              onChange={(html) => setLocalized(setLocalizedDesc, activeLang, html)}
            />
          </Field>
        </div>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader title="Pricing" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Price" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </Field>
          <Field label="Compare At Price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
            />
          </Field>
          <Field label="Cost Price">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Bulk Pricing */}
      <Card>
        <CardHeader
          title="Bulk Pricing"
          description="Offer better total prices when buying multiples (e.g., 1 = ৳150, 2 = ৳250, 3 = ৳350). Tiers count across all variants of this product."
        />
        <PricingTiersInput value={pricingTiers} onChange={setPricingTiers} />
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader title="Inventory" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SKU" hint="Leave empty to auto-generate on save.">
            <div className="flex gap-2">
              <Input
                type="text"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={generateBaseSkuHandler}
                leftIcon={<Sparkles size={14} />}
              >
                Generate
              </Button>
            </div>
          </Field>
          <Field label="Base Stock">
            <Input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader
          title={
            supportedLanguages.length > 1 ? (
              <>
                SEO
                <span className="ml-2 text-xs font-normal text-gray-400">— {langLabel}</span>
              </>
            ) : (
              "SEO"
            )
          }
        />
        <div className="space-y-4">
          <Field label="Meta Title">
            <Input
              value={localizedSeoTitle[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedSeoTitle, activeLang, e.target.value)}
            />
          </Field>
          <Field label="Meta Description">
            <Textarea
              value={localizedSeoDesc[activeLang] ?? ""}
              onChange={(e) => setLocalized(setLocalizedSeoDesc, activeLang, e.target.value)}
              rows={2}
            />
          </Field>
        </div>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader title="Organization" />
        <div className="space-y-4">
          <Field label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {typeof cat.name === "string"
                    ? cat.name
                    : (cat.name.en ?? Object.values(cat.name)[0])}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tags" hint="Comma-separated values">
            <Input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="casual, summer, sale"
            />
          </Field>
          <ImageInput
            label="Thumbnail"
            value={form.thumbnail}
            onChange={(url) => set("thumbnail", url)}
            storeId={storeId}
            folder="products"
            aspect="square"
            hint="Main image shown in product listings."
          />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Featured
            </label>
          </div>
        </div>
      </Card>

      {/* Product Images — shown only when no variant combinations */}
      {variants.length === 0 && (
        <Card>
          <CardHeader
            title="Product Images"
            description="Gallery images shown on the product detail page."
          />
          <ImageGalleryInput
            value={productImages}
            onChange={setProductImages}
            storeId={storeId}
            folder="products"
            defaultAlt={typeof localizedName.en === "string" ? localizedName.en : ""}
          />
        </Card>
      )}

      {/* Product Options */}
      <Card>
        <CardHeader
          title="Product Options"
          description="Define variant dimensions like Color and Size. Combinations are auto-generated below."
        />
        <div className="space-y-4">
          {options.map((opt, optIdx) => (
            <div
              key={optIdx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{opt.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(optIdx)}
                  aria-label={`Remove ${opt.name} option`}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {opt.values.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValueFromOption(optIdx, valIdx)}
                      aria-label={`Remove ${val}`}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
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
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addValueToOption(optIdx)}
                  aria-label="Add value"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Input
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
              placeholder="Option name (e.g., Color, Size, Material)..."
            />
            <Button variant="primary" size="sm" onClick={addOption}>
              + Add Option
            </Button>
          </div>
        </div>
      </Card>

      {/* Color Images */}
      {colorOption && colorOption.values.length > 0 && (
        <Card>
          <CardHeader
            title="Color Images"
            description="Add images per color. These show in the gallery when that color is selected."
          />
          <div className="space-y-4">
            {colorOption.values.map((color) => (
              <div
                key={color}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                <h3 className="font-medium text-sm">{color}</h3>
                <ImageGalleryInput
                  value={(colorImages[color] ?? []).map((img) => ({
                    ...img,
                    alt: img.alt || color,
                  }))}
                  onChange={(images) => setColorGallery(color, images)}
                  storeId={storeId}
                  folder="products"
                  defaultAlt={color}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Variants Table */}
      {variants.length > 0 && (
        <Card>
          <CardHeader
            title="Variant Combinations"
            description="Auto-generated from your options. Set price, stock, and SKU per combination."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={generateAllVariantSkus}
                leftIcon={<Sparkles size={14} />}
              >
                Generate SKUs
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {options.map((opt) => (
                    <th
                      key={opt.name}
                      className="px-3 py-2 text-left font-medium text-gray-500"
                    >
                      {opt.name}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Price</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Stock</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">SKU</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {options.map((opt) => (
                      <td key={opt.name} className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                        {variant.optionValues[opt.name]}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                        className="w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                        className="w-20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-32"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
              Delete Product
            </Button>
          )}
        </div>

        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? "Save Changes" : "Create Product"}
        </Button>
      </div>

      {isEdit && (
        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Product"
          description="This will permanently delete the product and cannot be undone."
          confirmLabel="Delete"
          tone="danger"
        />
      )}
    </form>
  );
}
