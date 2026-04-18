"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Package, Megaphone, User, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { INotification, NotificationType } from "../types";

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; label: string }> = {
  order_update: { icon: <Package size={15} />, label: "Order" },
  promotion:    { icon: <Megaphone size={15} />, label: "Promo" },
  account:      { icon: <User size={15} />, label: "Account" },
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

const PAGE_SIZE = 15;

export function NotificationList() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=${PAGE_SIZE}`);
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

  useEffect(() => { fetchNotifications(page); }, [page, fetchNotifications]);

  async function handleMarkRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const visible = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          {total > 0 && (
            <p className="text-sm text-text-secondary mt-1">
              {total} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--color-primary)" }}
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {!loading && notifications.length > 0 && (
        <div className="flex gap-1 mb-5 p-1 bg-surface rounded-xl border border-border-subtle w-fit">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize"
              style={filter === tab ? {
                backgroundColor: "var(--color-primary)",
                color: "#fff",
              } : { color: "var(--color-text-secondary)" }}
            >
              {tab}
              {tab === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                  style={filter === "unread"
                    ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                    : { backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)", color: "var(--color-primary)" }
                  }
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 rounded-xl border border-border-subtle bg-bg shimmer"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-9 h-9 rounded-full bg-surface shrink-0" />
              <div className="flex-1 space-y-2 py-0.5">
                <div className="h-3.5 bg-surface rounded w-2/3" />
                <div className="h-3 bg-surface rounded w-full" />
                <div className="h-2.5 bg-surface rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center">
            <Bell size={28} className="text-text-tertiary" />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {filter === "unread" ? "No unread notifications" : "All caught up!"}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {filter === "unread" ? "Switch to All to see your history." : "You have no notifications yet."}
            </p>
          </div>
          {filter === "unread" && (
            <button
              onClick={() => setFilter("all")}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-primary)" }}
            >
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div
          className="border border-border-subtle overflow-hidden shadow-[var(--shadow-xs)]"
          style={{ borderRadius: "calc(var(--border-radius) * 1.5)" }}
        >
          {visible.map((n, idx) => {
            const meta = TYPE_META[n.type] ?? { icon: <Bell size={15} />, label: "Info" };
            return (
              <div
                key={n._id}
                className="relative flex gap-3.5 px-4 py-4 transition-colors hover:bg-surface border-b border-border-subtle last:border-0"
                style={!n.isRead ? {
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 4%, transparent)",
                } : undefined}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <span
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                )}

                {/* Type icon */}
                <div
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  {meta.icon}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm leading-snug ${n.isRead ? "font-medium text-[var(--color-text)]" : "font-semibold text-[var(--color-text)]"}`}>
                          {n.title}
                        </p>
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n._id)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-surface transition-colors mt-0.5"
                        style={{ color: "var(--color-primary)" }}
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <time
                      className="text-[11px] text-text-tertiary"
                      dateTime={new Date(n.createdAt).toISOString()}
                      title={formatDate(n.createdAt)}
                    >
                      {timeAgo(n.createdAt)}
                    </time>
                    <span className="text-[11px] text-text-tertiary hidden sm:inline">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && filter === "all" && (
        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border-subtle rounded-lg hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} />
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            Page <span className="font-semibold text-[var(--color-text)]">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border-subtle rounded-lg hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
