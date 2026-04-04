"use client";

import { useState } from "react";

interface NewsletterFormProps {
  emailPlaceholder: string;
  subscribeLabel: string;
}

export function NewsletterForm({
  emailPlaceholder,
  subscribeLabel,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter submission logic goes here
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={emailPlaceholder}
        required
        className="flex-1 px-5 py-3 rounded-lg bg-white/15 border border-white/25 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-white font-semibold rounded-lg transition-all hover:shadow-lg hover:scale-105"
        style={{ color: "var(--color-primary)" }}
      >
        {subscribeLabel}
      </button>
    </form>
  );
}
