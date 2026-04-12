import { NewsletterRepository } from "./repository";
import type { INewsletter } from "./types";

export const NewsletterService = {
  async subscribe(storeId: string, email: string): Promise<INewsletter> {
    const existing = await NewsletterRepository.findByStoreAndEmail(
      storeId,
      email.toLowerCase().trim()
    );

    if (existing) {
      if (existing.status === "subscribed") {
        throw new Error("Already subscribed");
      }
      // Reactivate unsubscribed user
      const reactivated = await NewsletterRepository.updateStatus(
        existing._id,
        "subscribed"
      );
      return reactivated!;
    }

    return NewsletterRepository.create({ storeId, email });
  },
};
