import { useEffect } from "react";

export interface HasTxHash {
  txHash: string;
}

export function getNewTransactionsByHash<T extends HasTxHash>(
  currentTransactions: T[],
  incomingTransactions: T[]
): T[] {
  const knownHashes = new Set(currentTransactions.map((tx) => tx.txHash));
  return incomingTransactions.filter((tx) => !knownHashes.has(tx.txHash));
}

export async function pollForNewTransactions<T extends HasTxHash>(
  currentTransactions: T[],
  fetchLatest: () => Promise<T[]>
): Promise<{ merged: T[]; newTransactions: T[] }> {
  const incoming = await fetchLatest();
  const newTransactions = getNewTransactionsByHash(currentTransactions, incoming);

  if (newTransactions.length === 0) {
    return { merged: currentTransactions, newTransactions };
  }

  return {
    merged: [...newTransactions, ...currentTransactions],
    newTransactions,
  };
}

export interface UseTransactionPollingOptions<T extends HasTxHash> {
  enabled: boolean;
  currentTransactions: T[];
  fetchLatest: () => Promise<T[]>;
  onNewTransactions: (transactions: T[]) => void;
  intervalMs?: number;
}

export default function useTransactionPolling<T extends HasTxHash>({
  enabled,
  currentTransactions,
  fetchLatest,
  onNewTransactions,
  intervalMs = 15_000,
}: UseTransactionPollingOptions<T>): void {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const { newTransactions } = await pollForNewTransactions(currentTransactions, fetchLatest);
      if (!cancelled && newTransactions.length > 0) onNewTransactions(newTransactions);
    };

    const interval = window.setInterval(() => { void tick(); }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, currentTransactions, fetchLatest, onNewTransactions, intervalMs]);
}
