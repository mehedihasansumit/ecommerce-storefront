import { Types } from "mongoose";

export interface IAddress {
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
  type: "admin";
}

export type JwtPayload = JwtCustomerPayload | JwtAdminPayload;
