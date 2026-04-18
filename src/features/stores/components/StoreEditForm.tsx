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
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { IStore } from "@/features/stores/types";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";
import { ImageInput } from "@/shared/components/ui";

interface StoreEditFormProps {
  store: IStore;
  canEditStore?: boolean;
  canManagePoints?: boolean;
}

const DEFAULT_POINTS_CONFIG = {
  enabled: true,
  pointsPerReview: 10,
  minRedemptionPoints: 100,
  pointsPerBdt: 10,
};

const WHATSAPP_TEMPLATE_PLACEHOLDERS = [
  "{{productName}}",
  "{{variant}}",
  "{{quantity}}",
  "{{productPrice}}",
  "{{total}}",
  "{{productUrl}}",
] as const;

const WHATSAPP_EXAMPLE_TEMPLATE =
  "Hi, I'd like to order:\n" +
  "• {{productName}}\n" +
  "• Variant: {{variant}}\n" +
  "• Quantity: {{quantity}}\n" +
  "• Unit price: {{productPrice}}\n" +
  "• Total: {{total}}\n" +
  "{{productUrl}}";

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

type Tab =
  | "general"
  | "theme"
  | "banners"
  | "contact"
  | "socialOrdering"
  | "seo"
  | "loyalty";

const STORE_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "socialOrdering", label: "Social Ordering", icon: MessageCircle },
  { id: "seo", label: "SEO", icon: Search },
];

const LOYALTY_TAB: { id: Tab; label: string; icon: React.ElementType } = {
  id: "loyalty",
  label: "Loyalty Points",
  icon: Sparkles,
};

export default function StoreEditForm({
  store,
  canEditStore = true,
  canManagePoints = false,
}: StoreEditFormProps) {
  const visibleTabs = [
    ...(canEditStore ? STORE_TABS : []),
    ...(canManagePoints ? [LOYALTY_TAB] : []),
  ];
  const initialTab: Tab = visibleTabs[0]?.id ?? "general";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
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
    theme: {
      ...store.theme,
      dark: {
        primaryColor:      store.theme.dark?.primaryColor,
        backgroundColor:   store.theme.dark?.backgroundColor ?? "#111827",
        textColor:         store.theme.dark?.textColor ?? "#F9FAFB",
        surfaceColor:      store.theme.dark?.surfaceColor ?? "#1F2937",
        borderColor:       store.theme.dark?.borderColor ?? "#374151",
        headerBg:          store.theme.dark?.headerBg ?? "#0F172A",
        headerText:        store.theme.dark?.headerText ?? "#F8FAFC",
        newsletterBg:      store.theme.dark?.newsletterBg,
        newsletterText:    store.theme.dark?.newsletterText,
        newsletterBtnBg:   store.theme.dark?.newsletterBtnBg,
        newsletterBtnText: store.theme.dark?.newsletterBtnText,
        priceColor:        store.theme.dark?.priceColor,
        saleBadgeBg:       store.theme.dark?.saleBadgeBg,
        saleBadgeText:     store.theme.dark?.saleBadgeText,
        footerBg:          store.theme.dark?.footerBg,
        footerText:        store.theme.dark?.footerText,
        linkColor:         store.theme.dark?.linkColor,
        cardBg:            store.theme.dark?.cardBg,
      },
    },
    isActive: store.isActive,
    logo: store.logo || "",
    favicon: store.favicon || "",
    contact: {
      email: store.contact?.email || "",
      phone: store.contact?.phone || "",
      address: store.contact?.address || "",
    },
    seo: {
      title: toLocalized(store.seo?.title),
      description: toLocalized(store.seo?.description),
      keywords: store.seo?.keywords?.join(", ") || "",
      ogImage: store.seo?.ogImage || "",
    },
    socialOrdering: {
      whatsapp: {
        enabled: store.socialOrdering?.whatsapp?.enabled ?? false,
        phoneNumber: store.socialOrdering?.whatsapp?.phoneNumber ?? "",
        messageTemplate: store.socialOrdering?.whatsapp?.messageTemplate ?? "",
      },
      facebook: {
        enabled: store.socialOrdering?.facebook?.enabled ?? false,
        pageUrl: store.socialOrdering?.facebook?.pageUrl ?? "",
      },
    },
    supportedLanguages: supportedLangs,
    defaultLanguage: store.defaultLanguage || "en",
    pointsConfig: {
      enabled: store.pointsConfig?.enabled ?? DEFAULT_POINTS_CONFIG.enabled,
      pointsPerReview:
        store.pointsConfig?.pointsPerReview ?? DEFAULT_POINTS_CONFIG.pointsPerReview,
      minRedemptionPoints:
        store.pointsConfig?.minRedemptionPoints ??
        DEFAULT_POINTS_CONFIG.minRedemptionPoints,
      pointsPerBdt:
        store.pointsConfig?.pointsPerBdt ?? DEFAULT_POINTS_CONFIG.pointsPerBdt,
    },
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

  const handleDarkColorChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        dark: { ...prev.theme.dark, [key]: value },
      },
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

      const payload: Record<string, unknown> = {};
      if (canEditStore) {
        payload.name = formData.name;
        payload.domains = domainsArray;
        payload.theme = formData.theme;
        payload.isActive = formData.isActive;
        payload.logo = formData.logo;
        payload.favicon = formData.favicon;
        payload.heroBanners = heroBanners;
        payload.contact = formData.contact;
        payload.socialOrdering = formData.socialOrdering;
        payload.seo = {
          title: formData.seo.title,
          description: formData.seo.description,
          keywords,
          ogImage: formData.seo.ogImage,
        };
        payload.supportedLanguages = formData.supportedLanguages;
        payload.defaultLanguage = formData.defaultLanguage;
      }
      if (canManagePoints) {
        payload.pointsConfig = formData.pointsConfig;
      }

      const res = await fetch(`/api/stores/${store._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden"
    >
      {/* Tab Bar */}
      <div className="flex border-b border-admin-border bg-admin-surface-raised overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                isActive
                  ? "border-gray-900 text-admin-text-primary bg-admin-surface"
                  : "border-transparent text-admin-text-muted hover:text-admin-text-secondary hover:bg-admin-chip"
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
                <SectionTitle>Branding</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageInput
                    label="Logo"
                    value={formData.logo}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, logo: url }))
                    }
                    storeId={store._id}
                    folder="stores"
                    aspect="auto"
                    hint="Shown in storefront header."
                    disabled={loading}
                  />
                  <ImageInput
                    label="Favicon"
                    value={formData.favicon}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, favicon: url }))
                    }
                    storeId={store._id}
                    folder="stores"
                    aspect="square"
                    hint="Browser tab icon. Square PNG/ICO."
                    disabled={loading}
                  />
                </div>
              </div>

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
                            : "border-admin-border bg-admin-surface text-admin-text-secondary hover:border-admin-border-md"
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
              <div className="mt-3 rounded-xl border border-admin-border bg-admin-surface-raised p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ backgroundColor: store.theme.primaryColor }}
                  >
                    {(formData.name || store.name).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-admin-text-secondary leading-tight">
                      {formData.name || "—"}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${formData.isActive ? "text-emerald-600" : "text-admin-text-subtle"}`}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-admin-text-muted">
                  <div className="flex justify-between">
                    <span className="font-medium text-admin-text-subtle">Domains</span>
                    <span className="text-right font-mono text-admin-text-secondary max-w-[60%] truncate">
                      {formData.domains || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-admin-text-subtle">Languages</span>
                    <span className="text-admin-text-secondary">
                      {formData.supportedLanguages.map(l => LANGUAGE_LABELS[l] || l).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-admin-text-subtle">Default</span>
                    <span className="text-admin-text-secondary">
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
                <SectionTitle>Dark Mode Colours</SectionTitle>
                <p className="text-xs text-admin-text-muted mt-0.5 mb-3">Applied when visitors enable dark mode on your storefront.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ColorInput
                    label="Dark Primary"
                    value={formData.theme.dark?.primaryColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleDarkColorChange("primaryColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Background"
                    value={formData.theme.dark?.backgroundColor ?? "#111827"}
                    onChange={(v) => handleDarkColorChange("backgroundColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Body Text"
                    value={formData.theme.dark?.textColor ?? "#F9FAFB"}
                    onChange={(v) => handleDarkColorChange("textColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Surface"
                    value={formData.theme.dark?.surfaceColor ?? "#1F2937"}
                    onChange={(v) => handleDarkColorChange("surfaceColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Border"
                    value={formData.theme.dark?.borderColor ?? "#374151"}
                    onChange={(v) => handleDarkColorChange("borderColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Header BG"
                    value={formData.theme.dark?.headerBg ?? "#0F172A"}
                    onChange={(v) => handleDarkColorChange("headerBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Dark Header Text"
                    value={formData.theme.dark?.headerText ?? "#F8FAFC"}
                    onChange={(v) => handleDarkColorChange("headerText", v)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Advanced Colors */}
              <div className="pt-1">
                <SectionTitle>Advanced Colours</SectionTitle>
                <p className="text-xs text-admin-text-muted mt-0.5 mb-3">
                  Fine-tune individual UI zones. Leave blank to inherit the primary/secondary colours.
                </p>

                {/* Card Background */}
                <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2 mt-4">Card Background</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
                  <ColorInput
                    label="Card BG (Light)"
                    value={formData.theme.cardBg ?? formData.theme.backgroundColor}
                    onChange={(v) => handleColorChange("cardBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Card BG (Dark)"
                    value={formData.theme.dark?.cardBg ?? formData.theme.dark?.backgroundColor ?? "#111827"}
                    onChange={(v) => handleDarkColorChange("cardBg", v)}
                    disabled={loading}
                  />
                </div>

                {/* Newsletter Section */}
                <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2 mt-4">Newsletter Section</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
                  <ColorInput
                    label="BG (Light)"
                    value={formData.theme.newsletterBg ?? formData.theme.primaryColor}
                    onChange={(v) => handleColorChange("newsletterBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="BG (Dark)"
                    value={formData.theme.dark?.newsletterBg ?? formData.theme.dark?.primaryColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleDarkColorChange("newsletterBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Text (Light)"
                    value={formData.theme.newsletterText ?? "#FFFFFF"}
                    onChange={(v) => handleColorChange("newsletterText", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Text (Dark)"
                    value={formData.theme.dark?.newsletterText ?? "#FFFFFF"}
                    onChange={(v) => handleDarkColorChange("newsletterText", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Button BG (Light)"
                    value={formData.theme.newsletterBtnBg ?? "#FFFFFF"}
                    onChange={(v) => handleColorChange("newsletterBtnBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Button BG (Dark)"
                    value={formData.theme.dark?.newsletterBtnBg ?? "#1F2937"}
                    onChange={(v) => handleDarkColorChange("newsletterBtnBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Button Text (Light)"
                    value={formData.theme.newsletterBtnText ?? formData.theme.primaryColor}
                    onChange={(v) => handleColorChange("newsletterBtnText", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Button Text (Dark)"
                    value={formData.theme.dark?.newsletterBtnText ?? formData.theme.dark?.primaryColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleDarkColorChange("newsletterBtnText", v)}
                    disabled={loading}
                  />
                </div>

                {/* Products & Prices */}
                <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2 mt-4">Products &amp; Prices</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-1">
                  <ColorInput
                    label="Price (Light)"
                    value={formData.theme.priceColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleColorChange("priceColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Price (Dark)"
                    value={formData.theme.dark?.priceColor ?? formData.theme.dark?.primaryColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleDarkColorChange("priceColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Sale Badge BG (Light)"
                    value={formData.theme.saleBadgeBg ?? "#EF4444"}
                    onChange={(v) => handleColorChange("saleBadgeBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Sale Badge BG (Dark)"
                    value={formData.theme.dark?.saleBadgeBg ?? "#DC2626"}
                    onChange={(v) => handleDarkColorChange("saleBadgeBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Sale Badge Text (Light)"
                    value={formData.theme.saleBadgeText ?? "#FFFFFF"}
                    onChange={(v) => handleColorChange("saleBadgeText", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Sale Badge Text (Dark)"
                    value={formData.theme.dark?.saleBadgeText ?? "#FFFFFF"}
                    onChange={(v) => handleDarkColorChange("saleBadgeText", v)}
                    disabled={loading}
                  />
                </div>

                {/* Footer */}
                <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2 mt-4">Footer</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
                  <ColorInput
                    label="Footer BG (Light)"
                    value={formData.theme.footerBg ?? formData.theme.headerBg}
                    onChange={(v) => handleColorChange("footerBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Footer BG (Dark)"
                    value={formData.theme.dark?.footerBg ?? formData.theme.dark?.headerBg ?? "#0F172A"}
                    onChange={(v) => handleDarkColorChange("footerBg", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Footer Text (Light)"
                    value={formData.theme.footerText ?? formData.theme.headerText}
                    onChange={(v) => handleColorChange("footerText", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Footer Text (Dark)"
                    value={formData.theme.dark?.footerText ?? formData.theme.dark?.headerText ?? "#F8FAFC"}
                    onChange={(v) => handleDarkColorChange("footerText", v)}
                    disabled={loading}
                  />
                </div>

                {/* Links */}
                <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2 mt-4">Links</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-1">
                  <ColorInput
                    label="Link (Light)"
                    value={formData.theme.linkColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleColorChange("linkColor", v)}
                    disabled={loading}
                  />
                  <ColorInput
                    label="Link (Dark)"
                    value={formData.theme.dark?.linkColor ?? formData.theme.dark?.primaryColor ?? formData.theme.primaryColor}
                    onChange={(v) => handleDarkColorChange("linkColor", v)}
                    disabled={loading}
                  />
                </div>
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
                  className="rounded-xl overflow-hidden border border-admin-border shadow-sm text-xs"
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
                        className="aspect-square flex flex-col items-center justify-center gap-1 border border-admin-border bg-admin-surface shadow-sm"
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
                <p className="text-xs text-admin-text-subtle mt-0.5">
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
              <div className="flex gap-1 border-b border-admin-border">
                {formData.supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeLang === lang
                        ? "border-gray-900 text-admin-text-primary"
                        : "border-transparent text-admin-text-muted hover:text-admin-text-secondary"
                    }`}
                  >
                    {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {heroBanners.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-admin-border rounded-xl text-center">
                <ImageIcon size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-medium text-admin-text-muted">
                  No banners yet
                </p>
                <p className="text-xs text-admin-text-subtle mt-1">
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
                      className="border border-admin-border rounded-xl overflow-hidden"
                    >
                      {/* Banner header row */}
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-admin-surface-raised cursor-pointer hover:bg-admin-chip transition-colors"
                        onClick={() =>
                          setExpandedBanner(isExpanded ? null : index)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-admin-text-secondary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-admin-text-secondary">
                              {hasTitle || `Banner ${index + 1}`}
                            </p>
                            {banner.image && (
                              <p className="text-xs text-admin-text-subtle truncate max-w-xs">
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
                            className="p-1.5 text-admin-text-subtle hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-admin-text-subtle" />
                          ) : (
                            <ChevronDown size={16} className="text-admin-text-subtle" />
                          )}
                        </div>
                      </div>

                      {/* Banner fields */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 border-t border-admin-border">
                          <ImageInput
                            label="Banner image"
                            value={banner.image}
                            onChange={(url) =>
                              handleBannerField(index, "image", url)
                            }
                            storeId={store._id}
                            folder="banners"
                            aspect="16/9"
                            disabled={loading}
                          />

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
              <p className="text-xs text-admin-text-subtle">
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
              <div className="w-full h-48 rounded-xl bg-admin-surface-raised border-2 border-dashed border-admin-border flex flex-col items-center justify-center text-admin-text-subtle gap-2">
                <Phone size={24} />
                <p className="text-sm font-medium">Contact info</p>
                <p className="text-xs text-center px-4">Fill in your store&apos;s contact details on the left.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SOCIAL ORDERING TAB ── */}
        {activeTab === "socialOrdering" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* WhatsApp */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.523 5.855L.058 23.675l5.97-1.525A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.796 9.796 0 01-5.244-1.517l-.376-.224-3.898.997 1.04-3.8-.246-.39A9.773 9.773 0 012.18 12c0-5.414 4.406-9.82 9.82-9.82 5.414 0 9.82 4.406 9.82 9.82 0 5.414-4.406 9.82-9.82 9.82z" />
                  </svg>
                </div>
                <div>
                  <SectionTitle>WhatsApp Ordering</SectionTitle>
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    Let customers order directly via WhatsApp message.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.socialOrdering.whatsapp.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialOrdering: {
                        ...prev.socialOrdering,
                        whatsapp: {
                          ...prev.socialOrdering.whatsapp,
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                  disabled={loading}
                  className="w-5 h-5 rounded border-admin-border-md text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-admin-text-secondary">
                  Enable WhatsApp order button on product pages
                </span>
              </label>

              {formData.socialOrdering.whatsapp.enabled && (
                <div className="space-y-4 pl-8 border-l-2 border-green-200">
                  <Field
                    label="WhatsApp Phone Number"
                    hint="International format with country code, e.g. +8801712345678"
                    required
                  >
                    <input
                      type="tel"
                      value={formData.socialOrdering.whatsapp.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialOrdering: {
                            ...prev.socialOrdering,
                            whatsapp: {
                              ...prev.socialOrdering.whatsapp,
                              phoneNumber: e.target.value,
                            },
                          },
                        }))
                      }
                      className={inputCls}
                      disabled={loading}
                      placeholder="+8801712345678"
                    />
                  </Field>

                  <Field
                    label="Message Template"
                    hint="Use the placeholders below. Each list item on its own line will render as a bullet on WhatsApp."
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {WHATSAPP_TEMPLATE_PLACEHOLDERS.map((token) => (
                          <button
                            key={token}
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                socialOrdering: {
                                  ...prev.socialOrdering,
                                  whatsapp: {
                                    ...prev.socialOrdering.whatsapp,
                                    messageTemplate:
                                      (prev.socialOrdering.whatsapp.messageTemplate || "") +
                                      token,
                                  },
                                },
                              }))
                            }
                            className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-admin-chip hover:bg-admin-surface-hover text-admin-text-secondary transition-colors disabled:opacity-50"
                          >
                            {token}
                          </button>
                        ))}
                        <span className="flex-1" />
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              socialOrdering: {
                                ...prev.socialOrdering,
                                whatsapp: {
                                  ...prev.socialOrdering.whatsapp,
                                  messageTemplate: WHATSAPP_EXAMPLE_TEMPLATE,
                                },
                              },
                            }))
                          }
                          className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
                        >
                          Insert example
                        </button>
                      </div>

                      <textarea
                        value={formData.socialOrdering.whatsapp.messageTemplate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            socialOrdering: {
                              ...prev.socialOrdering,
                              whatsapp: {
                                ...prev.socialOrdering.whatsapp,
                                messageTemplate: e.target.value,
                              },
                            },
                          }))
                        }
                        className={`${inputCls} font-mono text-xs leading-relaxed`}
                        rows={8}
                        disabled={loading}
                        placeholder={WHATSAPP_EXAMPLE_TEMPLATE}
                      />

                      <p className="text-[11px] text-admin-text-subtle">
                        Leave blank to use the default bulleted template. The same message is
                        copied to the clipboard when customers tap the Facebook button.
                      </p>
                    </div>
                  </Field>
                </div>
              )}
            </div>

            {/* Facebook */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <SectionTitle>Facebook Ordering</SectionTitle>
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    Let customers reach your Facebook page to place orders.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.socialOrdering.facebook.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialOrdering: {
                        ...prev.socialOrdering,
                        facebook: {
                          ...prev.socialOrdering.facebook,
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                  disabled={loading}
                  className="w-5 h-5 rounded border-admin-border-md text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-admin-text-secondary">
                  Enable Facebook order button on product pages
                </span>
              </label>

              {formData.socialOrdering.facebook.enabled && (
                <div className="space-y-4 pl-8 border-l-2 border-blue-200">
                  <Field
                    label="Facebook Page URL"
                    hint="Your Facebook page or Messenger link, e.g. https://m.me/yourpage"
                    required
                  >
                    <input
                      type="url"
                      value={formData.socialOrdering.facebook.pageUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          socialOrdering: {
                            ...prev.socialOrdering,
                            facebook: {
                              ...prev.socialOrdering.facebook,
                              pageUrl: e.target.value,
                            },
                          },
                        }))
                      }
                      className={inputCls}
                      disabled={loading}
                      placeholder="https://m.me/yourpage"
                    />
                  </Field>
                </div>
              )}
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
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    Controls how your store appears in Google search results.
                  </p>
                </div>
                {multiLang && (
                  <div className="flex gap-1 border border-admin-border rounded-lg p-0.5 bg-admin-surface-raised">
                    {formData.supportedLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          activeLang === lang
                            ? "bg-admin-surface text-admin-text-primary shadow-sm"
                            : "text-admin-text-muted hover:text-admin-text-secondary"
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
                <p className="text-xs text-admin-text-subtle mt-1 text-right">
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
                <p className="text-xs text-admin-text-subtle mt-1 text-right">
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

              <ImageInput
                label="Social share image (Open Graph)"
                value={formData.seo.ogImage}
                onChange={(url) =>
                  setFormData((prev) => ({
                    ...prev,
                    seo: { ...prev.seo, ogImage: url },
                  }))
                }
                storeId={store._id}
                folder="stores"
                aspect="16/9"
                hint="Shown when your store is shared on Facebook, Twitter, Slack, etc. 1200×630 recommended."
                disabled={loading}
              />
            </div>

            {/* Right — SERP Preview (always visible) */}
            <div className="lg:col-span-2">
              <SectionTitle>Search Preview</SectionTitle>
              <div className="mt-3 rounded-xl border border-admin-border bg-admin-surface-raised p-5 space-y-0.5">
                <p className="text-[15px] text-blue-700 font-medium leading-snug">
                  {formData.seo.title[activeLang] || (
                    <span className="text-admin-text-subtle italic">Page title</span>
                  )}
                </p>
                <p className="text-xs text-green-700">
                  {store.domains[0] || "mystore.com"}
                </p>
                <p className="text-sm text-admin-text-secondary leading-relaxed mt-1">
                  {formData.seo.description[activeLang] || (
                    <span className="text-admin-text-subtle italic">
                      Meta description will appear here once you fill in the field on the left.
                    </span>
                  )}
                </p>
              </div>
              {formData.seo.keywords && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-admin-text-muted mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.seo.keywords.split(",").map((kw, i) => {
                      const k = kw.trim();
                      return k ? (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-admin-chip border border-admin-border text-admin-text-secondary text-xs rounded-md"
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
        {/* ── LOYALTY TAB ── */}
        {activeTab === "loyalty" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <SectionTitle>Earning &amp; Redemption Rules</SectionTitle>
                <p className="text-xs text-admin-text-subtle mt-1">
                  Customers earn points when their reviews are approved and can
                  redeem them into coupons on their account page.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-admin-border bg-admin-surface-raised cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.pointsConfig.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pointsConfig: {
                        ...prev.pointsConfig,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  disabled={loading}
                  className="w-5 h-5 rounded border-admin-border-md text-admin-text-primary focus:ring-gray-900 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-admin-text-secondary">
                    Points earning enabled
                  </p>
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    When off, review approvals don&apos;t award points. Existing
                    balances stay intact and can still be redeemed.
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field
                  label="Points per review"
                  hint="Awarded when a review is approved"
                >
                  <input
                    type="number"
                    min={0}
                    value={formData.pointsConfig.pointsPerReview}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsConfig: {
                          ...prev.pointsConfig,
                          pointsPerReview: Math.max(
                            0,
                            parseInt(e.target.value || "0", 10)
                          ),
                        },
                      }))
                    }
                    className={inputCls}
                    disabled={loading}
                  />
                </Field>

                <Field
                  label="Minimum redemption"
                  hint="Smallest redeemable amount"
                >
                  <input
                    type="number"
                    min={1}
                    value={formData.pointsConfig.minRedemptionPoints}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsConfig: {
                          ...prev.pointsConfig,
                          minRedemptionPoints: Math.max(
                            1,
                            parseInt(e.target.value || "1", 10)
                          ),
                        },
                      }))
                    }
                    className={inputCls}
                    disabled={loading}
                  />
                </Field>

                <Field
                  label="Points per ৳1"
                  hint={`${formData.pointsConfig.pointsPerBdt} pts = ৳1`}
                >
                  <input
                    type="number"
                    min={1}
                    value={formData.pointsConfig.pointsPerBdt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsConfig: {
                          ...prev.pointsConfig,
                          pointsPerBdt: Math.max(
                            1,
                            parseInt(e.target.value || "1", 10)
                          ),
                        },
                      }))
                    }
                    className={inputCls}
                    disabled={loading}
                  />
                </Field>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <SectionTitle>How it looks</SectionTitle>
              <div className="mt-3 rounded-xl border border-admin-border bg-admin-surface-raised p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-admin-text-secondary">
                      {formData.pointsConfig.enabled
                        ? "Earning active"
                        : "Earning paused"}
                    </p>
                    <p className="text-xs text-admin-text-muted">
                      {formData.pointsConfig.pointsPerReview} pts · per review
                    </p>
                  </div>
                </div>
                <div className="border-t border-admin-border" />
                <div className="text-xs text-admin-text-secondary space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-admin-text-subtle">Min redemption</span>
                    <span className="font-medium">
                      {formData.pointsConfig.minRedemptionPoints} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-text-subtle">Conversion rate</span>
                    <span className="font-medium">
                      {formData.pointsConfig.pointsPerBdt} pts = ৳1
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-text-subtle">Min redemption value</span>
                    <span className="font-medium">
                      ৳
                      {Math.floor(
                        formData.pointsConfig.minRedemptionPoints /
                          Math.max(1, formData.pointsConfig.pointsPerBdt)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer — Save Button */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border bg-admin-surface-raised">
        <p className="text-xs text-admin-text-subtle">
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
  "w-full px-3 py-2 text-sm border border-admin-border-md rounded-lg bg-admin-surface focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow placeholder:text-admin-text-subtle disabled:opacity-50 disabled:bg-admin-surface-raised";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-admin-text-subtle uppercase tracking-wider">
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
      <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-admin-text-subtle mt-1">{hint}</p>}
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
      <label className="block text-xs font-medium text-admin-text-muted mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-9 h-9 rounded-lg border border-admin-border cursor-pointer p-0.5 bg-admin-surface disabled:opacity-50"
            title={`Pick ${label} colour`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-2 text-xs border border-admin-border rounded-lg font-mono bg-admin-surface focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          disabled={disabled}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
