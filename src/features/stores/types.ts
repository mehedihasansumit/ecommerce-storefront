import { Types } from "mongoose";
import type { LocalizedString } from "@/shared/types/i18n";

export interface IStoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headerBg: string;
  headerText: string;
  fontFamily: string;
  borderRadius: string;
  layoutStyle: "grid" | "list" | "masonry";
}

export interface IHeroBanner {
  image: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  linkUrl?: string;
  linkText?: string;
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

export interface IStore {
  _id: string;
  name: string;
  slug: string;
  domains: string[];
  isActive: boolean;
  logo: string;
  favicon: string;
  theme: IStoreTheme;
  heroBanners: IHeroBanner[];
  seo: IStoreSeo;
  payment: IStorePayment;
  contact: IStoreContact;
  socialLinks: IStoreSocialLinks;
  socialOrdering: IStoreSocialOrdering;
  pointsConfig: IStorePointsConfig;
  supportedLanguages: string[];
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreDocument extends Omit<IStore, "_id"> {
  _id: Types.ObjectId;
}
