"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Monitor, ArrowRight, X, Bell, Tag, Sparkles, Gift } from "lucide-react";
import type { IAnnouncement, AnnouncementDisplayType } from "../types";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function applyInline(text: string, bgColor?: string): string {
  let out = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  if (bgColor) {
    // ==word== → bold badge using the announcement brand color
    out = out.replace(
      /==(.+?)==/g,
      `<span style="background-color:${bgColor};color:#fff;padding:1px 5px;border-radius:4px;font-weight:700;font-size:0.9em;">$1</span>`
    );
  } else {
    out = out.replace(
      /==(.+?)==/g,
      `<mark style="padding:1px 5px;border-radius:4px;font-weight:700;">$1</mark>`
    );
  }

  return out;
}

function previewMessage(text: string, bgColor?: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = esc.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const li = line.match(/^[-*]\s+(.+)/);
    if (li) {
      if (!inList) {
        html += `<ul style="list-style-type:disc;padding-left:1.25rem;margin:0.4rem 0;text-align:left;">`;
        inList = true;
      }
      html += `<li style="margin:0.4rem 0;">${applyInline(li[1], bgColor)}</li>`;
    } else {
      if (inList) { html += `</ul>`; inList = false; }
      if (line.trim() === "") {
        html += `<br/>`;
      } else {
        html += applyInline(line, bgColor) + `<br/>`;
      }
    }
  }
  if (inList) html += `</ul>`;
  return html.replace(/<br\/>$/, "");
}

function pickIcon(title: string, message: string) {
  const t = (title + message).toLowerCase();
  if (t.includes("sale") || t.includes("off") || t.includes("coupon") || t.includes("discount"))
    return Tag;
  if (t.includes("new") || t.includes("launch") || t.includes("feature") || t.includes("update"))
    return Sparkles;
  if (t.includes("gift") || t.includes("free") || t.includes("win") || t.includes("prize"))
    return Gift;
  return Bell;
}

/* ─── live preview panel ─────────────────────────────────────────────── */

interface PreviewProps {
  form: {
    title: string;
    message: string;
    displayType: AnnouncementDisplayType;
    backgroundColor: string;
    textColor: string;
    linkText: string;
  };
}

function LivePreview({ form }: PreviewProps) {
  const Icon = pickIcon(form.title, form.message);
  const msgHtml = previewMessage(form.message, form.backgroundColor) || "Your announcement message…";

  return (
    <div className="flex flex-col gap-3">
      {/* Browser chrome */}
      <div className="rounded-xl border border-admin-border overflow-hidden shadow-sm bg-admin-surface">
        {/* Chrome bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-admin-surface-raised border-b border-admin-border">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 h-5 bg-gray-200 rounded-md flex items-center px-2">
            <span className="text-[9px] text-admin-text-subtle truncate">yourstore.com</span>
          </div>
        </div>

        {/* ── Modal viewport (self-sizing, no absolute clipping) ── */}
        {form.displayType === "modal" && (
          <div
            className="flex items-center justify-center px-4 py-6"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
          >
            <div className="w-52 bg-admin-surface rounded-2xl shadow-xl overflow-hidden">
              {/* Colored header */}
              <div
                className="relative px-5 pt-8 pb-6 text-center overflow-hidden"
                style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
              >
                <div
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20"
                  style={{ backgroundColor: form.textColor }}
                />
                <div
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
                  style={{ backgroundColor: form.textColor }}
                />
                <div className="relative z-10 flex justify-center mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                    style={{ backgroundColor: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <p className="relative z-10 text-[11px] font-bold leading-snug">
                  {form.title || "Announcement"}
                </p>
              </div>
              {/* White body */}
              <div className="px-4 py-4 text-center">
                <p
                  className="text-[10px] text-admin-text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: msgHtml }}
                />
                {form.linkText && (
                  <div
                    className="mt-3 py-2 rounded-xl text-[10px] font-semibold text-white"
                    style={{ backgroundColor: form.backgroundColor }}
                  >
                    {form.linkText} →
                  </div>
                )}
                <div className="mt-2 text-[10px] text-admin-text-subtle">Maybe later</div>
              </div>
            </div>
          </div>
        )}

        {/* Viewport (bar / banner / float) */}
        {form.displayType !== "modal" && (
        <div className="relative bg-admin-surface-raised" style={{ minHeight: 220 }}>

          {/* ── Bar ──────────────────────────────────────────────── */}
          {form.displayType === "bar" && (
            <div
              className="flex items-center justify-center gap-2 px-8 py-2 text-[10px] tracking-wide"
              style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
            >
              {form.title && (
                <span className="font-semibold uppercase tracking-widest opacity-70">{form.title}</span>
              )}
              {form.title && <span className="opacity-30">|</span>}
              <span dangerouslySetInnerHTML={{ __html: msgHtml }} />
              {form.linkText && (
                <span className="font-semibold underline">{form.linkText}</span>
              )}
            </div>
          )}

          {/* ── Banner ───────────────────────────────────────────── */}
          {form.displayType === "banner" && (
            <div
              className="relative px-4 py-3"
              style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
            >
              <div className="flex items-center gap-3 pr-5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  {form.title && (
                    <p className="font-semibold text-[10px] tracking-tight">{form.title}</p>
                  )}
                  <p
                    className="text-[10px] opacity-80 leading-snug"
                    dangerouslySetInnerHTML={{ __html: msgHtml }}
                  />
                </div>
                {form.linkText && (
                  <span
                    className="shrink-0 text-[9px] font-semibold px-2 py-1 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    {form.linkText}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mock page content */}
          <div className="p-4 space-y-2">
            <div className="h-2.5 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg bg-gray-200 aspect-3/4" />
              ))}
            </div>
          </div>

          {/* ── Float ────────────────────────────────────────────── */}
          {form.displayType === "float" && (
            <div className="absolute bottom-3 right-3 w-44 bg-admin-surface rounded-2xl border border-admin-border shadow-lg overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0" style={{ backgroundColor: form.backgroundColor }} />
                <div className="flex-1 p-3">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: form.backgroundColor + "15",
                        color: form.backgroundColor,
                      }}
                    >
                      <Icon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {form.title && (
                        <p className="text-[10px] font-semibold text-admin-text-primary leading-snug tracking-tight">
                          {form.title}
                        </p>
                      )}
                      <p
                        className="text-[9px] text-admin-text-subtle mt-0.5 leading-relaxed line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: msgHtml }}
                      />
                      {form.linkText && (
                        <p
                          className="text-[9px] font-semibold mt-1.5 flex items-center gap-0.5"
                          style={{ color: form.backgroundColor }}
                        >
                          {form.linkText} <ArrowRight size={8} />
                        </p>
                      )}
                    </div>
                    <button className="shrink-0 -mt-0.5 w-4 h-4 flex items-center justify-center rounded-full text-gray-300">
                      <X size={9} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Type badge */}
      <div className="flex items-center gap-2">
        <Monitor size={13} className="text-admin-text-subtle" />
        <span className="text-xs text-admin-text-muted capitalize">
          {form.displayType === "float" ? "Float card (bottom-right)"
            : form.displayType === "bar" ? "Top bar"
            : form.displayType === "banner" ? "Banner (full width)"
            : "Modal popup"}
        </span>
      </div>
    </div>
  );
}

/* ─── main form ──────────────────────────────────────────────────────── */

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
    displayType: (announcement?.displayType ?? "float") as AnnouncementDisplayType,
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
    "w-full px-3 py-2 border border-admin-border-md rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-admin-text-secondary mb-1";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* ── Left: form fields ───────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

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
            placeholder="e.g. Get **20% off** on all products. Use code SUMMER20"
            rows={3}
            className={`${inputClass} resize-none`}
            required
          />
          <p className="text-xs text-admin-text-subtle mt-1 flex flex-wrap gap-x-2 gap-y-1">
            <span>Supports:</span>
            <code className="bg-admin-chip px-1 rounded">**bold**</code>
            <code className="bg-admin-chip px-1 rounded">*italic*</code>
            <code className="bg-admin-chip px-1 rounded">- list item</code>
            <code className="bg-admin-chip px-1 rounded">==highlight==</code>
            <span className="text-gray-300">— highlight uses the background color</span>
          </p>
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
            <p className="text-xs text-admin-text-subtle mt-1">Higher = shown first</p>
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
                className="w-10 h-10 rounded border border-admin-border-md cursor-pointer"
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
                className="w-10 h-10 rounded border border-admin-border-md cursor-pointer"
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
            <label className={labelClass}>
              Link URL{" "}
              <span className="text-admin-text-subtle font-normal">(optional)</span>
            </label>
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
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              End Date{" "}
              <span className="text-admin-text-subtle font-normal">
                (leave empty for no end)
              </span>
            </label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="w-4 h-4 rounded border-admin-border-md"
            />
            <span className="text-sm font-medium text-admin-text-secondary">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.dismissible}
              onChange={(e) =>
                setForm((f) => ({ ...f, dismissible: e.target.checked }))
              }
              className="w-4 h-4 rounded border-admin-border-md"
            />
            <span className="text-sm font-medium text-admin-text-secondary">
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
            className="px-6 py-2.5 bg-admin-surface text-admin-text-secondary text-sm font-medium rounded-lg border border-admin-border-md hover:bg-admin-surface-hover"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* ── Right: live preview (sticky on desktop) ─────────────── */}
      <div className="w-full lg:w-90 shrink-0 lg:sticky lg:top-6">
        <div className="bg-admin-surface-raised rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={15} className="text-admin-text-muted" />
            <span className="text-sm font-semibold text-admin-text-secondary">Live Preview</span>
            <span className="ml-auto text-[11px] text-admin-text-subtle bg-admin-surface border border-admin-border px-2 py-0.5 rounded-full">
              Desktop
            </span>
          </div>
          <LivePreview form={form} />
        </div>
      </div>
    </div>
  );
}
