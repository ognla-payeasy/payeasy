"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Flag, Loader2 } from "lucide-react";

interface DisputeFlagProps {
  contractId: string;
  roommateAddress: string;
}

const STORAGE_KEY = "escrow_disputes";

function readDisputes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

function persistDispute(contractId: string): void {
  const disputes = readDisputes();
  disputes[contractId] = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disputes));
  } catch (e) {
    console.error(e);
  }
}

export default function DisputeFlag({
  contractId,
  roommateAddress,
}: DisputeFlagProps) {
  const [isFlagged, setIsFlagged] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsFlagged(Boolean(readDisputes()[contractId]));
  }, [contractId]);

  async function handleFlag() {
    setIsFlagging(true);
    setError(null);
    try {
      await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, roommateAddress }),
      });
    } catch {
      // fall through — persist locally regardless
    } finally {
      persistDispute(contractId);
      setIsFlagged(true);
      setIsFlagging(false);
    }
  }

  if (isFlagged) {
    return (
      <div
        role="status"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-black uppercase tracking-widest"
      >
        <Flag className="h-4 w-4" />
        Dispute Pending
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-red-500/20 bg-red-500/5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-red-300 font-black text-sm uppercase tracking-widest">
          <AlertTriangle className="h-4 w-4" />
          Funds Unreleased Past Deadline
        </div>
        <p className="text-dark-400 text-sm max-w-md">
          The escrow is fully funded but the landlord has not released funds.
          You can flag a dispute to escalate this.
        </p>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
      <button
        onClick={() => void handleFlag()}
        disabled={isFlagging}
        className="btn-secondary !border-red-500/30 hover:!border-red-400/60 !text-red-300 hover:!bg-red-500/10 !py-2.5 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFlagging ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Filing...
          </>
        ) : (
          <>
            <Flag className="h-4 w-4" />
            Flag Dispute
          </>
        )}
      </button>
    </div>
  );
}
