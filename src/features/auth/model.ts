import mongoose, { Schema, Model } from "mongoose";
import { IUserDocument, IAdminUserDocument } from "./types";

const UserSchema = new Schema<IUserDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    addresses: [
      {
        label: { type: String, default: "" },
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        country: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    points: { type: Number, default: 0 },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

UserSchema.index({ storeId: 1, email: 1 }, { unique: true });

const AdminUserSchema = new Schema<IAdminUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    assignedStores: [{ type: Schema.Types.ObjectId, ref: "Store" }],
  },
  { timestamps: true }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export const AdminUserModel: Model<IAdminUserDocument> =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUserDocument>("AdminUser", AdminUserSchema);
