import { headers } from "next/headers";
import dbConnect from "./db";
import { StoreModel } from "@/features/stores/model";
import type { IStore } from "@/features/stores/types";

export async function getTenant(): Promise<IStore | null> {
  const headerList = await headers();

  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];

  if (!hostname || hostname === "localhost") return null;

  try {
    await dbConnect();
    const store = await StoreModel.findOne({
      domains: hostname,
      isActive: true,
    }).lean();
    if (!store) return null;
    return JSON.parse(JSON.stringify(store)) as IStore;
  } catch {
    return null;
  }
}

export async function getStoreId(): Promise<string | null> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];
  if (!hostname || hostname === "localhost") return null;

  try {
    await dbConnect();
    const store = await StoreModel.findOne({ domains: hostname, isActive: true }, { _id: 1 }).lean();
    return store ? String(store._id) : null;
  } catch {
    return null;
  }
}
