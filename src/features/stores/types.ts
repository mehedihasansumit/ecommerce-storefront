import { Types } from "mongoose";
import type { LocalizedString } from "@/shared/types/i18n";

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
  borderRadius: string;
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
  dark?: IStoreDarkTheme;
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
  favicon: string;
  theme: IStoreTheme;
  heroLayout?: HeroLayoutStyle;
  heroBanners: IHeroBanner[];
  seo: IStoreSeo;
  payment: IStorePayment;
  contact: IStoreContact;
  socialLinks: IStoreSocialLinks;
  socialOrdering: IStoreSocialOrdering;
  pointsConfig: IStorePointsConfig;
  refundPolicy: IStoreRefundPolicy;
  supportedLanguages: string[];
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreDocument extends Omit<IStore, "_id"> {
  _id: Types.ObjectId;
}
