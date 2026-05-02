"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Palette,
  Globe,
  Languages,
  Type,
  Square,
  Sparkles,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/shared/components/ui";

const DEFAULT_THEME = {
  primaryColor: "#2563EB",
  secondaryColor: "#3B82F6",
  accentColor: "#DBEAFE",
  backgroundColor: "#FFFFFF",
  textColor: "#1E293B",
  headerBg: "#1E3A5F",
  headerText: "#FFFFFF",
  fontFamily: "Inter",
  borderRadius: "0.5rem",
  layoutStyle: "grid" as const,
};

const COLOR_FIELDS: Array<{
  key: keyof typeof DEFAULT_THEME;
  label: string;
  hint?: string;
}> = [
  { key: "primaryColor", label: "Primary", hint: "CTAs and brand accents" },
  { key: "secondaryColor", label: "Secondary", hint: "Secondary highlights" },
  { key: "accentColor", label: "Accent", hint: "Badges and chips" },
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Body Text" },
  { key: "headerBg", label: "Header Background" },
  { key: "headerText", label: "Header Text" },
];

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    domains: "",
    theme: DEFAULT_THEME,
    supportedLanguages: ["en"],
    defaultLanguage: "en",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (
    colorKey: keyof typeof DEFAULT_THEME,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [colorKey]: value },
    }));
  };

  const toggleLanguage = (lang: string, checked: boolean) => {
    setFormData((prev) => {
      const next = checked
        ? Array.from(new Set([...prev.supportedLanguages, lang]))
        : prev.supportedLanguages.filter((l) => l !== lang);
      const defaultLanguage = next.includes(prev.defaultLanguage)
        ? prev.defaultLanguage
        : next[0] ?? "en";
      return { ...prev, supportedLanguages: next, defaultLanguage };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const domainsArray = formData.domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      if (!formData.name.trim()) throw new Error("Store name is required");
      if (domainsArray.length === 0)
        throw new Error("At least one domain is required");
      if (formData.supportedLanguages.length === 0)
        throw new Error("Select at least one language");

      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domains: domainsArray,
          theme: formData.theme,
          supportedLanguages: formData.supportedLanguages,
          defaultLanguage: formData.defaultLanguage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create store");
      }

      const data = await res.json();
      router.push(`/admin/stores/${data.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const initial = formData.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        breadcrumbs={
          <Link
            href="/admin/stores"
            className="inline-flex items-center gap-1 text-xs text-admin-text-subtle hover:text-admin-text-primary transition-colors"
          >
            <ChevronLeft size={14} />
            Back to stores
          </Link>
        }
        title="Create New Store"
        description="Configure brand, languages, and theme for a new tenant."
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Preview */}
        <Card padding="lg" className="overflow-hidden">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0 transition-colors"
              style={{ backgroundColor: formData.theme.primaryColor }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-admin-text-subtle">Live preview</p>
              <h3 className="text-lg font-semibold truncate">
                {formData.name.trim() || "Your store name"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[
                  formData.theme.primaryColor,
                  formData.theme.secondaryColor,
                  formData.theme.accentColor,
                  formData.theme.headerBg,
                  formData.theme.backgroundColor,
                ].map((c, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Basics */}
        <Card padding="lg">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Globe size={16} className="text-admin-text-subtle" />
                Store Basics
              </span>
            }
            description="Name and domains the store responds to."
          />
          <div className="space-y-5">
            <Field label="Store Name" required>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Shirts Hub"
                required
                disabled={loading}
              />
            </Field>

            <Field
              label="Domains"
              hint="Comma-separated. Each domain routes to this store."
              required
            >
              <Input
                type="text"
                name="domains"
                value={formData.domains}
                onChange={handleInputChange}
                placeholder="store.com, www.store.com"
                required
                disabled={loading}
              />
            </Field>
          </div>
        </Card>

        {/* Languages */}
        <Card padding="lg">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Languages size={16} className="text-admin-text-subtle" />
                Languages
              </span>
            }
            description="Locales available on the storefront."
          />
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: "en", label: "English" },
                { code: "bn", label: "বাংলা (Bangla)" },
              ].map((l) => {
                const active = formData.supportedLanguages.includes(l.code);
                return (
                  <label
                    key={l.code}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                      active
                        ? "border-gray-900 bg-gray-900/5 dark:border-gray-200 dark:bg-gray-100/5"
                        : "border-admin-border-md hover:border-admin-text-subtle"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => toggleLanguage(l.code, e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 accent-gray-900"
                    />
                    <span className="text-sm font-medium">{l.label}</span>
                  </label>
                );
              })}
            </div>

            <Field label="Default Language" hint="Used when no locale cookie is set.">
              <Select
                value={formData.defaultLanguage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultLanguage: e.target.value,
                  }))
                }
                disabled={loading || formData.supportedLanguages.length === 0}
              >
                {formData.supportedLanguages.includes("en") && (
                  <option value="en">English</option>
                )}
                {formData.supportedLanguages.includes("bn") && (
                  <option value="bn">বাংলা (Bangla)</option>
                )}
              </Select>
            </Field>
          </div>
        </Card>

        {/* Theme */}
        <Card padding="lg">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Palette size={16} className="text-admin-text-subtle" />
                Theme
              </span>
            }
            description="Colors, typography, and shape applied across the storefront."
          />

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-admin-text-subtle uppercase tracking-wider mb-3 inline-flex items-center gap-1.5">
                <Sparkles size={12} />
                Palette
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COLOR_FIELDS.map((c) => (
                  <ColorInput
                    key={c.key}
                    label={c.label}
                    hint={c.hint}
                    value={formData.theme[c.key] as string}
                    onChange={(v) => handleColorChange(c.key, v)}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-admin-border">
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Type size={13} className="text-admin-text-subtle" />
                    Font Family
                  </span>
                }
              >
                <Select
                  value={formData.theme.fontFamily}
                  onChange={(e) =>
                    handleColorChange("fontFamily", e.target.value)
                  }
                  disabled={loading}
                >
                  <option>Inter</option>
                  <option>Poppins</option>
                  <option>Playfair Display</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                </Select>
              </Field>

              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Square size={13} className="text-admin-text-subtle" />
                    Border Radius
                  </span>
                }
              >
                <Select
                  value={formData.theme.borderRadius}
                  onChange={(e) =>
                    handleColorChange("borderRadius", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="0rem">None</option>
                  <option value="0.25rem">Small</option>
                  <option value="0.5rem">Medium</option>
                  <option value="0.75rem">Large</option>
                  <option value="1rem">Extra Large</option>
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href="/admin/stores">
            <Button type="button" variant="secondary" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? "Creating…" : "Create Store"}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, hint, value, onChange, disabled }: ColorInputProps) {
  return (
    <Field label={label} hint={hint}>
      <div
        className={`flex items-stretch gap-2 rounded-lg border border-admin-border-md bg-admin-surface focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent transition-all ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <label
          className="relative w-12 shrink-0 rounded-l-lg overflow-hidden cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
            aria-label={`${label} color picker`}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 text-sm font-mono uppercase outline-none"
          disabled={disabled}
          spellCheck={false}
        />
      </div>
    </Field>
  );
}
