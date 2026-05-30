"use client";

import { useEffect } from "react";

interface VitalsPayload {
  name: string;
  value: number;
  id: string;
}

function sendVital(payload: VitalsPayload): void {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/vitals",
      new Blob([body], { type: "application/json" })
    );
  } else {
    fetch("/api/vitals", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Non-critical — silently ignore reporting failures.
    });
  }
}

/**
 * Invisible client component that captures Core Web Vitals (LCP, FID, CLS)
 * using native PerformanceObserver APIs and POSTs them to /api/vitals.
 * Mount once in the root layout.
 */
export function WebVitals() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    // LCP — Largest Contentful Paint
    try {
      const lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        sendVital({ name: "LCP", value: last.startTime, id: `lcp-${Date.now()}` });
      });
      lcp.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // PerformanceObserver entry type not supported in this browser.
    }

    // FID — First Input Delay
    try {
      const fid = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { processingStart: number; startTime: number };
          sendVital({
            name: "FID",
            value: e.processingStart - e.startTime,
            id: `fid-${Date.now()}`,
          });
        }
      });
      fid.observe({ type: "first-input", buffered: true });
    } catch {
      // PerformanceObserver entry type not supported in this browser.
    }

    // CLS — Cumulative Layout Shift
    try {
      let clsValue = 0;
      const cls = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!e.hadRecentInput) {
            clsValue += e.value;
          }
        }
        sendVital({ name: "CLS", value: clsValue, id: `cls-${Date.now()}` });
      });
      cls.observe({ type: "layout-shift", buffered: true });
    } catch {
      // PerformanceObserver entry type not supported in this browser.
    }
  }, []);

  return null;
}