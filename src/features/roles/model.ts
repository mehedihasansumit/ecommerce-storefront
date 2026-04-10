import mongoose, { Schema, Model } from "mongoose";
import type { IRoleDocument } from "./types";

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RoleModel: Model<IRoleDocument> =
  mongoose.models.Role || mongoose.model<IRoleDocument>("Role", RoleSchema);
