import { headers } from "next/headers";
import dbConnect from "./db";
import { StoreModel } from "@/features/stores/model";
import type { IStore } from "@/features/stores/types";

export async function getTenant(): Promise<IStore | null> {
  const headerList = await headers();
  const storeId = headerList.get("x-store-id");

  if (!storeId) return null;

  await dbConnect();
  const store = await StoreModel.findById(storeId).lean();

  if (!store) return null;

  return JSON.parse(JSON.stringify(store)) as IStore;
}

export async function getStoreId(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get("x-store-id");
}
