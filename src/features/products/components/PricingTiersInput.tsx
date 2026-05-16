"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/shared/components/ui";
import type { IPricingTier } from "../types";

interface PricingTiersInputProps {
  value: IPricingTier[];
  onChange: (tiers: IPricingTier[]) => void;
}

export function PricingTiersInput({ value, onChange }: PricingTiersInputProps) {
  const update = (idx: number, patch: Partial<IPricingTier>) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const add = () => {
    const maxQty = value.reduce((m, t) => Math.max(m, t.quantity), 0);
    onChange([...value, { quantity: maxQty + 1, totalPrice: 0 }]);
  };

  const sorted = [...value]
    .map((t, originalIdx) => ({ t, originalIdx }))
    .sort((a, b) => a.t.quantity - b.t.quantity);

  const qtyCount = new Map<number, number>();
  for (const { t } of sorted) {
    qtyCount.set(t.quantity, (qtyCount.get(t.quantity) ?? 0) + 1);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-gray-500">
          No bulk pricing tiers. Add one to offer customers a better per-unit price when buying multiples.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium text-gray-500">Quantity</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Total Price (৳)</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Effective Per-Unit</th>
                <th className="px-3 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ t, originalIdx }) => {
                const duplicate = (qtyCount.get(t.quantity) ?? 0) > 1;
                const perUnit =
                  t.quantity > 0 && t.totalPrice > 0
                    ? (t.totalPrice / t.quantity).toFixed(2)
                    : "—";
                return (
                  <tr
                    key={originalIdx}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={t.quantity}
                        onChange={(e) =>
                          update(originalIdx, { quantity: Number(e.target.value) || 0 })
                        }
                        className={`w-24 ${duplicate ? "border-red-500" : ""}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={t.totalPrice}
                        onChange={(e) =>
                          update(originalIdx, { totalPrice: Number(e.target.value) || 0 })
                        }
                        className="w-32"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      ৳{perUnit}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(originalIdx)}
                        aria-label="Remove tier"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Button type="button" variant="secondary" size="sm" onClick={add} leftIcon={<Plus size={14} />}>
        Add Tier
      </Button>

      <p className="text-xs text-gray-500">
        Example: qty 1 → ৳150, qty 2 → ৳250, qty 3 → ৳350. When customer adds more than the highest tier qty, the highest tier&apos;s per-unit rate applies.
      </p>
    </div>
  );
}
