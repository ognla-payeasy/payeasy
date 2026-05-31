"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

/**
 * Registers the PayEasy service worker on first paint and surfaces an
 * "Update available" banner when a new worker takes over.
 *
 * The worker itself (`/sw.js`) is shared with the push-reminder flow, so this
 * component is intentionally idempotent — calling `register("/sw.js")` again
 * after the push prompt does the same is safe and returns the existing
 * registration.
 *
 * Behavior:
 *   - Skip entirely outside the browser, during dev, or when service workers
 *     are unsupported.
 *   - Listen for `controllerchange` and the worker's `payeasy:update-available`
 *     message to decide when to show the banner.
 *   - On "Refresh now", post `payeasy:skip-waiting` and reload so the new
 *     assets are picked up immediately.
 */
export default function ServiceWorkerManager() {
  const [updateReady, setUpdateReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    let cancelled = false;
    let registration: ServiceWorkerRegistration | null = null;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "payeasy:update-available") {
        setUpdateReady(true);
      }
    };

    const handleControllerChange = () => {
      if (isRefreshing) return;
      // A new worker took over without us asking — surface the prompt.
      setUpdateReady(true);
    };

    void (async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        if (cancelled) return;

        // If a worker is already waiting when we register, prompt immediately.
        if (registration.waiting) {
          setUpdateReady(true);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });
      } catch {
        // Registration failures (e.g. private mode) are not actionable for
        // users; keep the failure silent and skip the offline fallback path.
      }
    })();

    navigator.serviceWorker.addEventListener("message", handleMessage);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [isRefreshing]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      registration?.waiting?.postMessage({ type: "payeasy:skip-waiting" });
    } catch {
      // ignore — fall through to a hard reload regardless
    }
    window.location.reload();
  }

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 px-4"
    >
      <div className="glass flex items-center gap-3 rounded-2xl border border-brand-400/30 bg-brand-500/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <RefreshCcw
          className="h-4 w-4 text-brand-300 shrink-0"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-white">
          Update available
        </span>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? "Refreshing…" : "Refresh now"}
        </button>
        <button
          type="button"
          onClick={() => setUpdateReady(false)}
          className="text-[11px] font-bold uppercase tracking-widest text-dark-300 hover:text-white"
          aria-label="Dismiss update notice"
        >
          Later
        </button>
      </div>
    </div>
  );
}
