"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface NewsletterFormProps {
  storeId: string;
  emailPlaceholder: string;
  subscribeLabel: string;
}

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm({
  storeId,
  emailPlaceholder,
  subscribeLabel,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !phone) {
      setErrorMsg("Please enter your email or phone number.");
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

      const data = await res.json();
      if (res.status === 409) {
        setErrorMsg("You're already subscribed!");
      } else {
        setErrorMsg(data?.error || "Something went wrong. Please try again.");
      }
      setStatus("error");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle size={28} style={{ color: "var(--color-newsletter-text)" }} />
        </div>
        <p className="font-semibold text-lg" style={{ color: "var(--color-newsletter-text)" }}>Thanks for subscribing!</p>
        <p className="text-sm" style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 70%, transparent)" }}>We'll keep you updated with the best offers.</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-5 py-3 rounded-full bg-white/10 border border-white/25 placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all disabled:opacity-60 text-sm";

  return (
    <div className="max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          disabled={status === "loading"}
          className={inputClass}
          style={{ color: "var(--color-newsletter-text)" }}
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 40%, transparent)" }}
          >or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+880 1XXX XXXXXX"
          disabled={status === "loading"}
          className={inputClass}
          style={{ color: "var(--color-newsletter-text)" }}
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full px-8 py-3.5 font-semibold rounded-full transition-all hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 mt-1"
          style={{
            backgroundColor: "var(--color-newsletter-btn-bg)",
            color: "var(--color-newsletter-btn-text)",
          }}
        >
          {status === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Subscribing…
            </>
          ) : (
            subscribeLabel
          )}
        </button>
      </form>

      {status === "error" && errorMsg && (
        <p
          className="mt-3 text-sm text-center bg-white/10 rounded-full px-4 py-1.5"
          style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 80%, transparent)" }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
