"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/shared/components/ui";
import type { IProductDetail } from "../types";

interface ProductDetailsInputProps {
  value: IProductDetail[];
  onChange: (details: IProductDetail[]) => void;
  /** The language tab being edited; label and value are stored per language. */
  lang: string;
}

/** Quick-add labels, filled in both languages so a row added on either tab reads right on both. */
const SUGGESTED_LABELS: { en: string; bn: string }[] = [
  { en: "Fabric", bn: "কাপড়" },
  { en: "Fit", bn: "ফিট" },
  { en: "Care", bn: "যত্ন" },
  { en: "Origin", bn: "তৈরি" },
];

let nextKey = 0;
const newKey = () => `detail-${nextKey++}`;

/**
 * Label/value rows shown as "Details" on the product page, e.g. Fabric → 100% cotton.
 * Free-form so each store can use its own labels (a shoe store: Upper, Sole…).
 */
export function ProductDetailsInput({ value, onChange, lang }: ProductDetailsInputProps) {
  // Stable React keys that travel with each row through move/remove, so focus follows
  // the row a keyboard user just moved instead of staying at the old position.
  const [keys, setKeys] = useState<string[]>(() => value.map(newKey));
  // Rows only change through the handlers below; if the parent ever resets the list,
  // fall back to positional keys rather than mismatched ones.
  const keyFor = (idx: number) => (keys.length === value.length ? keys[idx] : `row-${idx}`);

  const update = (idx: number, field: keyof IProductDetail, text: string) => {
    const next = [...value];
    next[idx] = { ...next[idx], [field]: { ...next[idx][field], [lang]: text } };
    onChange(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    [next[idx], next[to]] = [next[to], next[idx]];
    setKeys((k) => {
      const n = [...k];
      [n[idx], n[to]] = [n[to], n[idx]];
      return n;
    });
    onChange(next);
  };

  const remove = (idx: number) => {
    setKeys((k) => k.filter((_, i) => i !== idx));
    onChange(value.filter((_, i) => i !== idx));
  };

  const add = (label?: { en: string; bn: string }) => {
    setKeys((k) => [...k, newKey()]);
    onChange([...value, { label: label ? { ...label } : {}, value: {} }]);
  };

  // A suggestion is "used" if any language of any row already has that label.
  const used = new Set(
    value.flatMap((d) => Object.values(d.label).map((s) => s.trim().toLowerCase()))
  );
  const suggestions = SUGGESTED_LABELS.filter(
    (l) => !used.has(l.en.toLowerCase()) && !used.has(l.bn.toLowerCase())
  );
  const rowName = (row: IProductDetail, idx: number) =>
    row.label[lang] || row.label.en || Object.values(row.label)[0] || `detail ${idx + 1}`;

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          No details yet. Shoppers look for fabric, fit and care before they buy — add a row for each.
        </p>
      )}

      {value.map((row, idx) => (
        <div key={keyFor(idx)} className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            aria-label={`Detail ${idx + 1} label`}
            placeholder="Label, e.g. Fabric"
            value={row.label[lang] ?? ""}
            onChange={(e) => update(idx, "label", e.target.value)}
            className="sm:w-44"
            maxLength={60}
          />
          <Input
            aria-label={`Detail ${idx + 1} value`}
            placeholder="Value, e.g. 100% Egyptian cotton"
            value={row.value[lang] ?? ""}
            onChange={(e) => update(idx, "value", e.target.value)}
            className="flex-1"
            maxLength={300}
          />
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              aria-label={`Move ${rowName(row, idx)} up`}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, 1)}
              disabled={idx === value.length - 1}
              aria-label={`Move ${rowName(row, idx)} down`}
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              aria-label={`Remove ${rowName(row, idx)}`}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => add()}
          leftIcon={<Plus size={14} />}
          disabled={value.length >= 20}
        >
          Add Detail
        </Button>
        {suggestions.map((label) => (
          <Button
            key={label.en}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => add(label)}
            disabled={value.length >= 20}
          >
            + {lang === "bn" ? label.bn : label.en}
          </Button>
        ))}
      </div>
    </div>
  );
}
