"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import type { INotification } from "../types";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    setDropdownOpen((v) => !v);
    if (!dropdownOpen) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=5");
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

  function timeAgo(date: Date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="p-2.5 rounded-lg hover:bg-white/10 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none ring-2"
            style={{
              backgroundColor: "var(--color-accent, #ef4444)",
              ["--tw-ring-color" as string]: "var(--color-header-bg)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white text-gray-800 shadow-[var(--shadow-lg)] border border-gray-100 rounded-xl z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setDropdownOpen(false)}
            className="block text-center text-sm text-blue-600 hover:text-blue-800 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
