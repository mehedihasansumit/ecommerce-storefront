import type { Permission } from "@/shared/lib/permissions";
import type { IRole } from "@/features/roles/types";

export type { Permission };

export interface IAddress {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface INotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface IAvatarPosition {
  x: number;
  y: number;
  zoom: number;
}

export interface IUser {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  avatarUrl: string | null;
  avatarPosition: IAvatarPosition;
  addresses: IAddress[];
  isActive: boolean;
  points: number;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}


export interface IAdminUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  assignedStores: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** AdminUser with its Role populated (returned by service layer) */
export interface IAdminUserWithRole extends IAdminUser {
  role: IRole;
}


export interface JwtCustomerPayload {
  userId: string;
  storeId: string;
  email: string;
  type: "customer";
}

export interface JwtAdminPayload {
  adminId: string;
  roleId: string;
  isSuperAdmin: boolean;
  permissions: Permission[];
  assignedStores: string[];
  type: "admin";
}

export type JwtPayload = JwtCustomerPayload | JwtAdminPayload;
