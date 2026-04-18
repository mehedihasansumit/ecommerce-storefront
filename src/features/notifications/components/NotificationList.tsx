"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import type { INotification } from "../types";

export function NotificationList() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  async function handleMarkRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    }
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-admin-text-subtle">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <Bell size={40} className="text-gray-300" />
          <p className="text-admin-text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`bg-admin-surface rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                !n.isRead
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-admin-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-sm text-admin-text-muted mt-0.5">{n.message}</p>
                <p className="text-xs text-admin-text-subtle mt-1.5">
                  {formatDate(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n._id)}
                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-admin-text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
