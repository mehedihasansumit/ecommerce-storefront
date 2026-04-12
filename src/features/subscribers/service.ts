import { SubscriberRepository } from "./repository";
import type { ISubscriber } from "./types";

export const SubscriberService = {
  async subscribe(
    storeId: string,
    contact: { email?: string; phone?: string }
  ): Promise<ISubscriber> {
    const { email, phone } = contact;

    // Check for existing subscription by email
    if (email) {
      const existing = await SubscriberRepository.findByStoreAndEmail(
        storeId,
        email.toLowerCase().trim()
      );
      if (existing) {
        if (existing.status === "subscribed") throw new Error("Already subscribed");
        return (await SubscriberRepository.updateStatus(existing._id, "subscribed"))!;
      }
    }

    // Check for existing subscription by phone
    if (phone) {
      const existing = await SubscriberRepository.findByStoreAndPhone(storeId, phone.trim());
      if (existing) {
        if (existing.status === "subscribed") throw new Error("Already subscribed");
        return (await SubscriberRepository.updateStatus(existing._id, "subscribed"))!;
      }
    }

    return SubscriberRepository.create({ storeId, email, phone });
  },

  async getEmailSubscribers(storeId: string): Promise<ISubscriber[]> {
    return SubscriberRepository.findEmailSubscribersByStore(storeId);
  },
};
