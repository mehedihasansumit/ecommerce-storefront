"use client";

import { useId, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Field, Input } from "@/shared/components/ui";

interface NewsletterFormProps {
  storeId: string;
}

type Status = "idle" | "loading" | "success" | "error";

/**
 * Newsletter sign-up on the brand panel (`--color-newsletter-*` tokens).
 * Email or phone, either is enough. Labels stay visible (no placeholder-only fields).
 */
export function NewsletterForm({ storeId }: NewsletterFormProps) {
  const tr = useTranslations("home");
  const tc = useTranslations("common");
  const id = useId();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !phone) {
      setErrorMsg(tr("newsletterNeedContact"));
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          email: email || undefined,
          phone: phone || undefined,
        }),
      });

      if (res.status === 201) {
        setStatus("success");
        setEmail("");
        setPhone("");
        return;
      }

      const data = await res.json().catch(() => null);
      setErrorMsg(
        res.status === 409
          ? tr("newsletterAlreadySubscribed")
          : data?.error || tr("newsletterError")
      );
      setStatus("error");
    } catch {
      setErrorMsg(tr("newsletterNetworkError"));
      setStatus("error");
    }
  };

  const muted = { color: "color-mix(in srgb, var(--color-newsletter-text) 80%, transparent)" };

  if (status === "success") {
    return (
      <div role="status" className="flex flex-col items-center md:items-start gap-2 py-2 text-center md:text-left">
        <CheckCircle size={28} aria-hidden style={{ color: "var(--color-newsletter-text)" }} />
        <p className="font-semibold text-lg" style={{ color: "var(--color-newsletter-text)" }}>
          {tr("subscribedTitle")}
        </p>
        <p className="text-sm" style={muted}>{tr("subscribedDesc")}</p>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full space-y-3"
      // Inputs are light fields: ring them in the brand colour, not the panel text colour.
      // Field labels sit on the newsletter panel, so they take its text colour.
      style={{
        ["--focus-ring" as string]: "var(--color-primary)",
        ["--ui-label" as string]: "var(--color-newsletter-text)",
        ["--ui-label-dark" as string]: "var(--color-newsletter-text)",
      }}
    >
      <Field label={tr("newsletterEmailLabel")}>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tr("emailPlaceholder")}
          disabled={loading}
          className="min-h-11"
        />
      </Field>

      <div className="flex items-center gap-3" aria-hidden>
        <span className="flex-1 h-px" style={{ backgroundColor: "color-mix(in srgb, var(--color-newsletter-text) 25%, transparent)" }} />
        <span className="text-xs uppercase tracking-widest" style={muted}>{tr("or")}</span>
        <span className="flex-1 h-px" style={{ backgroundColor: "color-mix(in srgb, var(--color-newsletter-text) 25%, transparent)" }} />
      </div>

      <Field label={tr("newsletterPhoneLabel")}>
        <Input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={tc("phonePlaceholder")}
          disabled={loading}
          className="min-h-11"
        />
      </Field>

      {status === "error" && errorMsg && (
        <p role="alert" className="text-sm font-medium" style={{ color: "var(--color-newsletter-text)" }}>
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        variant="brand"
        size="xl"
        fullWidth
        loading={loading}
        className="mt-1"
        style={{
          backgroundColor: "var(--color-newsletter-btn-bg)",
          color: "var(--color-newsletter-btn-text)",
          ["--focus-ring" as string]: "var(--color-newsletter-text)",
        }}
      >
        {tr("subscribe")}
      </Button>

      <p className="text-xs" style={muted}>{tr("noSpam")}</p>
    </form>
  );
}
