"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Tag, Sparkles, Gift, Bell } from "lucide-react";
import Link from "next/link";
import type { IAnnouncement } from "../types";

const DISMISSED_KEY = "dismissed-announcements";

function getDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissed(id: string) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function applyInline(text: string, bgColor?: string): string {
  let out = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  if (bgColor) {
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

/** Converts **bold**, *italic*, ==highlight==, - list items, and newlines to safe HTML. */
function renderMessage(text: string, bgColor?: string): string {
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
      html += `<li style="margin:0.4rem 0">${applyInline(li[1], bgColor)}</li>`;
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

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements/active");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setMounted(true);
    setDismissed(getDismissed());
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (!mounted) return;
    const floats = announcements.filter(
      (a) => a.displayType === "float" && !getDismissed().includes(a._id)
    );
    floats.forEach((a, i) => {
      setTimeout(() => {
        setVisible((prev) => new Set([...prev, a._id]));
      }, 1000 + i * 300);
    });
  }, [announcements, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss(id: string) {
    setExiting((prev) => new Set([...prev, id]));
    setTimeout(() => {
      addDismissed(id);
      setDismissed((prev) => [...prev, id]);
      setVisible((prev) => { const n = new Set(prev); n.delete(id); return n; });
      setExiting((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 350);
  }

  if (!mounted) return null;

  const all = announcements.filter((a) => !dismissed.includes(a._id));
  const bars = all.filter((a) => a.displayType === "bar");
  const banners = all.filter((a) => a.displayType === "banner");
  const modals = all.filter((a) => a.displayType === "modal");
  const floats = all.filter((a) => a.displayType === "float");

  return (
    <>
      {/* ── Top bars ─────────────────────────────────────────────── */}
      {bars.map((a) => (
        <div
          key={a._id}
          className="relative flex items-center justify-center gap-3 px-12 py-2.5 text-[13px] tracking-wide"
          style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
        >
          <span className="font-semibold uppercase tracking-widest text-[11px] opacity-70">
            {a.title}
          </span>
          {a.title && <span className="opacity-30">|</span>}
          <span dangerouslySetInnerHTML={{ __html: renderMessage(a.message, a.backgroundColor) }} />
          {a.linkUrl && a.linkText && (
            <Link
              href={a.linkUrl}
              className="inline-flex items-center gap-1 font-semibold border-b border-current/50 hover:border-current transition-colors pb-px"
            >
              {a.linkText}
              <ArrowRight size={11} />
            </Link>
          )}
          {a.dismissible && (
            <button
              onClick={() => handleDismiss(a._id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      {/* ── Full banners ─────────────────────────────────────────── */}
      {banners.map((a) => (
        <div
          key={a._id}
          className="relative px-6 py-4"
          style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-5 pr-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              {(() => { const Icon = pickIcon(a.title, a.message); return <Icon size={18} />; })()}
            </div>
            <div className="flex-1">
              {a.title && (
                <p className="font-semibold text-sm tracking-tight">{a.title}</p>
              )}
              <p className="text-sm opacity-80 leading-snug" dangerouslySetInnerHTML={{ __html: renderMessage(a.message, a.backgroundColor) }} />
            </div>
            {a.linkUrl && a.linkText && (
              <Link
                href={a.linkUrl}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all hover:brightness-110"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: a.textColor }}
              >
                {a.linkText}
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
          {a.dismissible && (
            <button
              onClick={() => handleDismiss(a._id)}
              className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      {/* ── Modal popup ──────────────────────────────────────────── */}
      {modals.map((a) => {
        const Icon = pickIcon(a.title, a.message);
        return (
          <div key={a._id} className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => a.dismissible && handleDismiss(a._id)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-scale-in">
              {/* Color header */}
              <div
                className="relative px-8 pt-12 pb-10 text-center overflow-hidden"
                style={{ backgroundColor: a.backgroundColor, color: a.textColor }}
              >
                {/* Decorative background blobs */}
                <div
                  className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20"
                  style={{ backgroundColor: a.textColor }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10"
                  style={{ backgroundColor: a.textColor }}
                />
                <div
                  className="absolute top-1/2 left-4 w-12 h-12 rounded-full opacity-10"
                  style={{ backgroundColor: a.textColor }}
                />

                {/* Icon */}
                <div className="relative z-10 flex justify-center mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.25)",
                      backdropFilter: "blur(8px)",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                    }}
                  >
                    <Icon size={28} />
                  </div>
                </div>

                {/* Title */}
                <h2 className="relative z-10 text-xl font-bold tracking-tight leading-snug">
                  {a.title}
                </h2>
              </div>

              {/* White body */}
              <div className="px-8 py-7 text-center">
                <p
                  className="text-gray-500 text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMessage(a.message, a.backgroundColor) }}
                />
                <div className="mt-7 flex flex-col gap-2.5">
                  {a.linkUrl && a.linkText && (
                    <Link
                      href={a.linkUrl}
                      onClick={() => handleDismiss(a._id)}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.98]"
                      style={{ backgroundColor: a.backgroundColor }}
                    >
                      {a.linkText}
                      <ArrowRight size={14} />
                    </Link>
                  )}
                  {a.dismissible && (
                    <button
                      onClick={() => handleDismiss(a._id)}
                      className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Maybe later
                    </button>
                  )}
                </div>
              </div>

              {a.dismissible && (
                <button
                  onClick={() => handleDismiss(a._id)}
                  className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  style={{ color: a.textColor }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Float cards ──────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end pointer-events-none">
        {floats.map((a) => {
          const Icon = pickIcon(a.title, a.message);
          const isVisible = visible.has(a._id) && !exiting.has(a._id);
          const isExiting = exiting.has(a._id);

          return (
            <div
              key={a._id}
              className="pointer-events-auto w-[340px] bg-white rounded-2xl border border-gray-200/80 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden"
              style={{
                transition: "opacity 350ms cubic-bezier(0.4,0,0.2,1), transform 350ms cubic-bezier(0.34,1.56,0.64,1)",
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? "translateX(0) translateY(0)"
                  : isExiting
                  ? "translateX(calc(100% + 24px))"
                  : "translateY(16px)",
              }}
            >
              {/* Left accent border */}
              <div className="flex">
                <div
                  className="w-1 shrink-0"
                  style={{ backgroundColor: a.backgroundColor }}
                />

                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: a.backgroundColor + "15",
                        color: a.backgroundColor,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {a.title && (
                        <p className="text-[13px] font-semibold text-gray-900 leading-snug tracking-tight">
                          {a.title}
                        </p>
                      )}
                      <p
                        className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: renderMessage(a.message, a.backgroundColor) }}
                      />

                      {a.linkUrl && a.linkText && (
                        <Link
                          href={a.linkUrl}
                          onClick={() => a.dismissible && handleDismiss(a._id)}
                          className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold tracking-wide uppercase transition-all hover:gap-2"
                          style={{ color: a.backgroundColor }}
                        >
                          {a.linkText}
                          <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>

                    {/* Dismiss */}
                    {a.dismissible && (
                      <button
                        onClick={() => handleDismiss(a._id)}
                        className="shrink-0 -mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-gray-200 hover:text-gray-400 hover:bg-gray-100 transition-all"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
