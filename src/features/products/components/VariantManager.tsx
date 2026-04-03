"use client";

import { useState } from "react";
import type { IVariant } from "../types";

interface VariantManagerProps {
  variants: IVariant[];
  onChange: (variants: IVariant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);
  const [newOption, setNewOption] = useState<Record<number, string>>({});

  // Get all unique variant types
  const variantTypes = variants.map((v) => v.name);

  // Flatten variants into rows for table display
  const rows = variants.flatMap((variant, vidx) =>
    variant.options.map((option, oidx) => ({
      vidx,
      oidx,
      variantName: variant.name,
      value: option.value,
      sku: option.sku,
      stock: option.stock,
      priceModifier: option.priceModifier,
    }))
  );

  const addVariantType = (name: string) => {
    if (!name.trim() || variants.some((v) => v.name === name)) return;
    onChange([...variants, { name: name.trim(), options: [] }]);
  };

  const addOption = (vidx: number, value: string) => {
    if (!value.trim()) return;
    const updated = [...variants];
    updated[vidx].options.push({
      value: value.trim(),
      sku: "",
      stock: 0,
      priceModifier: 0,
    });
    onChange(updated);
    setNewOption((prev) => ({ ...prev, [vidx]: "" }));
  };

  const updateOption = (vidx: number, oidx: number, field: string, val: string) => {
    const updated = [...variants];
    const option = updated[vidx].options[oidx];
    if (field === "stock" || field === "priceModifier") {
      (option as any)[field] = Number(val);
    } else {
      (option as any)[field] = val;
    }
    onChange(updated);
  };

  const deleteOption = (vidx: number, oidx: number) => {
    const updated = [...variants];
    updated[vidx].options.splice(oidx, 1);
    if (updated[vidx].options.length === 0) {
      updated.splice(vidx, 1);
    }
    onChange(updated);
    if (expandedVariant === vidx && updated[vidx]?.options.length === 0) {
      setExpandedVariant(null);
    }
  };

  const deleteVariant = (vidx: number) => {
    onChange(variants.filter((_, i) => i !== vidx));
    if (expandedVariant === vidx) setExpandedVariant(null);
  };

  if (variants.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="mb-3">No variants yet. Add a variant type to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Value</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Stock</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Price Mod</th>
              <th className="px-3 py-2 text-center font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  Add options to variants
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={`${row.vidx}-${row.oidx}`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{row.variantName}</td>
                  <td className="px-3 py-2 text-gray-700">{row.value}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.sku}
                      onChange={(e) => updateOption(row.vidx, row.oidx, "sku", e.target.value)}
                      placeholder="e.g., TSHIRT-RED-M"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      value={row.stock}
                      onChange={(e) => updateOption(row.vidx, row.oidx, "stock", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.priceModifier}
                      onChange={(e) => updateOption(row.vidx, row.oidx, "priceModifier", e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteOption(row.vidx, row.oidx)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Options Section */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <h3 className="font-medium text-gray-900">Add New Option</h3>
        {variants.map((variant, vidx) => (
          <div key={vidx} className="flex gap-2">
            <input
              type="text"
              value={newOption[vidx] || ""}
              onChange={(e) => setNewOption((prev) => ({ ...prev, [vidx]: e.target.value }))}
              onKeyPress={(e) => e.key === "Enter" && addOption(vidx, newOption[vidx] || "")}
              placeholder={`Add ${variant.name} option...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              type="button"
              onClick={() => addOption(vidx, newOption[vidx] || "")}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              + Add {variant.name}
            </button>
            <button
              type="button"
              onClick={() => deleteVariant(vidx)}
              className="px-3 py-2 text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 rounded"
            >
              Delete Type
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
