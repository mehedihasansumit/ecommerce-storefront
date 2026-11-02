"use client";

import { NotificationList } from "@/features/notifications/components/NotificationList";

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <NotificationList />
    </div>
  );
}
