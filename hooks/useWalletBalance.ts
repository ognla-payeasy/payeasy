"use client";

import { useState, useEffect, useCallback } from "react";
import { getNativeBalance } from "@/lib/stellar/queries";

interface WalletBalanceState {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

const REFRESH_INTERVAL_MS = 60_000;

export function useWalletBalance(publicKey: string | null, enabled = false) {
  const [state, setState] = useState<WalletBalanceState>({
    balance: null,
    isLoading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const raw = await getNativeBalance(publicKey);
      const num = parseFloat(raw);
      const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setState({ balance: formatted, isLoading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: "Failed to load balance" }));
    }
  }, [publicKey]);

  useEffect(() => {
    if (!enabled || !publicKey) return;

    fetchBalance();

    const interval = setInterval(fetchBalance, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, publicKey, fetchBalance]);

  return { ...state, refetch: fetchBalance };
}
