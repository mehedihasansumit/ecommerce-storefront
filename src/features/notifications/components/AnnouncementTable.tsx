"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Megaphone, X } from "lucide-react";
import { BroadcastButton } from "./BroadcastButton";
import type { IAnnouncement } from "../types";

type AnnouncementStatus = "live" | "scheduled" | "expired" | "inactive";

interface Props {
  announcements: IAnnouncement[];
  storeId: string;
  filterStatus?: string;
}

function getAnnouncementStatus(a: IAnnouncement): AnnouncementStatus {
  if (!a.isActive) return "inactive";
  const now = new Date();
  if (now < new Date(a.startDate)) return "scheduled";
  if (a.endDate && now > new Date(a.endDate)) return "expired";
  return "live";
}

const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  live:      "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  expired:   "bg-red-100 text-red-700",
  inactive:  "bg-admin-chip text-admin-text-muted",
};

const STATUS_DOT: Record<AnnouncementStatus, string> = {
  live:      "bg-green-500",
  scheduled: "bg-blue-500",
  expired:   "bg-red-400",
  inactive:  "bg-gray-400",
};

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  banner: "Banner",
  modal:  "Modal",
  bar:    "Top Bar",
  float:  "Float",
};

export function AnnouncementTable({ announcements: initial, storeId, filterStatus }: Props) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/announcements/${id}?storeId=${storeId}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  const filtered =
    filterStatus && filterStatus !== "all"
      ? announcements.filter((a) => getAnnouncementStatus(a) === filterStatus)
      : announcements;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
        <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-7 h-7 text-admin-text-subtle" />
        </div>
        <h3 className="text-base font-semibold text-admin-text-primary mb-1">No announcements found</h3>
        <p className="text-sm text-admin-text-muted">
          {filterStatus && filterStatus !== "all"
            ? `No ${filterStatus} announcements.`
            : "Create one to display alerts and banners on your storefront."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-200">
          <thead className="bg-admin-surface-raised border-b border-admin-border-md">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Announcement
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Schedule
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Priority
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Broadcast
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {filtered.map((a) => {
              const status = getAnnouncementStatus(a);

              return (
                <tr key={a._id} className="hover:bg-admin-surface-raised/60 transition-colors group">
                  {/* Title + preview */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Color swatch preview */}
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border border-black/5"
                        style={{ backgroundColor: a.backgroundColor || "#111" }}
                      >
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: a.textColor || "#fff" }}
                        >
                          Aa
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-admin-text-primary truncate max-w-48">
                          {a.title}
                        </p>
                        {a.message && (
                          <p className="text-xs text-admin-text-subtle mt-0.5 truncate max-w-48">
                            {a.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {a.dismissible && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-admin-text-subtle">
                              <X className="w-2.5 h-2.5" /> Dismissible
                            </span>
                          )}
                          {a.linkUrl && (
                            <span className="text-[10px] text-blue-500 truncate max-w-24">
                              {a.linkText || a.linkUrl}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Display type */}
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-admin-chip text-admin-text-secondary capitalize">
                      {DISPLAY_TYPE_LABELS[a.displayType] ?? a.displayType}
                    </span>
                  </td>

                  {/* Schedule */}
                  <td className="px-5 py-4 text-xs text-admin-text-muted">
                    <p>
                      {new Date(a.startDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {a.endDate ? (
                      <p className="text-admin-text-subtle">
                        →{" "}
                        {new Date(a.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="text-gray-300">→ No end</p>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-admin-text-secondary">
                      {a.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                      {status}
                    </span>
                  </td>

                  {/* Broadcast */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <BroadcastButton
                        announcementId={a._id}
                        storeId={storeId}
                        initialSentAt={a.broadcastSentAt}
                        initialCount={a.broadcastCount ?? 0}
                      />
                      {a.broadcastSentAt && (
                        <p className="text-[10px] text-admin-text-subtle">
                          {new Date(a.broadcastSentAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/stores/${storeId}/announcements/${a._id}`}
                        className="p-1.5 text-admin-text-subtle hover:text-admin-text-secondary hover:bg-admin-chip rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(a._id, a.title)}
                        disabled={deleting === a._id}
                        className="p-1.5 text-admin-text-subtle hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
