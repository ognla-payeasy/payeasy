"use client";

/**
 * Issue #222 (#718) — privacy-first page analytics.
 *
 * Loads Plausible Analytics (cookieless, GDPR-compliant) and exposes a small
 * helper for tracking the product's key custom events. Analytics is only loaded
 * when a domain is configured AND the visitor has not enabled Do Not Track, so
 * privacy is respected by default and the app works with analytics disabled.
 *
 * Configure via env:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN  — the site domain registered in Plausible
 *   NEXT_PUBLIC_PLAUSIBLE_SRC     — optional self-hosted script URL
 */
import Script from "next/script";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

/** Custom analytics events tracked across the product. */
export type AnalyticsEvent =
  | "Escrow Creation Started"
  | "Wallet Connected"
  | "Contribution Completed";

/** True when the visitor has asked not to be tracked (DNT / GPC). */
export function isDoNotTrackEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & {
    msDoNotTrack?: string;
    globalPrivacyControl?: boolean;
  };
  const dnt =
    nav.doNotTrack ??
    (window as unknown as { doNotTrack?: string }).doNotTrack ??
    nav.msDoNotTrack;
  return dnt === "1" || dnt === "yes" || nav.globalPrivacyControl === true;
}

/** Whether analytics should load/track at all. */
export function analyticsEnabled(): boolean {
  return Boolean(PLAUSIBLE_DOMAIN) && !isDoNotTrackEnabled();
}

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

/**
 * Track a custom event. No-ops when analytics is disabled, DNT is on, or the
 * script hasn't loaded — so callers can fire events unconditionally.
 */
export function trackEvent(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || !analyticsEnabled()) return;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (typeof plausible === "function") {
    plausible(event, props ? { props } : undefined);
  }
}

/**
 * Injects the Plausible script. Renders nothing when no domain is configured or
 * Do Not Track is enabled. Plausible automatically records a page view on load
 * and on client-side navigations.
 */
export function Analytics() {
  if (!analyticsEnabled()) return null;

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src={PLAUSIBLE_SRC}
      strategy="afterInteractive"
    />
  );
}

export default Analytics;
