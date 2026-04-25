"use client";

import { useState } from "react";
import { Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";

export function FloatingCallButton() {
  const tenant = useTenant();
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);

  const phones: string[] = [
    ...(tenant?.contact?.phones?.filter(Boolean) ?? []),
    ...(tenant?.contact?.phone ? [tenant.contact.phone] : []),
  ].filter((v, i, a) => a.indexOf(v) === i); // dedupe

  if (phones.length === 0) return null;

  const single = phones.length === 1;

  const buttonClass =
    "fixed right-4 z-40 flex items-center justify-center gap-2 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 select-none glass md:bottom-6 bottom-[4.5rem]";
  const buttonStyle = {
    backgroundColor: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
    color: "var(--color-header-text, #fff)",
    padding: "0.75rem 1rem",
  };

  if (single) {
    return (
      <a
        href={`tel:${phones[0]}`}
        className={buttonClass}
        style={buttonStyle}
        aria-label={`Call ${phones[0]}`}
      >
        <Phone size={18} className="shrink-0 animate-pulse" />
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
            className="fixed inset-0 z-[39]"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed right-4 z-40 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up md:bottom-20 bottom-[8.5rem]"
            style={{
              backgroundColor: "var(--color-card-bg)",
              border: "1px solid var(--color-border-subtle)",
              minWidth: "200px",
            }}
          >
            <div className="px-4 py-2.5 border-b border-border-subtle flex items-center justify-between gap-4">
              <button className=" cursor-pointer text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>
                {t("callUs")}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: "var(--color-text)" }}
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>
            {phones.map((ph) => (
              <a
                key={ph}
                href={`tel:${ph}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                style={{ color: "var(--color-text)" }}
                onClick={() => setOpen(false)}
              >
                <Phone size={14} style={{ color: "var(--color-primary)" }} />
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
      >
        <Phone size={18} className="shrink-0 animate-pulse" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">{t("callUs")}</span>
      </button>
    </>
  );
}
