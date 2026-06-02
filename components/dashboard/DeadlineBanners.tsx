"use client";

/**
 * Issue #238 (#734) — Landlord deadline reminder banner.
 *
 * On dashboard load, surfaces a dismissible amber banner for every active escrow
 * whose deadline falls within the next 72 hours, so landlords are reminded
 * before a deadline lapses. Dismissals are remembered (localStorage) so a banner
 * does not reappear on every navigation within the same approaching window.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import type { EscrowContract } from "@/lib/stellar/types";
import { getApproachingEscrows, formatTimeUntil } from "./deadline-utils";

const DISMISSED_KEY = "dismissed_deadline_banners";

interface DeadlineBannersProps {
  escrows: EscrowContract[];
}

export default function DeadlineBanners({ escrows }: DeadlineBannersProps) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const approaching = useMemo(
    () => getApproachingEscrows(escrows, nowSeconds),
    [escrows, nowSeconds],
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load previously dismissed banners once on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) setDismissed(new Set(JSON.parse(stored) as string[]));
    } catch {
      // Ignore malformed storage; show all banners.
    }
  }, []);

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      } catch {
        // Non-fatal: dismissal just won't persist.
      }
      return next;
    });
  };

  const visible = approaching.filter((e) => !dismissed.has(e.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3" aria-label="Deadline reminders" role="region">
      {visible.map((escrow) => (
        <div
          key={escrow.id}
          role="alert"
          data-testid="deadline-banner"
          className="flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1 text-sm">
            <span className="font-black uppercase tracking-wider text-amber-300">
              Deadline approaching
            </span>{" "}
            <span className="text-amber-100/90">
              Escrow {escrow.id.slice(0, 6)}…{escrow.id.slice(-4)} is due{" "}
              {formatTimeUntil(escrow.deadlineEpoch, nowSeconds)}.
            </span>
          </div>
          <Link
            href={`/escrow/${escrow.id}`}
            className="shrink-0 rounded-lg border border-amber-400/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-500/20"
          >
            Review
          </Link>
          <button
            type="button"
            aria-label="Dismiss reminder"
            onClick={() => dismiss(escrow.id)}
            className="shrink-0 rounded-md p-1 text-amber-300/70 transition-colors hover:bg-amber-500/20 hover:text-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
