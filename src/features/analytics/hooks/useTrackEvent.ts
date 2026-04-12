"use client";

import { useCallback } from "react";

type TrackPayload =
  | {
      eventType: "product_view";
      productId: string;
      productName: string;
      categoryId?: string;
    }
  | {
      eventType: "add_to_cart";
      productId: string;
      productName: string;
      categoryId?: string;
    }
  | { eventType: "search"; searchQuery: string };

function getSessionId(): string {
  try {
    const key = "analytics_session_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function useTrackEvent() {
  return useCallback((payload: TrackPayload) => {
    if (typeof window === "undefined") return;

    const body = JSON.stringify({
      ...payload,
      sessionId: getSessionId(),
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // never throw — tracking must never break the storefront
    }
  }, []);
}
