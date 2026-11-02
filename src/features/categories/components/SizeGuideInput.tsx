"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, ConfirmDialog, Field, Input, Textarea } from "@/shared/components/ui";
import type { ISizeGuide } from "../types";

interface SizeGuideInputProps {
  value: ISizeGuide | null;
  onChange: (guide: ISizeGuide | null) => void;
  /** The language tab being edited; column headings and the note are per language. */
  lang: string;
}

const STARTER: ISizeGuide = {
  columns: [{ en: "Size", bn: "সাইজ" }, { en: "Chest (in)", bn: "বুক (ইঞ্চি)" }, { en: "Length (in)", bn: "লম্বা (ইঞ্চি)" }],
  rows: [
    ["S", "", ""],
    ["M", "", ""],
    ["L", "", ""],
    ["XL", "", ""],
  ],
  note: {},
};

/**
 * Size chart editor for a category. First column is the size (S, M, 40…); the rest are
 * measurements. Cells are typed as-is; headings and the note follow the language tab.
 */
export function SizeGuideInput({ value, onChange, lang }: SizeGuideInputProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!value) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          No size chart. Products in this category won&apos;t show a &quot;Size guide&quot; link.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => onChange(structuredClone(STARTER))}
        >
          Add Size Chart
        </Button>
      </div>
    );
  }

  const g = value;
  const setColumn = (c: number, text: string) =>
    onChange({ ...g, columns: g.columns.map((col, i) => (i === c ? { ...col, [lang]: text } : col)) });
  const setCell = (r: number, c: number, text: string) =>
    onChange({
      ...g,
      rows: g.rows.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? text : cell)) : row)),
    });
  const addColumn = () =>
    onChange({ ...g, columns: [...g.columns, {}], rows: g.rows.map((row) => [...row, ""]) });
  const removeColumn = (c: number) =>
    onChange({
      ...g,
      columns: g.columns.filter((_, i) => i !== c),
      rows: g.rows.map((row) => row.filter((_, i) => i !== c)),
    });
  const addRow = () => onChange({ ...g, rows: [...g.rows, g.columns.map(() => "")] });
  const removeRow = (r: number) => onChange({ ...g, rows: g.rows.filter((_, i) => i !== r) });

  return (
    <div className="space-y-4">
      {/* Every cell is the same fixed width so headings, sizes and the per-column
          remove buttons (in the footer row) all line up. Input's own w-full fills it. */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              {g.columns.map((col, c) => (
                <th key={c} scope="col" className="w-32 min-w-32 p-1 align-bottom text-start">
                  <Input
                    aria-label={`Column ${c + 1} heading`}
                    placeholder={c === 0 ? "Size" : "Chest (in)"}
                    value={col[lang] ?? ""}
                    onChange={(e) => setColumn(c, e.target.value)}
                    className="font-medium"
                    maxLength={40}
                  />
                </th>
              ))}
              <th className="w-12 p-1" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {g.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="w-32 min-w-32 p-1">
                    <Input
                      aria-label={`${row[0] || `Row ${r + 1}`}, ${g.columns[c]?.[lang] || `column ${c + 1}`}`}
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      maxLength={40}
                    />
                  </td>
                ))}
                <td className="w-12 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(r)}
                    aria-label={`Remove size ${row[0] || r + 1}`}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {g.columns.length > 1 && (
            <tfoot>
              <tr>
                {g.columns.map((col, c) => (
                  <td key={c} className="p-1 text-center">
                    {c > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColumn(c)}
                        aria-label={`Remove column ${col[lang] || c + 1}`}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addRow}
            disabled={g.rows.length >= 30}
            leftIcon={<Plus size={14} />}
          >
            Add Size
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addColumn}
            disabled={g.columns.length >= 8}
            leftIcon={<Plus size={14} />}
          >
            Add Column
          </Button>
        </div>
        <Button type="button" variant="danger-outline" size="sm" onClick={() => setConfirmRemove(true)}>
          Remove Size Chart
        </Button>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          onChange(null);
          setConfirmRemove(false);
        }}
        title="Remove size chart?"
        description="Products in this category will stop showing a size guide once you save. You can add a new chart later."
        confirmLabel="Remove"
        tone="danger"
      />

      <Field label="Note" hint={`Optional, e.g. how to measure, or "Model is 5'10" wearing M".`}>
        <Textarea
          value={g.note[lang] ?? ""}
          onChange={(e) => onChange({ ...g, note: { ...g.note, [lang]: e.target.value } })}
          rows={2}
        />
      </Field>
    </div>
  );
}
