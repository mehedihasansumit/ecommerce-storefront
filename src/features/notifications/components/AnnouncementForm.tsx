"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { IAnnouncement, AnnouncementDisplayType } from "../types";

interface AnnouncementFormProps {
  storeId: string;
  announcement?: IAnnouncement;
}

export function AnnouncementForm({ storeId, announcement }: AnnouncementFormProps) {
  const router = useRouter();
  const isEdit = !!announcement;

  const [form, setForm] = useState({
    title: announcement?.title ?? "",
    message: announcement?.message ?? "",
    displayType: announcement?.displayType ?? "float",
    backgroundColor: announcement?.backgroundColor ?? "#1e40af",
    textColor: announcement?.textColor ?? "#ffffff",
    linkUrl: announcement?.linkUrl ?? "",
    linkText: announcement?.linkText ?? "",
    startDate: announcement
      ? new Date(announcement.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endDate: announcement?.endDate
      ? new Date(announcement.endDate).toISOString().slice(0, 16)
      : "",
    isActive: announcement?.isActive ?? true,
    dismissible: announcement?.dismissible ?? true,
    priority: announcement?.priority ?? 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      storeId,
      title: form.title,
      message: form.message,
      displayType: form.displayType,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      linkUrl: form.linkUrl || "",
      linkText: form.linkText,
      startDate: form.startDate,
      endDate: form.endDate || null,
      isActive: form.isActive,
      dismissible: form.dismissible,
      priority: Number(form.priority),
    };

    try {
      const url = isEdit
        ? `/api/announcements/${announcement._id}`
        : "/api/announcements";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save announcement");
        return;
      }

      router.push(`/admin/stores/${storeId}/announcements`);
      router.refresh();
    } catch {
      setError("Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Preview */}
      <div>
        <label className={labelClass}>Preview</label>
        {form.displayType === "float" ? (
          <div className="w-72 rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-1.5" style={{ backgroundColor: form.backgroundColor }} />
            <div className="bg-white p-4 flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs"
                style={{ backgroundColor: form.backgroundColor + "20", color: form.backgroundColor }}
              >
                📢
              </div>
              <div className="flex-1">
                {form.title && <p className="text-sm font-semibold text-gray-900">{form.title}</p>}
                <p className="text-xs text-gray-500 mt-0.5">{form.message || "Your announcement message..."}</p>
                {form.linkText && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: form.backgroundColor }}>
                    {form.linkText} →
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
            style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
          >
            {form.title && <span className="font-semibold">{form.title}</span>}
            <span>{form.message || "Your announcement message..."}</span>
            {form.linkText && <span className="underline font-medium">{form.linkText}</span>}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Summer Sale!"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="e.g. Get 20% off on all products. Use code SUMMER20"
          rows={3}
          className={`${inputClass} resize-none`}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Display Type</label>
          <select
            value={form.displayType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                displayType: e.target.value as AnnouncementDisplayType,
              }))
            }
            className={inputClass}
          >
            <option value="float">Float Card (bottom-right, recommended)</option>
            <option value="bar">Top Bar (slim strip)</option>
            <option value="banner">Banner (full width)</option>
            <option value="modal">Modal (popup)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <input
            type="number"
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value as unknown as number }))
            }
            min={0}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">Higher = shown first</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.backgroundColor}
              onChange={(e) =>
                setForm((f) => ({ ...f, backgroundColor: e.target.value }))
              }
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={form.backgroundColor}
              onChange={(e) =>
                setForm((f) => ({ ...f, backgroundColor: e.target.value }))
              }
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.textColor}
              onChange={(e) =>
                setForm((f) => ({ ...f, textColor: e.target.value }))
              }
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={form.textColor}
              onChange={(e) =>
                setForm((f) => ({ ...f, textColor: e.target.value }))
              }
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Link URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            placeholder="https://... or /products"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Link Text</label>
          <input
            type="text"
            value={form.linkText}
            onChange={(e) => setForm((f) => ({ ...f, linkText: e.target.value }))}
            placeholder="e.g. Shop Now"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            End Date <span className="text-gray-400 font-normal">(leave empty for no end)</span>
          </label>
          <input
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.dismissible}
            onChange={(e) =>
              setForm((f) => ({ ...f, dismissible: e.target.checked }))
            }
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Dismissible by customer
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Update Announcement" : "Create Announcement"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
