"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  Settings,
  Palette,
  ImageIcon,
  Phone,
  Search,
  Loader2,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

type Tab = "general" | "theme" | "banners" | "contact" | "seo";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "seo", label: "SEO", icon: Search },
];

export default function StoreEditForm({ store }: StoreEditFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supportedLangs = store.supportedLanguages?.length
    ? store.supportedLanguages
    : ["en"];
  const [activeLang, setActiveLang] = useState(
    store.defaultLanguage || supportedLangs[0] || "en"
  );

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

  const [expandedBanner, setExpandedBanner] = useState<number | null>(
    heroBanners.length === 1 ? 0 : null
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    section?: keyof typeof formData
  ) => {
    const { name, value } = e.target;
    if (section) {
      setFormData((prev) => {
        const sectionData = prev[section];
        if (typeof sectionData === "object" && sectionData !== null) {
          return { ...prev, [section]: { ...sectionData, [name]: value } };
        }
        return prev;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (
    colorKey: keyof typeof store.theme,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [colorKey]: value },
    }));
  };

  const handleSeoLocalized = (
    field: "title" | "description",
    lang: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, [field]: { ...prev.seo[field], [lang]: value } },
    }));
  };

  const handleAddBanner = () => {
    const newIndex = heroBanners.length;
    setHeroBanners((prev) => [
      ...prev,
      {
        image: "",
        title: { en: "" },
        subtitle: { en: "" },
        linkUrl: "",
        linkText: "",
      },
    ]);
    setExpandedBanner(newIndex);
  };

  const handleRemoveBanner = (index: number) => {
    setHeroBanners((prev) => prev.filter((_, i) => i !== index));
    setExpandedBanner(null);
  };

  const handleBannerField = (
    index: number,
    field: "image" | "linkUrl" | "linkText",
    value: string
  ) => {
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
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const multiLang = formData.supportedLanguages.length > 1;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                isActive
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className="px-6 pt-4">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <Check size={15} className="flex-shrink-0" />
              Store settings saved successfully.
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* ── GENERAL TAB ── */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — fields */}
            <div className="lg:col-span-3 space-y-5">
              <SectionTitle>Basic Information</SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Store Name">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={inputCls}
                    disabled={loading}
                    placeholder="My Awesome Store"
                  />
                </Field>

                <Field label="Status">
                  <select
                    name="isActive"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className={inputCls}
                    disabled={loading}
                  >
                    <option value="true">Active — Visible to customers</option>
                    <option value="false">Inactive — Hidden from customers</option>
                  </select>
                </Field>
              </div>

              <Field label="Domains" hint="Comma-separated list of hostnames this store responds to">
                <input
                  type="text"
                  name="domains"
                  value={formData.domains}
                  onChange={handleInputChange}
                  className={inputCls}
                  disabled={loading}
                  placeholder="mystore.com, www.mystore.com"
                />
              </Field>

              <div className="pt-1 space-y-3">
                <SectionTitle>Languages</SectionTitle>
                <div className="flex flex-wrap gap-3">
                  {[
                    { code: "en", label: "English" },
                    { code: "bn", label: "বাংলা (Bangla)" },
                  ].map(({ code, label }) => {
                    const checked = formData.supportedLanguages.includes(code);
                    return (
                      <label
                        key={code}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                          checked
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              supportedLanguages: e.target.checked
                                ? [...prev.supportedLanguages, code]
                                : prev.supportedLanguages.filter((l) => l !== code),
                            }));
                          }}
                          className="sr-only"
                          disabled={loading}
                        />
                        <Globe size={14} />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    );
                  })}
                </div>

                <Field label="Default Language">
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, defaultLanguage: e.target.value }))
                    }
                    className={inputCls}
                    disabled={loading}
                  >
                    {formData.supportedLanguages.includes("en") && (
                      <option value="en">English</option>
                    )}
                    {formData.supportedLanguages.includes("bn") && (
                      <option value="bn">বাংলা (Bangla)</option>
                    )}
                  </select>
                </Field>
              </div>
            </div>

            {/* Right — store summary card */}
            <div className="lg:col-span-2">
              <SectionTitle>Store Summary</SectionTitle>
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ backgroundColor: store.theme.primaryColor }}
                  >
                    {(formData.name || store.name).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {formData.name || "—"}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${formData.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-400">Domains</span>
                    <span className="text-right font-mono text-gray-600 max-w-[60%] truncate">
                      {formData.domains || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-400">Languages</span>
                    <span className="text-gray-600">
                      {formData.supportedLanguages.map(l => LANGUAGE_LABELS[l] || l).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-400">Default</span>
                    <span className="text-gray-600">
                      {LANGUAGE_LABELS[formData.defaultLanguage] || formData.defaultLanguage}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── THEME TAB ── */}
        {activeTab === "theme" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Controls */}
            <div className="lg:col-span-3 space-y-5">
              <SectionTitle>Colours</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ColorInput
                  label="Primary"
                  value={formData.theme.primaryColor}
                  onChange={(v) => handleColorChange("primaryColor", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Secondary"
                  value={formData.theme.secondaryColor}
                  onChange={(v) => handleColorChange("secondaryColor", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Accent"
                  value={formData.theme.accentColor}
                  onChange={(v) => handleColorChange("accentColor", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Background"
                  value={formData.theme.backgroundColor}
                  onChange={(v) => handleColorChange("backgroundColor", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Body Text"
                  value={formData.theme.textColor}
                  onChange={(v) => handleColorChange("textColor", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Header BG"
                  value={formData.theme.headerBg}
                  onChange={(v) => handleColorChange("headerBg", v)}
                  disabled={loading}
                />
                <ColorInput
                  label="Header Text"
                  value={formData.theme.headerText}
                  onChange={(v) => handleColorChange("headerText", v)}
                  disabled={loading}
                />
              </div>

              <div className="pt-1">
                <SectionTitle>Typography &amp; Layout</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <Field label="Font Family">
                    <select
                      value={formData.theme.fontFamily}
                      onChange={(e) =>
                        handleColorChange("fontFamily", e.target.value as never)
                      }
                      className={inputCls}
                      disabled={loading}
                    >
                      {[
                        "Inter",
                        "Poppins",
                        "Playfair Display",
                        "Roboto",
                        "Open Sans",
                      ].map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Border Radius">
                    <select
                      value={formData.theme.borderRadius}
                      onChange={(e) =>
                        handleColorChange(
                          "borderRadius",
                          e.target.value as never
                        )
                      }
                      className={inputCls}
                      disabled={loading}
                    >
                      <option value="0rem">None — Sharp corners</option>
                      <option value="0.25rem">Small — 4px</option>
                      <option value="0.5rem">Medium — 8px</option>
                      <option value="0.75rem">Large — 12px</option>
                      <option value="1rem">Extra Large — 16px</option>
                    </select>
                  </Field>
                  <Field label="Layout Style">
                    <select
                      value={formData.theme.layoutStyle}
                      onChange={(e) =>
                        handleColorChange(
                          "layoutStyle",
                          e.target.value as never
                        )
                      }
                      className={inputCls}
                      disabled={loading}
                    >
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                      <option value="masonry">Masonry</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <SectionTitle>Live Preview</SectionTitle>
              <div className="mt-3 sticky top-6">
                <div
                  className="rounded-xl overflow-hidden border border-gray-200 shadow-sm text-xs"
                  style={{ fontFamily: formData.theme.fontFamily }}
                >
                  {/* Mock header */}
                  <div
                    className="px-3 py-2.5 flex items-center justify-between"
                    style={{
                      backgroundColor: formData.theme.headerBg,
                      color: formData.theme.headerText,
                    }}
                  >
                    <span className="font-bold text-sm">
                      {formData.name || "Store"}
                    </span>
                    <div className="flex gap-3 text-[11px] opacity-80">
                      <span>Products</span>
                      <span>About</span>
                      <span>Cart</span>
                    </div>
                  </div>

                  {/* Mock hero */}
                  <div
                    className="px-4 py-7 text-center"
                    style={{ backgroundColor: formData.theme.primaryColor }}
                  >
                    <p className="font-bold text-sm text-white drop-shadow-sm">
                      Welcome to our store
                    </p>
                    <p className="text-white opacity-75 text-[11px] mt-1">
                      Discover our collection
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                      style={{
                        backgroundColor: formData.theme.accentColor,
                        borderRadius: formData.theme.borderRadius,
                      }}
                    >
                      Shop Now
                    </button>
                  </div>

                  {/* Mock product cards */}
                  <div
                    className="p-3 grid grid-cols-3 gap-2"
                    style={{ backgroundColor: formData.theme.backgroundColor }}
                  >
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square flex flex-col items-center justify-center gap-1 border border-gray-100 bg-white shadow-sm"
                        style={{
                          borderRadius: formData.theme.borderRadius,
                        }}
                      >
                        <Package size={14} className="text-gray-300" />
                        <div
                          className="h-1.5 w-8 rounded-full opacity-20"
                          style={{
                            backgroundColor: formData.theme.textColor,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Mock footer */}
                  <div
                    className="px-3 py-2 text-[10px] flex items-center justify-between"
                    style={{
                      backgroundColor: formData.theme.secondaryColor,
                      color: formData.theme.headerText,
                      opacity: 0.9,
                    }}
                  >
                    <span>© {formData.name || "Store"}</span>
                    <div className="flex gap-2 opacity-70">
                      <ShoppingBag size={10} />
                    </div>
                  </div>
                </div>

                {/* Colour palette strip */}
                <div className="mt-3 flex gap-1.5">
                  {[
                    formData.theme.primaryColor,
                    formData.theme.secondaryColor,
                    formData.theme.accentColor,
                    formData.theme.headerBg,
                    formData.theme.backgroundColor,
                    formData.theme.textColor,
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-3 rounded-full border border-black/5"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BANNERS TAB ── */}
        {activeTab === "banners" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>Hero Banners</SectionTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Banners rotate on the storefront homepage.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBanner}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Plus size={14} />
                Add Banner
              </button>
            </div>

            {/* Language tabs */}
            {multiLang && (
              <div className="flex gap-1 border-b border-gray-200">
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

            {heroBanners.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                <ImageIcon size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  No banners yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click &ldquo;Add Banner&rdquo; to create your first hero
                  banner.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {heroBanners.map((banner, index) => {
                  const isExpanded = expandedBanner === index;
                  const hasTitle =
                    banner.title[activeLang] || banner.title["en"];
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Banner header row */}
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() =>
                          setExpandedBanner(isExpanded ? null : index)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {hasTitle || `Banner ${index + 1}`}
                            </p>
                            {banner.image && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">
                                {banner.image}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBanner(index);
                            }}
                            disabled={loading}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Banner fields */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 border-t border-gray-200">
                          <Field label="Image URL" required>
                            <input
                              type="text"
                              value={banner.image}
                              onChange={(e) =>
                                handleBannerField(
                                  index,
                                  "image",
                                  e.target.value
                                )
                              }
                              placeholder="https://example.com/banner.jpg"
                              className={inputCls}
                              disabled={loading}
                              required
                            />
                          </Field>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field
                              label={`Title (${LANGUAGE_LABELS[activeLang] || activeLang})`}
                            >
                              <input
                                type="text"
                                value={banner.title[activeLang] ?? ""}
                                onChange={(e) =>
                                  handleBannerLocalized(
                                    index,
                                    "title",
                                    activeLang,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Summer Collection"
                                className={inputCls}
                                disabled={loading}
                              />
                            </Field>
                            <Field
                              label={`Subtitle (${LANGUAGE_LABELS[activeLang] || activeLang})`}
                            >
                              <input
                                type="text"
                                value={banner.subtitle[activeLang] ?? ""}
                                onChange={(e) =>
                                  handleBannerLocalized(
                                    index,
                                    "subtitle",
                                    activeLang,
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Up to 50% off"
                                className={inputCls}
                                disabled={loading}
                              />
                            </Field>
                            <Field label="Button Text">
                              <input
                                type="text"
                                value={banner.linkText}
                                onChange={(e) =>
                                  handleBannerField(
                                    index,
                                    "linkText",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g. Shop Now"
                                className={inputCls}
                                disabled={loading}
                              />
                            </Field>
                            <Field label="Button Link URL">
                              <input
                                type="text"
                                value={banner.linkUrl}
                                onChange={(e) =>
                                  handleBannerField(
                                    index,
                                    "linkUrl",
                                    e.target.value
                                  )
                                }
                                placeholder="/products"
                                className={inputCls}
                                disabled={loading}
                              />
                            </Field>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CONTACT TAB ── */}
        {activeTab === "contact" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SectionTitle>Contact Details</SectionTitle>
              <p className="text-xs text-gray-400">
                Displayed in your store footer and used for customer support.
              </p>
              <Field label="Email Address">
                <input
                  type="email"
                  name="email"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange(e, "contact")}
                  className={inputCls}
                  disabled={loading}
                  placeholder="hello@mystore.com"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  name="phone"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange(e, "contact")}
                  className={inputCls}
                  disabled={loading}
                  placeholder="+880 1700-000000"
                />
              </Field>
              <Field label="Address">
                <textarea
                  name="address"
                  value={formData.contact.address}
                  onChange={(e) => handleInputChange(e, "contact")}
                  className={`${inputCls} resize-none`}
                  rows={3}
                  disabled={loading}
                  placeholder="123 Main St, Dhaka, Bangladesh"
                />
              </Field>
            </div>
            {/* Right column — placeholder for map or additional info */}
            <div className="hidden lg:flex items-start justify-center pt-8">
              <div className="w-full h-48 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Phone size={24} />
                <p className="text-sm font-medium">Contact info</p>
                <p className="text-xs text-center px-4">Fill in your store&apos;s contact details on the left.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SEO TAB ── */}
        {activeTab === "seo" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — Fields */}
            <div className="lg:col-span-3 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <SectionTitle>Search Engine Optimisation</SectionTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Controls how your store appears in Google search results.
                  </p>
                </div>
                {multiLang && (
                  <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                    {formData.supportedLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          activeLang === lang
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Page Title" hint="Shown in browser tab and search results. 50–60 chars recommended.">
                <input
                  type="text"
                  value={formData.seo.title[activeLang] ?? ""}
                  onChange={(e) =>
                    handleSeoLocalized("title", activeLang, e.target.value)
                  }
                  className={inputCls}
                  disabled={loading}
                  placeholder="My Store — Best Products Online"
                  maxLength={70}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {(formData.seo.title[activeLang] ?? "").length}/70
                </p>
              </Field>

              <Field label="Meta Description" hint="Shown below title in search results. 150–160 chars recommended.">
                <textarea
                  value={formData.seo.description[activeLang] ?? ""}
                  onChange={(e) =>
                    handleSeoLocalized("description", activeLang, e.target.value)
                  }
                  className={`${inputCls} resize-none`}
                  rows={4}
                  disabled={loading}
                  placeholder="Discover our wide range of products at the best prices..."
                  maxLength={180}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {(formData.seo.description[activeLang] ?? "").length}/180
                </p>
              </Field>

              <Field label="Keywords" hint="Comma-separated. Helps with categorisation.">
                <input
                  type="text"
                  name="keywords"
                  value={formData.seo.keywords}
                  onChange={(e) => handleInputChange(e, "seo")}
                  className={inputCls}
                  disabled={loading}
                  placeholder="clothing, fashion, shirts, bangladeshi store"
                />
              </Field>
            </div>

            {/* Right — SERP Preview (always visible) */}
            <div className="lg:col-span-2">
              <SectionTitle>Search Preview</SectionTitle>
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-0.5">
                <p className="text-[15px] text-blue-700 font-medium leading-snug">
                  {formData.seo.title[activeLang] || (
                    <span className="text-gray-400 italic">Page title</span>
                  )}
                </p>
                <p className="text-xs text-green-700">
                  {store.domains[0] || "mystore.com"}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mt-1">
                  {formData.seo.description[activeLang] || (
                    <span className="text-gray-400 italic">
                      Meta description will appear here once you fill in the field on the left.
                    </span>
                  )}
                </p>
              </div>
              {formData.seo.keywords && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.seo.keywords.split(",").map((kw, i) => {
                      const k = kw.trim();
                      return k ? (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs rounded-md"
                        >
                          {k}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer — Save Button */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-400">
          Changes apply to all storefront visitors immediately.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Saving…
            </>
          ) : success ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Helpers ────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {children}
    </h3>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
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
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white disabled:opacity-50"
            title={`Pick ${label} colour`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-2 text-xs border border-gray-200 rounded-lg font-mono bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          disabled={disabled}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
