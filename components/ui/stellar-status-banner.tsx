"use client";

import { AlertTriangle } from "lucide-react";
import { useStellarStatus } from "@/hooks/useStellarStatus";

export default function StellarStatusBanner() {
  const { status, description } = useStellarStatus();

  if (status === "operational" || status === "unknown") return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300"
    >
      <div className="bg-amber-500 text-amber-950 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>Stellar Network Degraded</strong>
            {description ? ` — ${description}` : " — some features may be unavailable. Check status.stellar.org for updates."}
          </span>
        </div>
      </div>
    </div>
  );
}