"use client";

import { Ruler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { t } from "@/shared/lib/i18n";
import type { ISizeGuide } from "@/features/categories/types";

/** Anchor of the "Size guide" accordion section; the link beside the chips opens it. */
export const SIZE_GUIDE_ID = "size-guide";

/** Option names that mean "size" in the stores' languages. */
const SIZE_OPTION = /size|সাইজ|মাপ/i;
export const isSizeOption = (name: string) => SIZE_OPTION.test(name);

const norm = (s: string) => s.trim().toLowerCase();

/** The chart row for one size value (first column matches the chip), or null. */
function rowFor(guide: ISizeGuide, size: string | undefined): string[] | null {
  if (!size) return null;
  return guide.rows.find((r) => norm(r[0] ?? "") === norm(size)) ?? null;
}

/**
 * One quiet line under the size chips with the chosen size's measurements, e.g.
 * "Chest (in) 40 · Length (in) 29". Answers "will it fit?" without opening anything.
 */
export function SizeMeasurements({ guide, size }: { guide: ISizeGuide; size?: string }) {
  const locale = useLocale();
  const row = rowFor(guide, size);
  const parts = row
    ? guide.columns
        .slice(1)
        .map((col, i) => ({ label: t(col, locale), value: row[i + 1] ?? "" }))
        .filter((p) => p.label && p.value)
    : [];

  return (
    // Always mounted so the live region announces the change when a size is picked.
    <p
      aria-live="polite"
      className="mt-3 flex min-h-5 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-text-secondary tabular-nums"
    >
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-baseline gap-x-2 whitespace-nowrap">
          {i > 0 && (
            <span className="text-text-tertiary">
              <span aria-hidden>·</span>
              <span className="sr-only">, </span>
            </span>
          )}
          <span>
            {p.label} <span className="font-medium text-[var(--color-text)]">{p.value}</span>
          </span>
        </span>
      ))}
    </p>
  );
}

/**
 * "Size guide" beside the Size label. Opens the accordion section and scrolls to it;
 * without script it is still a plain in-page link.
 */
export function SizeGuideLink() {
  const tr = useTranslations("productDetail");

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const section = document.getElementById(SIZE_GUIDE_ID);
    if (!(section instanceof HTMLDetailsElement)) return;
    e.preventDefault();
    section.open = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    section.querySelector("summary")?.focus({ preventScroll: true });
  };

  return (
    <a
      href={`#${SIZE_GUIDE_ID}`}
      onClick={open}
      className="focus-ring inline-flex min-h-10 items-center gap-1.5 text-sm text-[var(--color-text)] underline underline-offset-4 decoration-[color-mix(in_srgb,var(--color-text)_35%,transparent)] hover:decoration-[var(--color-text)] transition-colors"
    >
      <Ruler size={16} aria-hidden />
      {tr("sizeGuide")}
    </a>
  );
}

/** The full chart; the chosen size's row is marked so it is found at a glance. */
export function SizeGuideTable({ guide, selected }: { guide: ISizeGuide; selected?: string }) {
  const locale = useLocale();
  const note = t(guide.note, locale);
  const selectedRow = rowFor(guide, selected);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border-subtle">
              {guide.columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className="py-2.5 pe-4 text-start font-medium text-text-secondary whitespace-nowrap"
                >
                  {t(col, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, r) => {
              const isSelected = row === selectedRow;
              return (
                <tr
                  key={r}
                  aria-current={isSelected ? "true" : undefined}
                  className="border-b border-border-subtle last:border-0"
                  style={
                    isSelected
                      ? { backgroundColor: "color-mix(in srgb, var(--color-text) 5%, transparent)" }
                      : undefined
                  }
                >
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row" className="py-2.5 ps-2 pe-4 text-start font-medium">
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={c}
                        className={`py-2.5 pe-4 ${
                          isSelected ? "text-[var(--color-text)] font-medium" : "text-text-secondary"
                        }`}
                      >
                        {cell}
                      </td>
                    )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-4 text-sm text-text-secondary leading-relaxed">{note}</p>}
    </div>
  );
}
