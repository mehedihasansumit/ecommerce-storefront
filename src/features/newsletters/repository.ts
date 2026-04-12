import dbConnect from "@/shared/lib/db";
import { NewsletterModel } from "./model";
import type { INewsletter } from "./types";

function serialize(doc: unknown): INewsletter {
  return JSON.parse(JSON.stringify(doc));
}

export const NewsletterRepository = {
  async findByStoreAndEmail(
    storeId: string,
    email: string
  ): Promise<INewsletter | null> {
    await dbConnect();
    const doc = await NewsletterModel.findOne({ storeId, email }).lean();
    return doc ? serialize(doc) : null;
  },

  async create(data: {
    storeId: string;
    email: string;
    status?: "subscribed" | "unsubscribed";
  }): Promise<INewsletter> {
    await dbConnect();
    const doc = await NewsletterModel.create(data);
    return serialize(doc.toObject());
  },

  async updateStatus(
    id: string,
    status: "subscribed" | "unsubscribed"
  ): Promise<INewsletter | null> {
    await dbConnect();
    const doc = await NewsletterModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    return doc ? serialize(doc) : null;
  },
};
