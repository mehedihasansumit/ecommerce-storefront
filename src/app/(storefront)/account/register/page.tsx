"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: `880${nationalNumber}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("error"));
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">{t("createAccount")}</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded">{error}</p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t("name")}</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="Your Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("phone")}</label>
          <div className="flex">
            <span className="px-4 py-2 border border-gray-300 bg-gray-50 px-4 py-2 rounded-l rounded-r-0" style={{ borderRadius: "var(--border-radius)" }}>880</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              required
              pattern="\d*"
              value={nationalNumber}
              onChange={(e) => setNationalNumber(e.target.value)}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                  e.preventDefault();
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 focus:border-l-0"
              style={{ borderRadius: "var(--border-radius)" }}
              placeholder="1712345678"
              maxLength={10}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 text-white font-medium disabled:opacity-60"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {loading ? t("registering") : t("register")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        {t("haveAccount")}{" "}
        <Link
          href="/account/login"
          className="font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
