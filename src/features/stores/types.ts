import { Types } from "mongoose";

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
  title: string;
  subtitle?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface IStoreSeo {
  title: string;
  description: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreDocument extends Omit<IStore, "_id"> {
  _id: Types.ObjectId;
}
