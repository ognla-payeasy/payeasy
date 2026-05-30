"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionList from "@/components/history/TransactionList";
import { type Transaction, type TransactionType } from "@/components/history/TransactionCard";
import { useStellar } from "@/context/StellarContext";
import {
  createHorizonClient,
  fetchTransactionHistory,
  type ParsedOperation,
  type ParsedTransaction,
} from "@/lib/stellar/history";
import useTransactionPolling from "@/hooks/useTransactionPolling";
import useTransactionHistory from "@/hooks/useTransactionHistory";
import EmptyState from "@/components/ui/empty-state";
import { History } from "lucide-react";

function formatOperationAmount(operation?: ParsedOperation): string {
  if (!operation?.amount) return "--";

  const numericAmount = Number(operation.amount);
  if (!Number.isFinite(numericAmount)) {
    return `${operation.amount} ${operation.asset ?? "XLM"}`;
  }

  return `${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  })} ${operation.asset ?? "XLM"}`;
}

function inferTransactionType(operations: ParsedOperation[]): TransactionType {
  const hasRelease = operations.some((op) => op.type === "invoke_host_function" && /release/i.test(op.function ?? ""));
  if (hasRelease) return "release";

  const hasRefund = operations.some((op) => op.type === "invoke_host_function" && /refund/i.test(op.function ?? ""));
  if (hasRefund) return "refund";

  return "contribute";
}

function mapParsedTransaction(tx: ParsedTransaction): Transaction {
  const contractId = tx.operations.find(op => op.contractId)?.contractId;
  
  return {
    id: tx.id || tx.hash,
    type: inferTransactionType(tx.operations),
    amount: formatOperationAmount(tx.operations[0]),
    status: tx.successful ? "success" : "failed",
    timestamp: tx.timestamp,
    txHash: tx.hash,
    contractId,
    fee: tx.fee,
    sourceAccount: tx.sourceAccount,
    operationCount: tx.operationCount,
    operations: tx.operations.map(op => ({
      type: op.type,
      from: op.from,
      to: op.to,
      amount: op.amount,
      asset: op.asset,
      function: op.function
    })),
  };
}

export default function HistoryClient() {
  const { publicKey, isConnected, isRestoring } = useStellar();
  const router = useRouter();

  const {
    transactions,
    isLoading: isLoadingInitial,
    hasNextPage: hasMore,
    isFetchingNextPage: isLoadingMore,
    fetchNextPage,
    prependTransactions,
  } = useTransactionHistory(publicKey);

  const [isPollingError, setIsPollingError] = useState(false);
  const [newHashes, setNewHashes] = useState<string[]>([]);

  const fadeTimersRef = useRef<Record<string, number>>({});

  const horizonClient = useMemo(() => createHorizonClient(), []);

  useEffect(() => {
    if (!isRestoring && !publicKey) {
      router.push("/connect");
    }
  }, [publicKey, isRestoring, router]);

  useEffect(() => {
    return () => {
      Object.values(fadeTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      fadeTimersRef.current = {};
    };
  }, []);

  const markAsNew = useCallback((items: Transaction[]) => {
    const hashes = items.map((tx) => tx.txHash);
    if (hashes.length === 0) return;

    setNewHashes((prev) => Array.from(new Set([...hashes, ...prev])));

    hashes.forEach((hash) => {
      if (fadeTimersRef.current[hash] !== undefined) {
        window.clearTimeout(fadeTimersRef.current[hash]);
      }
      fadeTimersRef.current[hash] = window.setTimeout(() => {
        setNewHashes((prev) => prev.filter((txHash) => txHash !== hash));
        delete fadeTimersRef.current[hash];
      }, 5000);
    });
  }, []);

  const fetchLatestPage = useCallback(async () => {
    if (!publicKey) return [];

    const result = await fetchTransactionHistory({
      client: horizonClient,
      accountId: publicKey,
      limit: 10,
      order: "desc",
      includeOperations: true,
    });

    return result.transactions.map(mapParsedTransaction);
  }, [horizonClient, publicKey]);

  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      await fetchNextPage();
    }
  }, [hasMore, isLoadingMore, fetchNextPage]);

  useTransactionPolling<Transaction>({
    enabled: isConnected && Boolean(publicKey),
    currentTransactions: transactions,
    fetchLatest: fetchLatestPage,
    onNewTransactions: (newTransactions) => {
      prependTransactions(newTransactions);
      markAsNew(newTransactions);
      setIsPollingError(false);
    },
    intervalMs: 15_000,
  });

  // Keep polling resilient; errors do not block the page.
  useEffect(() => {
    const listener = (event: PromiseRejectionEvent) => {
      if (String(event.reason ?? "").toLowerCase().includes("history")) {
        setIsPollingError(true);
      }
    };

    window.addEventListener("unhandledrejection", listener);
    return () => window.removeEventListener("unhandledrejection", listener);
  }, []);

  if (isRestoring || (isLoadingInitial && publicKey)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded-lg mb-4" />
        <div className="h-4 w-64 bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (!publicKey) return null;

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No Activity Yet"
        description="Your Stellar transaction history is currently empty. Start by creating or contributing to an escrow agreement."
        action={{
          label: "Go to Dashboard",
          onClick: () => router.push("/dashboard"),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {isPollingError && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Real-time updates temporarily unavailable. Retrying automatically.
        </p>
      )}
      <TransactionList
        transactions={transactions}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        newBadgeHashes={newHashes}
      />
    </div>
  );
}
