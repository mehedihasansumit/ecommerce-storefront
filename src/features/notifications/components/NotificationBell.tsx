"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Package, Megaphone, User, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { INotification, NotificationType } from "../types";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  order_update: <Package size={14} />,
  promotion:    <Megaphone size={14} />,
  account:      <User size={14} />,
};

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=6");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="p-2.5 rounded-lg hover:bg-white/10 transition-colors relative"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none ring-2"
            style={{
              backgroundColor: "var(--color-accent)",
              ["--tw-ring-color" as string]: "var(--color-header-bg)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-85 border border-border-subtle shadow-lg z-50 animate-scale-in overflow-hidden"
          style={{ backgroundColor: "var(--color-card-bg)", borderRadius: "calc(var(--border-radius) * 1.5)" }}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text">Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white leading-none"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--color-primary)" }}
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-85 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
                />
                <p className="text-xs text-text-tertiary">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <Bell size={18} className="text-text-tertiary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">All caught up!</p>
                <p className="text-xs text-text-tertiary">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="relative flex gap-3 px-4 py-3.5 border-b border-border-subtle last:border-0 hover:bg-surface transition-colors"
                  style={!n.isRead ? {
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
                  } : undefined}
                >
                  {/* Unread dot */}
                  {!n.isRead && (
                    <span
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                  )}

                  {/* Type icon */}
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {TYPE_ICON[n.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text leading-snug">
                      {n.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-t border-border-subtle hover:bg-surface transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            View all notifications
            <ChevronRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
