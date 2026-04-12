import dbConnect from "@/shared/lib/db";
import { SubscriberModel } from "./model";
import type { ISubscriber } from "./types";

function serialize(doc: unknown): ISubscriber {
  return JSON.parse(JSON.stringify(doc));
}

export const SubscriberRepository = {
  async findByStoreAndEmail(
    storeId: string,
    email: string
  ): Promise<ISubscriber | null> {
    await dbConnect();
    const doc = await SubscriberModel.findOne({ storeId, email }).lean();
    return doc ? serialize(doc) : null;
  },

  async findByStoreAndPhone(
    storeId: string,
    phone: string
  ): Promise<ISubscriber | null> {
    await dbConnect();
    const doc = await SubscriberModel.findOne({ storeId, phone }).lean();
    return doc ? serialize(doc) : null;
  },

  async findEmailSubscribersByStore(storeId: string): Promise<ISubscriber[]> {
    await dbConnect();
    const docs = await SubscriberModel.find({
      storeId,
      status: "subscribed",
      email: { $exists: true, $ne: null },
    }).lean();
    return docs.map(serialize);
  },

  async create(data: {
    storeId: string;
    email?: string;
    phone?: string;
  }): Promise<ISubscriber> {
    await dbConnect();
    const doc = await SubscriberModel.create(data);
    return serialize(doc.toObject());
  },

  async updateStatus(
    id: string,
    status: "subscribed" | "unsubscribed"
  ): Promise<ISubscriber | null> {
    await dbConnect();
    const doc = await SubscriberModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    return doc ? serialize(doc) : null;
  },
};
