"use client";

import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { useStellar } from "@/context/StellarContext";
import { SkipLink } from "@/components/ui/skip-link";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import OfflineBanner from "./offline-banner";
import AccountChangedBanner from "./account-changed-banner";

/** True when the device reports fewer than 4 logical CPU cores. */
const isLowEnd =
  typeof navigator !== "undefined" &&
  typeof navigator.hardwareConcurrency === "number" &&
  navigator.hardwareConcurrency < 4;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { announcement } = useStellar();
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (announcement) {
      setLiveMessage(announcement);
    }
  }, [announcement]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        className="sr-only" 
        role="status"
      >
        {liveMessage}
      </div>

      {/* #548: skip Three.js canvas on low-end devices; use a lightweight CSS gradient instead */}
      {isLowEnd ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(92,124,250,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(32,201,151,0.06) 0%, transparent 60%)",
          }}
        />
      ) : (
        <DottedSurface />
      )}
      <div className="mesh-gradient" aria-hidden="true" />
      <SkipLink />
      <ErrorBoundary>
        <OfflineBanner />
        <AccountChangedBanner />
        <div className="relative z-10">{children}</div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

