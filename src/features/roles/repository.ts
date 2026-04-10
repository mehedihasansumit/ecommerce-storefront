import dbConnect from "@/shared/lib/db";
import { RoleModel } from "./model";
import type { IRole } from "./types";

function serialize(doc: unknown): IRole {
  return JSON.parse(JSON.stringify(doc));
}

export const RoleRepository = {
  async findAll(): Promise<IRole[]> {
    await dbConnect();
    const roles = await RoleModel.find().sort({ name: 1 }).lean();
    return roles.map(serialize);
  },

  async findById(id: string): Promise<IRole | null> {
    await dbConnect();
    const role = await RoleModel.findById(id).lean();
    return role ? serialize(role) : null;
  },

  async findByName(name: string): Promise<IRole | null> {
    await dbConnect();
    const role = await RoleModel.findOne({ name }).lean();
    return role ? serialize(role) : null;
  },

  async create(data: Partial<IRole>): Promise<IRole> {
    await dbConnect();
    const role = await RoleModel.create(data);
    return serialize(role.toObject());
  },

  async update(id: string, data: Partial<IRole>): Promise<IRole | null> {
    await dbConnect();
    const role = await RoleModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return role ? serialize(role) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await RoleModel.findByIdAndDelete(id);
    return !!result;
  },
};
