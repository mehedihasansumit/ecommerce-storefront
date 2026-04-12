"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil } from "lucide-react";
import { BroadcastButton } from "./BroadcastButton";
import type { IAnnouncement } from "../types";

interface AnnouncementTableProps {
  announcements: IAnnouncement[];
  storeId: string;
}

export function AnnouncementTable({
  announcements: initial,
  storeId,
}: AnnouncementTableProps) {
  const [announcements, setAnnouncements] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/announcements/${id}?storeId=${storeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  function getStatus(a: IAnnouncement) {
    if (!a.isActive) return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
    const now = new Date();
    if (now < new Date(a.startDate))
      return { label: "Scheduled", color: "bg-blue-100 text-blue-700" };
    if (a.endDate && now > new Date(a.endDate))
      return { label: "Expired", color: "bg-red-100 text-red-700" };
    return { label: "Live", color: "bg-green-100 text-green-700" };
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No announcements yet. Create one to display alerts on your storefront.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 font-medium">Title</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Starts</th>
            <th className="pb-3 font-medium">Ends</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {announcements.map((a) => {
            const status = getStatus(a);
            return (
              <tr key={a._id} className="hover:bg-gray-50">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: a.backgroundColor }}
                    />
                    <span className="font-medium max-w-[200px] truncate">
                      {a.title}
                    </span>
                  </div>
                </td>
                <td className="py-3 capitalize">{a.displayType}</td>
                <td className="py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="py-3 text-gray-500">
                  {new Date(a.startDate).toLocaleDateString()}
                </td>
                <td className="py-3 text-gray-500">
                  {a.endDate
                    ? new Date(a.endDate).toLocaleDateString()
                    : "No end"}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <BroadcastButton
                      announcementId={a._id}
                      storeId={storeId}
                      initialSentAt={a.broadcastSentAt}
                      initialCount={a.broadcastCount ?? 0}
                    />
                    <Link
                      href={`/admin/stores/${storeId}/announcements/${a._id}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(a._id)}
                      disabled={deleting === a._id}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
