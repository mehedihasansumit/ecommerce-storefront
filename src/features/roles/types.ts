import { Types } from "mongoose";
import type { Permission } from "@/shared/lib/permissions";

export interface IRole {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDocument extends Omit<IRole, "_id"> {
  _id: Types.ObjectId;
}
