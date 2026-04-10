import { NotificationRepository, AnnouncementRepository } from "./repository";
import type {
  INotification,
  IAnnouncement,
  NotificationType,
  NotificationChannel,
} from "./types";
import type { CreateAnnouncementInput } from "./schemas";
import { sendEmail, orderConfirmationEmail, orderStatusEmail } from "@/shared/lib/email";
import { sendSms } from "@/shared/lib/sms";
import { UserModel } from "@/features/auth/model";
import { StoreModel } from "@/features/stores/model";
import dbConnect from "@/shared/lib/db";

interface NotifyOptions {
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

async function getStoreName(storeId: string): Promise<string> {
  await dbConnect();
  const store = await StoreModel.findById(storeId, { name: 1 }).lean();
  return (store as { name?: string })?.name ?? "Store";
}

async function getUserPrefsAndContact(userId: string) {
  await dbConnect();
  const user = await UserModel.findById(userId, {
    email: 1,
    phone: 1,
    notificationPreferences: 1,
  }).lean();
  if (!user) return null;
  const u = user as {
    email?: string;
    phone?: string;
    notificationPreferences?: { email?: boolean; sms?: boolean; inApp?: boolean };
  };
  return {
    email: u.email ?? "",
    phone: u.phone ?? "",
    prefs: {
      email: u.notificationPreferences?.email ?? true,
      sms: u.notificationPreferences?.sms ?? false,
      inApp: u.notificationPreferences?.inApp ?? true,
    },
  };
}

async function dispatchExternal(
  channel: NotificationChannel,
  userPrefs: { email: boolean; sms: boolean; inApp: boolean },
  contact: { email: string; phone: string },
  subject: string,
  htmlContent: string,
  smsText: string
) {
  const shouldEmail =
    (channel === "email" || channel === "all") && userPrefs.email && contact.email;
  const shouldSms =
    (channel === "sms" || channel === "all") && userPrefs.sms && contact.phone;

  if (shouldEmail) {
    await sendEmail({ to: contact.email, subject, html: htmlContent });
  }
  if (shouldSms) {
    await sendSms({ to: contact.phone, message: smsText });
  }
}

export const NotificationService = {
  // ─── Personal Notifications ──────────────────────────────────

  async notify(
    storeId: string,
    userId: string,
    options: NotifyOptions
  ): Promise<INotification | null> {
    const channel = options.channel ?? "all";

    // Always create in-app notification
    const notification = await NotificationRepository.create({
      storeId,
      userId,
      type: options.type,
      title: options.title,
      message: options.message,
      channel,
      metadata: options.metadata ?? {},
    });

    // Dispatch email/SMS if applicable
    if (userId && (channel === "email" || channel === "sms" || channel === "all")) {
      const userInfo = await getUserPrefsAndContact(userId);
      if (userInfo) {
        const storeName = await getStoreName(storeId);
        let html = `<p>${options.message}</p>`;
        if (options.type === "order_update" && options.metadata?.orderNumber) {
          if (options.metadata?.isNewOrder) {
            html = orderConfirmationEmail(options.metadata.orderNumber as string, storeName);
          } else {
            html = orderStatusEmail(
              options.metadata.orderNumber as string,
              options.metadata.status as string,
              storeName
            );
          }
        }

        await dispatchExternal(
          channel,
          userInfo.prefs,
          userInfo,
          options.title,
          html,
          `${options.title}: ${options.message}`
        );
      }
    }

    return notification;
  },

  async getForUser(
    storeId: string,
    userId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ notifications: INotification[]; total: number }> {
    return NotificationRepository.findByUser(storeId, userId, options);
  },

  async getUnreadCount(storeId: string, userId: string): Promise<number> {
    return NotificationRepository.countUnread(storeId, userId);
  },

  async markRead(
    storeId: string,
    userId: string,
    notificationId: string
  ): Promise<INotification | null> {
    return NotificationRepository.markAsRead(notificationId, userId);
  },

  async markAllRead(storeId: string, userId: string): Promise<void> {
    return NotificationRepository.markAllRead(storeId, userId);
  },

  // ─── Announcements (storefront banners/alerts) ───────────────

  async createAnnouncement(
    storeId: string,
    adminId: string,
    input: CreateAnnouncementInput
  ): Promise<IAnnouncement> {
    return AnnouncementRepository.create({
      ...input,
      storeId,
      createdBy: adminId,
    });
  },

  async getAnnouncement(
    storeId: string,
    announcementId: string
  ): Promise<IAnnouncement | null> {
    const announcement = await AnnouncementRepository.findById(announcementId);
    if (!announcement || announcement.storeId !== storeId) return null;
    return announcement;
  },

  async listAnnouncements(
    storeId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ announcements: IAnnouncement[]; total: number }> {
    return AnnouncementRepository.findByStore(storeId, options);
  },

  async updateAnnouncement(
    storeId: string,
    announcementId: string,
    data: Partial<CreateAnnouncementInput>
  ): Promise<IAnnouncement | null> {
    const announcement = await AnnouncementRepository.findById(announcementId);
    if (!announcement || announcement.storeId !== storeId) return null;
    return AnnouncementRepository.update(announcementId, data);
  },

  async deleteAnnouncement(
    storeId: string,
    announcementId: string
  ): Promise<boolean> {
    const announcement = await AnnouncementRepository.findById(announcementId);
    if (!announcement || announcement.storeId !== storeId) return false;
    return AnnouncementRepository.delete(announcementId);
  },

  /** Get currently active announcements for the storefront */
  async getActiveAnnouncements(storeId: string): Promise<IAnnouncement[]> {
    return AnnouncementRepository.findActive(storeId);
  },
};
