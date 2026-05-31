"use client";

import { useQuery } from "@tanstack/react-query";
import { getContractState, ContractQueryError, type ContractState } from "@/lib/stellar/queries";

export interface UseContractStateResult {
  contractState: ContractState | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export default function useContractState(
  contractId: string,
  initialData?: ContractState | null
): UseContractStateResult {
  const { data, isLoading, error, refetch } = useQuery<ContractState | null, Error>({
    queryKey: ["contractState", contractId],
    queryFn: async () => {
      if (!contractId) return null;
      return await getContractState(contractId);
    },
    staleTime: 30_000, // 30-second stale time
    refetchInterval: 30_000, // automatically poll every 30 seconds
    enabled: !!contractId,
    initialData: initialData ?? undefined,
    retry: 1,
  });

  const errorMessage = error
    ? error instanceof ContractQueryError
      ? error.message
      : "Network error. Please check your connection and try again."
    : null;

  return {
    contractState: data ?? null,
    isLoading,
    error: errorMessage,
    refresh: async () => {
      await refetch();
    },
  };
}
