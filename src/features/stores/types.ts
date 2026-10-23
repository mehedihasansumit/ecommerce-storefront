import type { LocalizedString } from "@/shared/types/i18n";
import type { IStoreDeliveryConfig } from "@/shared/lib/delivery";
import type { IStoreStyles } from "./styles";
import type { IStoreMotion } from "./motion";

export type { IStoreDeliveryConfig };
export type { IStoreStyles };
export type { IStoreMotion };

export interface IStoreDarkTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  headerBg?: string;
  headerText?: string;
  newsletterBg?: string;
  newsletterText?: string;
  newsletterBtnBg?: string;
  newsletterBtnText?: string;
  priceColor?: string;
  saleBadgeBg?: string;
  saleBadgeText?: string;
  footerBg?: string;
  footerText?: string;
  linkColor?: string;
  cardBg?: string;
  /** Pinned global colours (PINNABLE_DERIVED_TOKENS); normally unset. */
  successColor?: string;
  errorColor?: string;
  /** Base colour of the hero scrim; derived from the darkest brand colour when unset. */
  heroScrim?: string;
}

// NOTE: Color tokens here mirror `THEME_TOKENS` in ./theme-tokens.ts.
// When adding a color, also add it to that registry — the registry drives
// form rendering, CSS-var injection, defaults, and Zod field set.
export interface IStoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  surfaceColor?: string;
  borderColor?: string;
  headerBg: string;
  headerText: string;
  fontFamily: string;
  /** Optional display face for headings (Google Font family). Falls back to `fontFamily`. */
  headingFont?: string;
  borderRadius: string;
  /** Storefront page background texture. Default "grid" (graph-paper lines). */
  backgroundPattern?: "grid" | "none";
  layoutStyle: "grid" | "list" | "masonry";
  newsletterBg?: string;
  newsletterText?: string;
  newsletterBtnBg?: string;
  newsletterBtnText?: string;
  priceColor?: string;
  saleBadgeBg?: string;
  saleBadgeText?: string;
  footerBg?: string;
  footerText?: string;
  linkColor?: string;
  cardBg?: string;
  /** Pinned global colours (PINNABLE_DERIVED_TOKENS); normally unset. */
  successColor?: string;
  errorColor?: string;
  /** Base colour of the hero scrim; derived from the darkest brand colour when unset. */
  heroScrim?: string;
  dark?: IStoreDarkTheme;
  /**
   * Theme Preset id (src/features/stores/presets.ts). The storefront renders
   * defaults ← preset ← the values set here (resolveTheme); explicit values win.
   */
  preset?: string;
  /** Style Switch choices (src/features/stores/styles.ts); unset = the preset's, else the base layout. */
  styles?: IStoreStyles;
  /** Home auto-scroll on/off (src/features/stores/motion.ts); unset = on. Not set by presets. */
  motion?: IStoreMotion;
}

export type HeroLayoutStyle =
  | "slider"
  | "split"
  | "centered"
  | "grid"
  | "minimal"
  | "image";

export interface IHeroBanner {
  image: string;
  /** Pre-generated responsive variants (w400/w800/w1200/w2000 → URL) for native srcSet. */
  variants?: Record<string, string>;
  /** Tiny inline LQIP shown while the full image loads. */
  blurDataURL?: string;
  width?: number;
  height?: number;
  /**
   * Optional looping background video (mp4 URL). Muted, decorative; `image`
   * (+ variants/blurDataURL) stays the poster, LCP element and fallback.
   */
  video?: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  linkUrl?: string;
  linkText?: string;
  showOverlay?: boolean;
}

export interface IStoreSeo {
  title: LocalizedString;
  description: LocalizedString;
  keywords: string[];
  ogImage: string;
}

export interface IStorePayment {
  provider: "stripe" | "sslcommerz";
  stripePublicKey: string;
  stripeSecretKey: string;
  sslcommerzStoreId: string;
  sslcommerzStorePassword: string;
  currency: string;
}

export interface IStoreContact {
  email: string;
  phone: string;
  phones?: string[];
  address: string;
}

export interface IStoreSocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
}

export interface IStoreSocialOrdering {
  whatsapp: {
    enabled: boolean;
    phoneNumber: string;
    messageTemplate: string;
  };
  facebook: {
    enabled: boolean;
    pageUrl: string;
  };
}

export interface IStorePointsConfig {
  enabled: boolean;
  pointsPerReview: number;
  minRedemptionPoints: number;
  pointsPerBdt: number;
}

export interface IStoreRefundPolicy {
  enabled: boolean;
  windowDays: number;
  description: string;
  autoApprove: boolean;
}

export interface IStore {
  _id: string;
  name: string;
  slug: string;
  domains: string[];
  isActive: boolean;
  logo: string;
  logoDark?: string;
  favicon: string;
  faviconDark?: string;
  theme: IStoreTheme;
  heroLayout?: HeroLayoutStyle;
  heroContained?: boolean;
  heroBorderRadius?: string;
  heroBanners: IHeroBanner[];
  seo: IStoreSeo;
  payment: IStorePayment;
  contact: IStoreContact;
  socialLinks: IStoreSocialLinks;
  socialOrdering: IStoreSocialOrdering;
  pointsConfig: IStorePointsConfig;
  refundPolicy: IStoreRefundPolicy;
  deliveryConfig: IStoreDeliveryConfig;
  supportedLanguages: string[];
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

