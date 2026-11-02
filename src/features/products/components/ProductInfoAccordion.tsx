"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { t } from "@/shared/lib/i18n";
import type { IProductDetail } from "../types";
import type { ISizeGuide } from "@/features/categories/types";
import { SIZE_GUIDE_ID, SizeGuideTable } from "./SizeGuide";

interface ProductInfoAccordionProps {
  details: IProductDetail[];
  /** Already sanitized on the server. */
  descriptionHtml?: string;
  /** The category's size chart, shown as its own section; the chosen size is marked. */
  sizeGuide?: ISizeGuide | null;
  selectedSize?: string;
}

/**
 * The garment's story, next to the buy button: a "Details" spec list (fabric, fit,
 * care…) open by default, the category's size chart (opened by the "Size guide" link
 * beside the chips), then the long description. Native <details>, so it works without
 * script and is keyboard/screen-reader friendly out of the box.
 */
export function ProductInfoAccordion({
  details,
  descriptionHtml,
  sizeGuide,
  selectedSize,
}: ProductInfoAccordionProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();

  const rows = details
    .map((d) => ({ label: t(d.label, locale), value: t(d.value, locale) }))
    .filter((d) => d.label && d.value);

  if (rows.length === 0 && !descriptionHtml && !sizeGuide) return null;

  return (
    <div className="border-t border-border-subtle">
      {rows.length > 0 && (
        <Section title={tr("details")} defaultOpen>
          <dl className="grid grid-cols-[minmax(6.5rem,auto)_1fr] gap-x-6 gap-y-3 text-sm">
            {rows.map((row, i) => (
              <div key={i} className="contents">
                <dt className="text-text-secondary">{row.label}</dt>
                <dd className="text-[var(--color-text)] leading-relaxed">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {sizeGuide && (
        <Section id={SIZE_GUIDE_ID} title={tr("sizeGuide")}>
          <SizeGuideTable guide={sizeGuide} selected={selectedSize} />
        </Section>
      )}

      {descriptionHtml && (
        <Section title={tr("description")} defaultOpen={rows.length === 0 && !sizeGuide}>
          <div
            className="rte-content text-sm text-[var(--color-text)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </Section>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  defaultOpen,
  children,
}: {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group border-b border-border-subtle scroll-mt-24">
      <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={18}
          aria-hidden
          className="shrink-0 text-text-secondary transition-transform duration-200 ease-(--ease-out-expo) group-open:rotate-180"
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}
