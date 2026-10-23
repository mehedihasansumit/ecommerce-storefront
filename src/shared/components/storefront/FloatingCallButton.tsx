"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";

export function FloatingCallButton() {
  const tenant = useTenant();
  const t = useTranslations("header");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The footer lists the same numbers; step aside while it's on screen so the
  // button never covers footer content (it sat over the contact column on desktop).
  const [footerInView, setFooterInView] = useState(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);

  const phones: string[] = [
    ...(tenant?.contact?.phones?.filter(Boolean) ?? []),
    ...(tenant?.contact?.phone ? [tenant.contact.phone] : []),
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  if (phones.length === 0) return null;

  // Hidden on product detail pages — the mobile sticky buy bar occupies the same
  // bottom-right area, and call/WhatsApp is reachable via the variant sheet there.
  const isProductDetail =
    pathname.startsWith("/products/") && pathname !== "/products";
  // Also hidden in the purchase funnel: on phones it sat over the Checkout /
  // Place order button; the footer still lists the numbers.
  const isFunnel = pathname === "/cart" || pathname.startsWith("/checkout");
  if (isProductDetail || isFunnel) return null;

  const single = phones.length === 1;
  const hidden = footerInView && !open;

  const buttonClass = `focus-ring fixed right-4 z-40 flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-[box-shadow,transform,opacity] duration-200 ease-(--ease-out-expo) select-none md:bottom-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] ${
    hidden ? "opacity-0 translate-y-3 pointer-events-none" : ""
  }`;
  const hiddenProps = hidden ? { "aria-hidden": true, tabIndex: -1 } : {};
  const buttonStyle = {
    backgroundColor: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
    // on-primary = white or ink, whichever reads (header-text on gold was 1.75:1 in dark)
    color: "var(--color-on-primary, #fff)",
    padding: "0.75rem 1rem",
  };

  if (single) {
    return (
      <a
        href={`tel:${phones[0]}`}
        className={buttonClass}
        style={buttonStyle}
        aria-label={t("callNumber", { phone: phones[0] })}
        {...hiddenProps}
      >
        <Phone size={18} aria-hidden className="shrink-0" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">{phones[0]}</span>
      </a>
    );
  }

  return (
    <>
      {/* Number list popup */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-39"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed right-4 z-40 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up md:bottom-20 bottom-34"
            style={{
              backgroundColor: "var(--color-card-bg)",
              border: "1px solid var(--color-border-subtle)",
              minWidth: "200px",
            }}
          >
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-link)" }}>
                {t("callUs")}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="focus-ring -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface transition-colors"
                style={{ color: "var(--color-text)" }}
                aria-label={t("close")}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            {phones.map((ph) => (
              <a
                key={ph}
                href={`tel:${ph}`}
                className="focus-ring flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
                style={{ color: "var(--color-text)" }}
                onClick={() => setOpen(false)}
              >
                <Phone size={14} aria-hidden style={{ color: "var(--color-link)" }} />
                <span className="text-sm font-medium">{ph}</span>
              </a>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
        style={buttonStyle}
        aria-label={t("callUs")}
        aria-expanded={open}
        {...hiddenProps}
      >
        <Phone size={18} aria-hidden className="shrink-0" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">{t("callUs")}</span>
      </button>
    </>
  );
}
