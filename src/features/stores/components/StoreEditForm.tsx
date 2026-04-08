"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import type { IStore } from "@/features/stores/types";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";

interface StoreEditFormProps {
  store: IStore;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

interface BannerState {
  image: string;
  title: LocalizedString;
  subtitle: LocalizedString;
  linkUrl: string;
  linkText: string;
}

export default function StoreEditForm({ store }: StoreEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supportedLangs = store.supportedLanguages?.length ? store.supportedLanguages : ["en"];
  const [activeLang, setActiveLang] = useState(store.defaultLanguage || supportedLangs[0] || "en");

  const [formData, setFormData] = useState({
    name: store.name,
    domains: store.domains.join(", "),
    theme: { ...store.theme },
    isActive: store.isActive,
    contact: {
      email: store.contact?.email || "",
      phone: store.contact?.phone || "",
      address: store.contact?.address || "",
    },
    seo: {
      title: toLocalized(store.seo?.title),
      description: toLocalized(store.seo?.description),
      keywords: store.seo?.keywords?.join(", ") || "",
    },
    supportedLanguages: supportedLangs,
    defaultLanguage: store.defaultLanguage || "en",
  });

  const [heroBanners, setHeroBanners] = useState<BannerState[]>(
    (store.heroBanners || []).map((b) => ({
      image: b.image,
      title: toLocalized(b.title),
      subtitle: toLocalized(b.subtitle),
      linkUrl: b.linkUrl || "",
      linkText: b.linkText || "",
    }))
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    section?: keyof typeof formData
  ) => {
    const { name, value } = e.target;

    if (section) {
      setFormData((prev) => {
        const sectionData = prev[section];
        if (typeof sectionData === "object" && sectionData !== null) {
          return {
            ...prev,
            [section]: {
              ...sectionData,
              [name]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (colorKey: keyof typeof store.theme, value: string) => {
    setFormData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [colorKey]: value },
    }));
  };

  const handleSeoLocalized = (field: "title" | "description", lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: { ...prev.seo[field], [lang]: value },
      },
    }));
  };

  const handleAddBanner = () => {
    setHeroBanners((prev) => [
      ...prev,
      { image: "", title: { en: "" }, subtitle: { en: "" }, linkUrl: "", linkText: "" },
    ]);
  };

  const handleRemoveBanner = (index: number) => {
    setHeroBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBannerField = (index: number, field: "image" | "linkUrl" | "linkText", value: string) => {
    setHeroBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const handleBannerLocalized = (
    index: number,
    field: "title" | "subtitle",
    lang: string,
    value: string
  ) => {
    setHeroBanners((prev) =>
      prev.map((b, i) =>
        i === index ? { ...b, [field]: { ...b[field], [lang]: value } } : b
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const domainsArray = formData.domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d);

      const keywords = formData.seo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      const res = await fetch(`/api/stores/${store._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domains: domainsArray,
          theme: formData.theme,
          isActive: formData.isActive,
          heroBanners,
          contact: formData.contact,
          seo: {
            title: formData.seo.title,
            description: formData.seo.description,
            keywords,
          },
          supportedLanguages: formData.supportedLanguages,
          defaultLanguage: formData.defaultLanguage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update store");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-3">Edit Store</h2>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <Check size={16} />
          Store updated successfully
        </div>
      )}

      {/* Language tabs (shown when multiple languages) */}
      {formData.supportedLanguages.length > 1 && (
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {formData.supportedLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeLang === lang
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Basic Info */}
        <div className="col-span-full">
          <h3 className="font-medium mb-2 text-sm">Basic Information</h3>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Store Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            name="isActive"
            value={formData.isActive ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isActive: e.target.value === "true",
              }))
            }
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Default Language</label>
          <select
            value={formData.defaultLanguage}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, defaultLanguage: e.target.value }))
            }
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            {formData.supportedLanguages.includes("en") && <option value="en">English</option>}
            {formData.supportedLanguages.includes("bn") && <option value="bn">বাংলা (Bangla)</option>}
          </select>
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium mb-1">Domains (comma-separated)</label>
          <input
            type="text"
            name="domains"
            value={formData.domains}
            onChange={handleInputChange}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        {/* Languages */}
        <div className="col-span-full pt-3 border-t">
          <h3 className="font-medium mb-2 text-sm">Languages</h3>
        </div>

        <div className="col-span-full">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lang-en"
                checked={formData.supportedLanguages.includes("en")}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    supportedLanguages: e.target.checked
                      ? [...prev.supportedLanguages, "en"]
                      : prev.supportedLanguages.filter((l) => l !== "en"),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
                disabled={loading}
              />
              <label htmlFor="lang-en" className="text-sm cursor-pointer">English</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lang-bn"
                checked={formData.supportedLanguages.includes("bn")}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    supportedLanguages: e.target.checked
                      ? [...prev.supportedLanguages, "bn"]
                      : prev.supportedLanguages.filter((l) => l !== "bn"),
                  }));
                }}
                className="w-4 h-4 accent-blue-600"
                disabled={loading}
              />
              <label htmlFor="lang-bn" className="text-sm cursor-pointer">বাংলা (Bangla)</label>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="col-span-full pt-3 border-t">
          <h3 className="font-medium mb-2 text-sm">Theme Colors</h3>
        </div>

        <ColorInput label="Primary" value={formData.theme.primaryColor} onChange={(v) => handleColorChange("primaryColor", v)} disabled={loading} />
        <ColorInput label="Secondary" value={formData.theme.secondaryColor} onChange={(v) => handleColorChange("secondaryColor", v)} disabled={loading} />
        <ColorInput label="Accent" value={formData.theme.accentColor} onChange={(v) => handleColorChange("accentColor", v)} disabled={loading} />
        <ColorInput label="Background" value={formData.theme.backgroundColor} onChange={(v) => handleColorChange("backgroundColor", v)} disabled={loading} />
        <ColorInput label="Text" value={formData.theme.textColor} onChange={(v) => handleColorChange("textColor", v)} disabled={loading} />
        <ColorInput label="Header BG" value={formData.theme.headerBg} onChange={(v) => handleColorChange("headerBg", v)} disabled={loading} />
        <ColorInput label="Header Text" value={formData.theme.headerText} onChange={(v) => handleColorChange("headerText", v)} disabled={loading} />

        {/* Font & Layout */}
        <div className="col-span-full pt-3 border-t">
          <h3 className="font-medium mb-2 text-sm">Typography & Layout</h3>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Font Family</label>
          <select
            value={formData.theme.fontFamily}
            onChange={(e) => handleColorChange("fontFamily", e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option>Inter</option>
            <option>Poppins</option>
            <option>Playfair Display</option>
            <option>Roboto</option>
            <option>Open Sans</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Border Radius</label>
          <select
            value={formData.theme.borderRadius}
            onChange={(e) => handleColorChange("borderRadius", e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          >
            <option value="0rem">None</option>
            <option value="0.25rem">Small</option>
            <option value="0.5rem">Medium</option>
            <option value="0.75rem">Large</option>
            <option value="1rem">Extra Large</option>
          </select>
        </div>

        {/* Hero Banners */}
        <div className="col-span-full pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">
              Hero Banners
              {formData.supportedLanguages.length > 1 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  — {LANGUAGE_LABELS[activeLang] || activeLang}
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={handleAddBanner}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              + Add
            </button>
          </div>
        </div>

        {heroBanners.map((banner, index) => (
          <div
            key={index}
            className="col-span-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium">Banner {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveBanner(index)}
                className="text-xs text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition"
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={banner.image}
              onChange={(e) => handleBannerField(index, "image", e.target.value)}
              placeholder="Image URL"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              disabled={loading}
              required
            />

            <input
              type="text"
              value={banner.title[activeLang] ?? ""}
              onChange={(e) => handleBannerLocalized(index, "title", activeLang, e.target.value)}
              placeholder={`Title (${LANGUAGE_LABELS[activeLang] || activeLang})`}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              disabled={loading}
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={banner.subtitle[activeLang] ?? ""}
                onChange={(e) => handleBannerLocalized(index, "subtitle", activeLang, e.target.value)}
                placeholder={`Subtitle (${LANGUAGE_LABELS[activeLang] || activeLang})`}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={loading}
              />
              <input
                type="text"
                value={banner.linkUrl}
                onChange={(e) => handleBannerField(index, "linkUrl", e.target.value)}
                placeholder="Link URL"
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={loading}
              />
              <input
                type="text"
                value={banner.linkText}
                onChange={(e) => handleBannerField(index, "linkText", e.target.value)}
                placeholder="Link text"
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={loading}
              />
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="col-span-full pt-3 border-t">
          <h3 className="font-medium mb-2 text-sm">Contact</h3>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.contact.email}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.contact.phone}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium mb-1">Address</label>
          <textarea
            name="address"
            value={formData.contact.address}
            onChange={(e) => handleInputChange(e, "contact")}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows={2}
            disabled={loading}
          />
        </div>

        {/* SEO */}
        <div className="col-span-full pt-3 border-t">
          <h3 className="font-medium mb-2 text-sm">
            SEO
            {formData.supportedLanguages.length > 1 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                — {LANGUAGE_LABELS[activeLang] || activeLang}
              </span>
            )}
          </h3>
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium mb-1">SEO Title</label>
          <input
            type="text"
            value={formData.seo.title[activeLang] ?? ""}
            onChange={(e) => handleSeoLocalized("title", activeLang, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium mb-1">SEO Description</label>
          <textarea
            value={formData.seo.description[activeLang] ?? ""}
            onChange={(e) => handleSeoLocalized("description", activeLang, e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows={2}
            disabled={loading}
          />
        </div>

        <div className="col-span-full">
          <label className="block text-xs font-medium mb-1">Keywords (comma-separated)</label>
          <input
            type="text"
            name="keywords"
            value={formData.seo.keywords}
            onChange={(e) => handleInputChange(e, "seo")}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <div className="col-span-full pt-3 border-t flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer"
          disabled={disabled}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
