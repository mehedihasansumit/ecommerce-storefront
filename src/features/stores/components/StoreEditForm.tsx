"use client";

import { Fragment, useState } from "react";
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
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Sparkles,
  RotateCcw,
  Info,
  Truck,
} from "lucide-react";
import type { IStore, HeroLayoutStyle, IStoreTheme } from "@/features/stores/types";
import type { LocalizedString } from "@/shared/types/i18n";
import { toLocalized } from "@/shared/lib/i18n";
import { ImageInput } from "@/shared/components/ui";
import {
  THEME_TOKEN_GROUPS,
  THEME_PRESETS,
  getTokensByGroup,
  getPresetSwatches,
  type ThemeTokenDef,
  type ThemeTokenGroup,
  type ThemePreset,
} from "@/features/stores/theme-tokens";

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
  variants?: Record<string, string>;
  blurDataURL?: string;
  width?: number;
  height?: number;
  title: LocalizedString;
  subtitle: LocalizedString;
  linkUrl: string;
  linkText: string;
  showOverlay: boolean;
}

type Tab =
  | "general"
  | "theme"
  | "banners"
  | "contact"
  | "socialOrdering"
  | "seo"
  | "loyalty"
  | "refundPolicy"
  | "delivery";

const STORE_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "socialOrdering", label: "Social Ordering", icon: MessageCircle },
  { id: "seo", label: "SEO", icon: Search },
  { id: "refundPolicy", label: "Refund Policy", icon: RotateCcw },
  { id: "delivery", label: "Delivery", icon: Truck },
];

const LOYALTY_TAB: { id: Tab; label: string; icon: React.ElementType } = {
  id: "loyalty",
  label: "Loyalty Points",
  icon: Sparkles,
};

const HERO_LAYOUTS: {
  id: HeroLayoutStyle;
  label: string;
  description: string;
  Preview: () => React.ReactElement;
}[] = [
  {
    id: "slider",
    label: "Full Slider",
    description: "Auto-rotating full-width image slides",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#E5E7EB" />
        <rect width="120" height="68" fill="#6B7280" opacity="0.15" />
        <rect x="8" y="10" width="104" height="48" rx="3" fill="#9CA3AF" opacity="0.5" />
        <rect x="24" y="22" width="50" height="7" rx="2" fill="#fff" opacity="0.9" />
        <rect x="24" y="33" width="35" height="4" rx="2" fill="#fff" opacity="0.6" />
        <rect x="24" y="42" width="22" height="7" rx="2" fill="#374151" opacity="0.8" />
        {/* dots */}
        <circle cx="54" cy="62" r="2" fill="#6B7280" opacity="0.5" />
        <circle cx="60" cy="62" r="2.5" fill="#374151" />
        <circle cx="66" cy="62" r="2" fill="#6B7280" opacity="0.5" />
        {/* arrows */}
        <circle cx="14" cy="34" r="6" fill="#fff" opacity="0.7" />
        <path d="M15.5 31l-3 3 3 3" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="106" cy="34" r="6" fill="#fff" opacity="0.7" />
        <path d="M104.5 31l3 3-3 3" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "split",
    label: "Split",
    description: "Image on left, text on right",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#E5E7EB" />
        {/* left image half */}
        <rect width="60" height="68" fill="#9CA3AF" opacity="0.4" />
        <rect x="12" y="20" width="36" height="28" rx="2" fill="#9CA3AF" opacity="0.6" />
        {/* right text half */}
        <rect x="68" y="16" width="40" height="6" rx="2" fill="#374151" opacity="0.7" />
        <rect x="68" y="26" width="34" height="4" rx="2" fill="#6B7280" opacity="0.5" />
        <rect x="68" y="33" width="30" height="4" rx="2" fill="#6B7280" opacity="0.4" />
        <rect x="68" y="44" width="24" height="8" rx="2" fill="#374151" opacity="0.75" />
        {/* divider */}
        <line x1="60" y1="0" x2="60" y2="68" stroke="#D1D5DB" strokeWidth="1" />
      </svg>
    ),
  },
  {
    id: "centered",
    label: "Centered",
    description: "Text overlay centered on image",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#9CA3AF" opacity="0.5" />
        {/* overlay gradient */}
        <rect width="120" height="68" fill="url(#cg)" />
        <defs>
          <linearGradient id="cg" x1="60" y1="0" x2="60" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#000" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* centered text */}
        <rect x="30" y="18" width="60" height="7" rx="2" fill="#fff" opacity="0.95" />
        <rect x="38" y="29" width="44" height="4" rx="2" fill="#fff" opacity="0.7" />
        <rect x="44" y="40" width="32" height="8" rx="3" fill="#fff" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: "grid",
    label: "Grid",
    description: "One large + two smaller side panels",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#E5E7EB" />
        {/* large left */}
        <rect x="4" y="4" width="72" height="60" rx="3" fill="#9CA3AF" opacity="0.5" />
        <rect x="12" y="22" width="40" height="6" rx="2" fill="#fff" opacity="0.9" />
        <rect x="12" y="32" width="28" height="4" rx="2" fill="#fff" opacity="0.6" />
        <rect x="12" y="42" width="20" height="7" rx="2" fill="#374151" opacity="0.75" />
        {/* top-right small */}
        <rect x="80" y="4" width="36" height="28" rx="3" fill="#9CA3AF" opacity="0.4" />
        <rect x="86" y="13" width="20" height="4" rx="2" fill="#fff" opacity="0.8" />
        {/* bottom-right small */}
        <rect x="80" y="36" width="36" height="28" rx="3" fill="#9CA3AF" opacity="0.35" />
        <rect x="86" y="45" width="20" height="4" rx="2" fill="#fff" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "image",
    label: "Image Only",
    description: "Pure banner, no text overlay",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#9CA3AF" opacity="0.5" />
        {/* subtle landscape scene to imply full photo */}
        <rect y="44" width="120" height="24" fill="#6B7280" opacity="0.3" />
        <circle cx="90" cy="20" r="12" fill="#FCD34D" opacity="0.6" />
        {/* no text at all */}
        {/* nav dots only */}
        <circle cx="54" cy="62" r="1.5" fill="#fff" opacity="0.4" />
        <circle cx="60" cy="62" r="2" fill="#fff" opacity="0.85" />
        <circle cx="66" cy="62" r="1.5" fill="#fff" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Full bleed image, text at bottom",
    Preview: () => (
      <svg viewBox="0 0 120 68" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="68" fill="#9CA3AF" opacity="0.45" />
        {/* bottom text bar */}
        <rect y="46" width="120" height="22" fill="#111827" opacity="0.75" />
        <rect x="8" y="51" width="55" height="6" rx="2" fill="#fff" opacity="0.95" />
        <rect x="8" y="61" width="36" height="4" rx="2" fill="#fff" opacity="0.6" />
        <rect x="92" y="53" width="22" height="9" rx="3" fill="#fff" opacity="0.85" />
      </svg>
    ),
  },
];

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
        secondaryColor:    store.theme.dark?.secondaryColor,
        accentColor:       store.theme.dark?.accentColor,
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
    logoDark: store.logoDark || "",
    favicon: store.favicon || "",
    faviconDark: store.faviconDark || "",
    contact: {
      email: store.contact?.email || "",
      phone: store.contact?.phone || "",
      phones: store.contact?.phones || [],
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
    heroLayout: (store.heroLayout || "slider") as HeroLayoutStyle,
    heroContained: store.heroContained ?? false,
    heroBorderRadius: store.heroBorderRadius ?? "",
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
    refundPolicy: {
      enabled: store.refundPolicy?.enabled ?? false,
      windowDays: store.refundPolicy?.windowDays ?? 7,
      description: store.refundPolicy?.description ?? "",
      autoApprove: store.refundPolicy?.autoApprove ?? false,
    },
    deliveryConfig: {
      enabled: store.deliveryConfig?.enabled ?? false,
      insideDhakaCharge: store.deliveryConfig?.insideDhakaCharge ?? 0,
      outsideDhakaCharge: store.deliveryConfig?.outsideDhakaCharge ?? 0,
    },
  });

  const [heroBanners, setHeroBanners] = useState<BannerState[]>(
    (store.heroBanners || []).map((b) => ({
      image: b.image,
      variants: b.variants,
      blurDataURL: b.blurDataURL,
      width: b.width,
      height: b.height,
      title: toLocalized(b.title),
      subtitle: toLocalized(b.subtitle),
      linkUrl: b.linkUrl || "",
      linkText: b.linkText || "",
      showOverlay: b.showOverlay ?? true,
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

  const applyPreset = (preset: ThemePreset) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...preset.light,
        dark: { ...prev.theme.dark, ...preset.dark },
      } as typeof prev.theme,
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
        showOverlay: true,
      },
    ]);
    setExpandedBanner(newIndex);
  };

  const handleRemoveBanner = (index: number) => {
    setHeroBanners((prev) => prev.filter((_, i) => i !== index));
    setExpandedBanner(null);
  };

  const handleMoveBanner = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= heroBanners.length) return;
    setHeroBanners((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setExpandedBanner((cur) =>
      cur === index ? target : cur === target ? index : cur
    );
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

  // Banner image + its upload meta (responsive variants + blur). Clearing the image
  // (url "") drops the meta too so we never ship stale variants for a removed image.
  const handleBannerImage = (
    index: number,
    url: string,
    meta?: { variants?: Record<string, string>; blurDataURL?: string; width?: number; height?: number }
  ) => {
    setHeroBanners((prev) =>
      prev.map((b, i) =>
        i === index
          ? {
              ...b,
              image: url,
              variants: url ? meta?.variants : undefined,
              blurDataURL: url ? meta?.blurDataURL : undefined,
              width: url ? meta?.width : undefined,
              height: url ? meta?.height : undefined,
            }
          : b
      )
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

  const handleBannerOverlayToggle = (index: number, value: boolean) => {
    setHeroBanners((prev) =>
      prev.map((b, i) => (i === index ? { ...b, showOverlay: value } : b))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        payload.logoDark = formData.logoDark;
        payload.favicon = formData.favicon;
        payload.faviconDark = formData.faviconDark;
        payload.heroLayout = formData.heroLayout;
        payload.heroContained = formData.heroContained;
        payload.heroBorderRadius = formData.heroBorderRadius;
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
        payload.refundPolicy = formData.refundPolicy;
        payload.deliveryConfig = formData.deliveryConfig;
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
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <Check size={15} className="shrink-0" />
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
                    label="Logo (light)"
                    value={formData.logo}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, logo: url }))
                    }
                    storeId={store._id}
                    folder="stores"
                    aspect="auto"
                    hint="Shown in storefront header (light mode)."
                    disabled={loading}
                  />
                  <ImageInput
                    label="Logo (dark)"
                    value={formData.logoDark}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, logoDark: url }))
                    }
                    storeId={store._id}
                    folder="stores"
                    aspect="auto"
                    hint="Optional. Swapped in when dark mode is active."
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
                    kind="favicon"
                    hint="Browser tab icon. Any image — auto-fit to a 256×256 square PNG."
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
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
              {/* Preset palettes */}
              <div className="pt-1">
                <SectionTitle>Palette Presets</SectionTitle>
                <p className="text-xs text-admin-text-muted mt-0.5 mb-3">
                  One-click starting point. Replaces all colour fields. Tweak afterwards.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const swatches = getPresetSwatches(preset);
                    const isActive = formData.theme.primaryColor === preset.light.primaryColor;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        disabled={loading}
                        title={preset.description}
                        className={`group text-left rounded-lg border p-3 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isActive
                            ? "border-admin-text-primary ring-2 ring-admin-text-primary/20 bg-admin-chip"
                            : "border-admin-border-md bg-admin-surface hover:border-admin-text-subtle"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${preset.light.backgroundColor} 0%, ${preset.light.surfaceColor} 100%)`,
                        }}
                      >
                        <div className="flex items-center gap-1 mb-2">
                          {swatches.map((c, i) => (
                            <span
                              key={i}
                              className="w-5 h-5 rounded-full border border-white/80 shadow-sm"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div
                          className="text-sm font-semibold leading-tight"
                          style={{ color: preset.light.textColor }}
                        >
                          {preset.name}
                        </div>
                        <div
                          className="text-[11px] mt-0.5 line-clamp-2"
                          style={{ color: preset.light.textColor, opacity: 0.7 }}
                        >
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const groups = getTokensByGroup();
                const orderedGroups = (Object.keys(THEME_TOKEN_GROUPS) as ThemeTokenGroup[])
                  .filter((g) => groups[g].length > 0);

                const resolveLight = (token: ThemeTokenDef): string => {
                  const direct = (formData.theme as Record<string, unknown>)[token.key];
                  if (typeof direct === "string" && direct) return direct;
                  if (token.fallbackChain) {
                    for (const fk of token.fallbackChain) {
                      const v = (formData.theme as Record<string, unknown>)[fk];
                      if (typeof v === "string" && v) return v;
                    }
                  }
                  return token.lightDefault ?? "";
                };

                const resolveDark = (token: ThemeTokenDef): string => {
                  const dark = formData.theme.dark as Record<string, unknown> | undefined;
                  const direct = dark?.[token.key];
                  if (typeof direct === "string" && direct) return direct;
                  if (token.fallbackChain) {
                    for (const fk of token.fallbackChain) {
                      const v = dark?.[fk];
                      if (typeof v === "string" && v) return v;
                      const lightV = (formData.theme as Record<string, unknown>)[fk];
                      if (typeof lightV === "string" && lightV) return lightV;
                    }
                  }
                  if (token.darkDefault) return token.darkDefault;
                  const lightDirect = (formData.theme as Record<string, unknown>)[token.key];
                  if (typeof lightDirect === "string" && lightDirect) return lightDirect;
                  return token.lightDefault ?? "";
                };

                return orderedGroups.map((groupKey) => {
                  const meta = THEME_TOKEN_GROUPS[groupKey];
                  const tokens = groups[groupKey];
                  return (
                    <div key={groupKey} className="pt-1">
                      <SectionTitle>{meta.label}</SectionTitle>
                      {meta.description && (
                        <p className="text-xs text-admin-text-muted mt-0.5 mb-3">
                          {meta.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {tokens.map((token) => (
                          <Fragment key={token.key}>
                            {token.editableLight && (
                              <ColorInput
                                label={`${token.label} (Light)`}
                                value={resolveLight(token)}
                                onChange={(v) =>
                                  handleColorChange(
                                    token.key as keyof IStoreTheme,
                                    v
                                  )
                                }
                                disabled={loading}
                              />
                            )}
                            {token.editableDark && (
                              <ColorInput
                                label={`${token.label} (Dark)`}
                                value={resolveDark(token)}
                                onChange={(v) =>
                                  handleDarkColorChange(token.key, v)
                                }
                                disabled={loading}
                              />
                            )}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}

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
          <div className="space-y-6">
            {/* Layout picker */}
            <div>
              <SectionTitle>Hero Section Layout</SectionTitle>
              <p className="text-xs text-admin-text-subtle mt-0.5 mb-3">
                Choose how banners are displayed on the storefront homepage.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {HERO_LAYOUTS.map((layout) => {
                  const selected = formData.heroLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          heroLayout: layout.id,
                        }))
                      }
                      disabled={loading}
                      className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                        selected
                          ? "border-gray-900 dark:border-gray-100 bg-gray-900/5 dark:bg-white/5"
                          : "border-admin-border bg-admin-surface hover:border-admin-border-md"
                      }`}
                    >
                      <div
                        className={`w-full rounded-lg overflow-hidden border ${
                          selected
                            ? "border-gray-900/20 dark:border-white/20"
                            : "border-admin-border"
                        }`}
                      >
                        <layout.Preview />
                      </div>
                      <div className="w-full">
                        <p
                          className={`text-xs font-semibold ${
                            selected
                              ? "text-admin-text-primary"
                              : "text-admin-text-secondary"
                          }`}
                        >
                          {layout.label}
                        </p>
                        <p className="text-[11px] text-admin-text-subtle leading-snug mt-0.5">
                          {layout.description}
                        </p>
                      </div>
                      {selected && (
                        <span className="self-start inline-flex items-center gap-1 text-[10px] font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white rounded-full px-2 py-0.5">
                          <Check size={9} />
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-admin-border" />

            {/* ── Banner Frame ── */}
            <div>
              <SectionTitle>Banner Frame</SectionTitle>
              <p className="text-xs text-admin-text-subtle mt-0.5 mb-3">
                Control banner width and corner rounding.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                    Width
                  </label>
                  <div className="inline-flex p-1 rounded-lg bg-admin-surface-raised border border-admin-border">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, heroContained: false }))
                      }
                      disabled={loading}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                        !formData.heroContained
                          ? "bg-gray-900 text-white"
                          : "text-admin-text-secondary hover:text-admin-text-primary"
                      }`}
                    >
                      Full-width
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, heroContained: true }))
                      }
                      disabled={loading}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                        formData.heroContained
                          ? "bg-gray-900 text-white"
                          : "text-admin-text-secondary hover:text-admin-text-primary"
                      }`}
                    >
                      Container
                    </button>
                  </div>
                  <p className="text-[11px] text-admin-text-subtle mt-1.5">
                    {formData.heroContained
                      ? "Banner is bounded by the page container with side padding."
                      : "Banner spans full viewport edge-to-edge."}
                  </p>
                </div>
                <Field label="Border Radius">
                  <input
                    type="text"
                    value={formData.heroBorderRadius}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        heroBorderRadius: e.target.value,
                      }))
                    }
                    placeholder="e.g. 12px, 1rem, 0"
                    className={inputCls}
                    disabled={loading}
                  />
                  <p className="text-[11px] text-admin-text-subtle mt-1.5">
                    Leave empty for sharp corners.
                  </p>
                </Field>
              </div>
            </div>

            <div className="border-t border-admin-border" />

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

            {/* Recommended dimensions hint */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
              <p>
                Recommended banner size:{" "}
                <span className="font-semibold">1920 × 1080 px</span> (16:9).
                Use a high-quality JPG or WebP under 300&nbsp;KB. Keep important
                content (text, logo) in the center &mdash; edges may be cropped
                on mobile.
              </p>
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
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-admin-text-secondary">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-admin-text-secondary truncate">
                              {hasTitle || `Banner ${index + 1}`}
                            </p>
                            {banner.image && (
                              <p className="text-xs text-admin-text-subtle truncate">
                                {banner.image}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0 pl-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBanner(index, "up");
                            }}
                            disabled={loading || index === 0}
                            aria-label="Move banner up"
                            className="p-1.5 text-admin-text-subtle hover:text-admin-text-secondary hover:bg-admin-chip rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBanner(index, "down");
                            }}
                            disabled={loading || index === heroBanners.length - 1}
                            aria-label="Move banner down"
                            className="p-1.5 text-admin-text-subtle hover:text-admin-text-secondary hover:bg-admin-chip rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={14} />
                          </button>
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
                            onChange={(url, meta) =>
                              handleBannerImage(index, url, meta)
                            }
                            storeId={store._id}
                            folder="banners"
                            aspect="16/9"
                            disabled={loading}
                          />

                          <label className="flex items-center justify-between gap-3 cursor-pointer select-none p-3 rounded-lg bg-admin-surface-raised border border-admin-border">
                            <div>
                              <p className="text-sm font-medium text-admin-text-secondary">
                                Show text overlay
                              </p>
                              <p className="text-xs text-admin-text-subtle mt-0.5">
                                Toggle off to display image only — hides title, subtitle, and button.
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={banner.showOverlay}
                              onChange={(e) =>
                                handleBannerOverlayToggle(index, e.target.checked)
                              }
                              disabled={loading}
                              className="w-5 h-5 rounded border-admin-border-md text-gray-900 focus:ring-gray-500 shrink-0"
                            />
                          </label>

                          {banner.showOverlay && (
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
                          )}
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
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                  Phone Numbers
                </label>
                <div className="space-y-2">
                  {(formData.contact.phones ?? []).map((ph, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={ph}
                        onChange={(e) => {
                          const updated = [...(formData.contact.phones ?? [])];
                          updated[i] = e.target.value;
                          setFormData((prev) => ({ ...prev, contact: { ...prev.contact, phones: updated } }));
                        }}
                        className={`${inputCls} flex-1`}
                        disabled={loading}
                        placeholder="+880 1700-000000"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.contact.phones ?? []).filter((_, idx) => idx !== i);
                          setFormData((prev) => ({ ...prev, contact: { ...prev.contact, phones: updated } }));
                        }}
                        className="p-1.5 rounded-lg text-admin-text-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                        disabled={loading}
                        aria-label="Remove number"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(formData.contact.phones ?? []).length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          contact: { ...prev.contact, phones: [...(prev.contact.phones ?? []), ""] },
                        }))
                      }
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-admin-border-md text-admin-text-subtle hover:text-admin-text-primary hover:border-admin-border transition-colors"
                      disabled={loading}
                    >
                      <Plus size={13} />
                      Add number
                    </button>
                  )}
                </div>
              </div>
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

        {/* ── REFUND POLICY TAB ── */}
        {activeTab === "refundPolicy" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <SectionTitle>Refund Policy Settings</SectionTitle>
                <p className="text-xs text-admin-text-subtle mt-1">
                  Control whether customers can request refunds and how they are handled.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-admin-border bg-admin-surface-raised cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.refundPolicy.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      refundPolicy: { ...prev.refundPolicy, enabled: e.target.checked },
                    }))
                  }
                  disabled={loading}
                  className="w-5 h-5 rounded border-admin-border-md text-admin-text-primary focus:ring-gray-900 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-admin-text-secondary">
                    Enable refund requests
                  </p>
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    When on, customers can submit refund requests from their order history.
                  </p>
                </div>
              </label>

              {formData.refundPolicy.enabled && (
                <div className="space-y-4 pl-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Refund window (days)"
                      hint="Orders older than this cannot be refunded"
                    >
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={formData.refundPolicy.windowDays}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            refundPolicy: {
                              ...prev.refundPolicy,
                              windowDays: Math.max(1, parseInt(e.target.value || "1", 10)),
                            },
                          }))
                        }
                        className={inputCls}
                        disabled={loading}
                      />
                    </Field>

                    <div className="flex flex-col justify-end pb-0.5">
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-admin-border bg-admin-surface-raised cursor-pointer select-none h-full">
                        <input
                          type="checkbox"
                          checked={formData.refundPolicy.autoApprove}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              refundPolicy: {
                                ...prev.refundPolicy,
                                autoApprove: e.target.checked,
                              },
                            }))
                          }
                          disabled={loading}
                          className="w-5 h-5 rounded border-admin-border-md text-admin-text-primary focus:ring-gray-900 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-admin-text-secondary">
                            Auto-approve refunds
                          </p>
                          <p className="text-xs text-admin-text-subtle mt-0.5">
                            Approve requests automatically without manual review.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Field
                    label="Policy description"
                    hint="Shown to customers before they submit a refund request"
                  >
                    <textarea
                      value={formData.refundPolicy.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          refundPolicy: {
                            ...prev.refundPolicy,
                            description: e.target.value,
                          },
                        }))
                      }
                      className={`${inputCls} resize-none`}
                      rows={4}
                      disabled={loading}
                      placeholder="Items must be unused and in original packaging. Refunds are processed within 5–7 business days."
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <SectionTitle>Policy Summary</SectionTitle>
              <div className="mt-3 rounded-xl border border-admin-border bg-admin-surface-raised p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.refundPolicy.enabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-admin-text-secondary">
                      {formData.refundPolicy.enabled ? "Refunds enabled" : "Refunds disabled"}
                    </p>
                    <p className="text-xs text-admin-text-muted">
                      {formData.refundPolicy.enabled
                        ? `${formData.refundPolicy.windowDays}-day window`
                        : "Customers cannot request refunds"}
                    </p>
                  </div>
                </div>
                {formData.refundPolicy.enabled && (
                  <>
                    <div className="border-t border-admin-border" />
                    <div className="text-xs text-admin-text-secondary space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-admin-text-subtle">Window</span>
                        <span className="font-medium">{formData.refundPolicy.windowDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-admin-text-subtle">Auto-approve</span>
                        <span className={`font-medium ${formData.refundPolicy.autoApprove ? "text-emerald-600" : "text-admin-text-secondary"}`}>
                          {formData.refundPolicy.autoApprove ? "Yes" : "No — manual review"}
                        </span>
                      </div>
                      {formData.refundPolicy.description && (
                        <div className="pt-1">
                          <p className="text-admin-text-subtle mb-1">Policy text</p>
                          <p className="text-admin-text-secondary leading-relaxed line-clamp-4">
                            {formData.refundPolicy.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "delivery" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <SectionTitle>Delivery Charges</SectionTitle>
                <p className="text-xs text-admin-text-subtle mt-1">
                  Charge a flat delivery fee at checkout based on the customer&apos;s
                  district. Inside Dhaka vs. anywhere else.
                </p>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-admin-border bg-admin-surface-raised cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.deliveryConfig.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryConfig: { ...prev.deliveryConfig, enabled: e.target.checked },
                    }))
                  }
                  disabled={loading}
                  className="w-5 h-5 rounded border-admin-border-md text-admin-text-primary focus:ring-gray-900 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-admin-text-secondary">
                    Enable delivery charges
                  </p>
                  <p className="text-xs text-admin-text-subtle mt-0.5">
                    When off, delivery is free for all orders.
                  </p>
                </div>
              </label>

              {formData.deliveryConfig.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Inside Dhaka (৳)"
                    hint="Applied when district is Dhaka"
                  >
                    <input
                      type="number"
                      min={0}
                      value={formData.deliveryConfig.insideDhakaCharge}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryConfig: {
                            ...prev.deliveryConfig,
                            insideDhakaCharge: Math.max(0, parseFloat(e.target.value || "0")),
                          },
                        }))
                      }
                      className={inputCls}
                      disabled={loading}
                    />
                  </Field>

                  <Field
                    label="Outside Dhaka (৳)"
                    hint="Applied for every other district"
                  >
                    <input
                      type="number"
                      min={0}
                      value={formData.deliveryConfig.outsideDhakaCharge}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryConfig: {
                            ...prev.deliveryConfig,
                            outsideDhakaCharge: Math.max(0, parseFloat(e.target.value || "0")),
                          },
                        }))
                      }
                      className={inputCls}
                      disabled={loading}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <SectionTitle>Summary</SectionTitle>
              <div className="mt-3 rounded-xl border border-admin-border bg-admin-surface-raised p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.deliveryConfig.enabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-admin-text-secondary">
                      {formData.deliveryConfig.enabled ? "Delivery charges on" : "Free delivery"}
                    </p>
                    <p className="text-xs text-admin-text-muted">
                      {formData.deliveryConfig.enabled
                        ? "Charged by district at checkout"
                        : "No delivery fee applied"}
                    </p>
                  </div>
                </div>
                {formData.deliveryConfig.enabled && (
                  <>
                    <div className="border-t border-admin-border" />
                    <div className="text-xs text-admin-text-secondary space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-admin-text-subtle">Inside Dhaka</span>
                        <span className="font-medium">৳{formData.deliveryConfig.insideDhakaCharge.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-admin-text-subtle">Outside Dhaka</span>
                        <span className="font-medium">৳{formData.deliveryConfig.outsideDhakaCharge.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
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
