"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { Alert, Button, Input } from "@/shared/components/ui";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ name, email, password, phone: `+880${nationalNumber.replace(/^0/, "")}` }),
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
    <div className="flex justify-center px-4 py-8 md:min-h-[70vh] md:items-center md:py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {t("createAccount")}
          </h1>
        </div>

        <div
          className="shadow-sm border px-8 py-10"
          style={{
            borderRadius: "var(--border-radius)",
            backgroundColor: "var(--color-card-bg)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <Alert tone="error">{error}</Alert>}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t("name")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <Input
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  style={{ borderRadius: "var(--border-radius)" }}
                  placeholder={t("name")}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  style={{ borderRadius: "var(--border-radius)" }}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t("phone")} <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                pattern="\d*"
                prefix={
                  <>
                    <Phone aria-hidden className="w-4 h-4" />
                    +88
                  </>
                }
                value={nationalNumber}
                onChange={(e) => setNationalNumber(e.target.value)}
                onKeyDown={(e) => {
                  // Block single printable non-digits; named keys (Tab, arrows, Backspace) pass through.
                  if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                  }
                }}
                style={{ borderRadius: "var(--border-radius)" }}
                placeholder={tc("phonePlaceholder")}
                maxLength={11}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  style={{ borderRadius: "var(--border-radius)" }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus-ring absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="brand" fullWidth size="lg" loading={loading} className="mt-2">
              {t("register")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t("haveAccount")}{" "}
          <Link
            href="/account/login"
            className="font-semibold hover:underline transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
