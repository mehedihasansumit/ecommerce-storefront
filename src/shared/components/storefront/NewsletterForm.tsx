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
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, storeId }),
      });

      if (res.status === 201) {
        setStatus("success");
        setEmail("");
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
          <CheckCircle size={28} className="text-white" />
        </div>
        <p className="text-white font-semibold text-lg">Thanks for subscribing!</p>
        <p className="text-white/70 text-sm">We'll keep you updated with the best offers.</p>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          required
          disabled={status === "loading"}
          className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/25 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-8 py-3.5 bg-white font-semibold rounded-full transition-all hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
          style={{ color: "var(--color-primary)" }}
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
        <p className="mt-3 text-white/80 text-sm text-center bg-white/10 rounded-full px-4 py-1.5 max-w-sm mx-auto">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
