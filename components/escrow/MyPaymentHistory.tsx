"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, History } from "lucide-react";
import { getExplorerLink } from "@/lib/stellar/explorer";
import { listPaymentHistory, type PaymentHistoryEntry } from "@/lib/stellar/paymentHistory";

interface MyPaymentHistoryProps {
  contractId: string;
  roommateAddress: string;
}

function formatAmount(amount: string): string {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return amount;
  return numeric.toFixed(2).replace(/\.00$/, "");
}

function formatRecordedAt(recordedAt: string): string {
  const date = new Date(recordedAt);
  return Number.isNaN(date.getTime()) ? recordedAt : date.toLocaleString();
}

function PaymentRow({ entry }: { entry: PaymentHistoryEntry }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{formatAmount(entry.amount)} XLM</p>
        <p className="text-xs text-dark-400">{formatRecordedAt(entry.recordedAt)}</p>
      </div>
      <a
        href={getExplorerLink("transaction", entry.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-300 hover:text-brand-200"
      >
        {entry.txHash.slice(0, 8)}...{entry.txHash.slice(-6)}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}

export default function MyPaymentHistory({ contractId, roommateAddress }: MyPaymentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<PaymentHistoryEntry[]>([]);

  useEffect(() => {
    setEntries(listPaymentHistory(contractId, roommateAddress));

    const handleStorage = () => {
      setEntries(listPaymentHistory(contractId, roommateAddress));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [contractId, roommateAddress]);

  const hasEntries = entries.length > 0;
  const latestAmount = useMemo(() => (hasEntries ? formatAmount(entries[0].amount) : null), [entries, hasEntries]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="glass-card overflow-hidden border border-white/10"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-2 text-brand-300">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">My Payment History</h3>
            <p className="text-xs text-dark-400">
              {hasEntries
                ? `${entries.length} contribution${entries.length === 1 ? "" : "s"}${latestAmount ? `, latest ${latestAmount} XLM` : ""}`
                : "No recorded contributions yet."}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-dark-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-dark-400" />
        )}
      </summary>

      <div className="border-t border-white/10 px-6 py-5">
        {hasEntries ? (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <PaymentRow key={entry.txHash} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-dark-400">Your individual payments will appear here after each successful contribution.</p>
        )}
      </div>
    </details>
  );
}