import dbConnect from "@/shared/lib/db";
import { NotificationModel, AnnouncementModel } from "./model";
import type { INotification, IAnnouncement } from "./types";

function serializeNotification(doc: unknown): INotification {
  return JSON.parse(JSON.stringify(doc));
}

function serializeAnnouncement(doc: unknown): IAnnouncement {
  return JSON.parse(JSON.stringify(doc));
}

export const NotificationRepository = {
  async create(data: Partial<INotification>): Promise<INotification> {
    await dbConnect();
    const notification = await NotificationModel.create(data);
    return serializeNotification(notification.toObject());
  },

  async createMany(items: Partial<INotification>[]): Promise<void> {
    await dbConnect();
    await NotificationModel.insertMany(items);
  },

  async findByUser(
    storeId: string,
    userId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{ notifications: INotification[]; total: number }> {
    await dbConnect();
    const filter = { storeId, userId };
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(filter),
    ]);
    return { notifications: notifications.map(serializeNotification), total };
  },

  async countUnread(storeId: string, userId: string): Promise<number> {
    await dbConnect();
    return NotificationModel.countDocuments({
      storeId,
      userId,
      isRead: false,
    });
  },

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    await dbConnect();
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();
    return notification ? serializeNotification(notification) : null;
  },

  async markAllRead(storeId: string, userId: string): Promise<void> {
    await dbConnect();
    await NotificationModel.updateMany(
      { storeId, userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  },
};

export const AnnouncementRepository = {
  async create(data: Partial<IAnnouncement>): Promise<IAnnouncement> {
    await dbConnect();
    const announcement = await AnnouncementModel.create(data);
    return serializeAnnouncement(announcement.toObject());
  },

  async findById(id: string): Promise<IAnnouncement | null> {
    await dbConnect();
    const announcement = await AnnouncementModel.findById(id).lean();
    return announcement ? serializeAnnouncement(announcement) : null;
  },

  async findByStore(
    storeId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{ announcements: IAnnouncement[]; total: number }> {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      AnnouncementModel.find({ storeId })
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnnouncementModel.countDocuments({ storeId }),
    ]);
    return {
      announcements: announcements.map(serializeAnnouncement),
      total,
    };
  },

  /** Get currently active announcements for the storefront */
  async findActive(storeId: string): Promise<IAnnouncement[]> {
    await dbConnect();
    const now = new Date();
    const announcements = await AnnouncementModel.find({
      storeId,
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(5)
      .lean();
    return announcements.map(serializeAnnouncement);
  },

  async update(
    id: string,
    data: Partial<IAnnouncement>
  ): Promise<IAnnouncement | null> {
    await dbConnect();
    const announcement = await AnnouncementModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return announcement ? serializeAnnouncement(announcement) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await AnnouncementModel.findByIdAndDelete(id);
    return !!result;
  },
};
