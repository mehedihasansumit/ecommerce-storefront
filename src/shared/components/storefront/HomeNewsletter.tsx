import { getTranslations } from "next-intl/server";
import type { NewsletterStyle } from "@/features/stores/styles";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Home newsletter in the Store's newsletterStyle Style Switch:
 * - panel: an inset rounded panel inside the page container (base)
 * - band:  one flat field of the newsletter colour, edge to edge (taste-skill, impeccable)
 */
export async function HomeNewsletter({ storeId, newsletterStyle }: { storeId: string; newsletterStyle: NewsletterStyle }) {
  const tr = await getTranslations("home");

  if (newsletterStyle === "band") {
    return (
      <section
        aria-labelledby="newsletter-title"
        className="mt-10 md:mt-20"
        style={{
          backgroundColor: "var(--color-newsletter-bg)",
          color: "var(--color-newsletter-text)",
          ["--focus-ring" as string]: "var(--color-newsletter-text)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-16 md:items-center">
          <div>
            <h2
              id="newsletter-title"
              className="text-3xl md:text-5xl font-medium tracking-[-0.02em] leading-[1.08] max-w-[16ch] text-balance"
              style={{ color: "var(--color-newsletter-text)" }}
            >
              {tr("newsletterTitle")}
            </h2>
            <p className="mt-4 md:mt-6 text-base md:text-lg leading-relaxed max-w-[44ch]">
              {tr("newsletterDesc")}
            </p>
          </div>
          <div className="w-full md:max-w-md md:justify-self-end">
            <NewsletterForm storeId={storeId} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: "var(--color-newsletter-bg)",
            borderRadius: "calc(var(--border-radius) * 2)",
            ["--focus-ring" as string]: "var(--color-newsletter-text)",
          }}
        >
          {/* One quiet accent: an accent-coloured hairline along the top edge */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
            }}
          />

          <div
            className="relative px-6 py-12 sm:px-10 md:px-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16"
            style={{ color: "var(--color-newsletter-text)" }}
          >
            {/* Left: copy */}
            <div className="flex-1 text-center md:text-left">
              <p
                className="inline-flex items-center gap-3 mb-5 text-[11px] sm:text-xs font-medium uppercase tracking-[0.28em]"
                style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 85%, transparent)" }}
              >
                <span
                  aria-hidden
                  className="h-px w-8"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
                {tr("exclusiveOffers")}
              </p>
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4 text-balance"
                style={{ color: "var(--color-newsletter-text)" }}
              >
                {tr("newsletterTitle")}
              </h2>
              <p
                className="text-base md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed"
                style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 80%, transparent)" }}
              >
                {tr("newsletterDesc")}
              </p>
            </div>

            {/* Right: form (sits straight on the panel, no nested card) */}
            <div className="shrink-0 w-full max-w-sm md:w-96">
              <NewsletterForm storeId={storeId} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
