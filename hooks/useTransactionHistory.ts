"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  createHorizonClient,
  fetchTransactionHistory,
  type ParsedOperation,
  type ParsedTransaction,
} from "@/lib/stellar/history";
import { type Transaction, type TransactionType } from "@/components/history/TransactionCard";

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

export default function useTransactionHistory(publicKey: string | null) {
  const queryClient = useQueryClient();
  const horizonClient = useMemo(() => createHorizonClient(), []);

  const queryKey = useMemo(() => ["transactionHistory", publicKey], [publicKey]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      if (!publicKey) return { transactions: [], nextCursor: undefined };
      const result = await fetchTransactionHistory({
        client: horizonClient,
        accountId: publicKey,
        cursor: pageParam as string | undefined,
        limit: 10,
        order: "desc",
        includeOperations: true,
      });
      return {
        transactions: result.transactions.map(mapParsedTransaction),
        nextCursor: result.nextCursor,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!publicKey,
    staleTime: Infinity, // Infinite stale time for transaction history
  });

  const transactions = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.transactions);
  }, [data]);

  const prependTransactions = useCallback(
    (newTxs: Transaction[]) => {
      if (!publicKey) return;
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) {
          return {
            pages: [{ transactions: newTxs, nextCursor: undefined }],
            pageParams: [undefined],
          };
        }
        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => {
            if (index === 0) {
              return {
                ...page,
                transactions: [...newTxs, ...page.transactions],
              };
            }
            return page;
          }),
        };
      });
    },
    [queryClient, queryKey, publicKey]
  );

  return {
    transactions,
    isLoading,
    isError,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    prependTransactions,
  };
}
