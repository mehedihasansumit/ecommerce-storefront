"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("login")}</h1>
        </div>

        <div
          className="bg-white shadow-sm border border-gray-200 px-8 py-8"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
                  style={{ borderRadius: "var(--border-radius)" }}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm"
                  style={{ borderRadius: "var(--border-radius)" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t("loggingIn")}
                </span>
              ) : (
                t("login")
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t("noAccount")}{" "}
          <Link
            href="/account/register"
            className="font-semibold hover:underline transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {t("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
