import { Types } from "mongoose";
import type { Permission } from "@/shared/lib/permissions";

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

export interface IUser {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  addresses: IAddress[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Omit<IUser, "_id" | "storeId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
}

export interface IAdminUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "manager";
  assignedStores: string[];
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminUserDocument extends Omit<IAdminUser, "_id" | "assignedStores"> {
  _id: Types.ObjectId;
  assignedStores: Types.ObjectId[];
}

export interface JwtCustomerPayload {
  userId: string;
  storeId: string;
  email: string;
  type: "customer";
}

export interface JwtAdminPayload {
  adminId: string;
  role: "superadmin" | "manager";
  permissions: Permission[];
  assignedStores: string[];
  type: "admin";
}

export type JwtPayload = JwtCustomerPayload | JwtAdminPayload;
