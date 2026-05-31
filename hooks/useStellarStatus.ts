"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const STATUS_URL = "https://status.stellar.org/api/v2/status.json";
const OPERATIONAL = "All Systems Operational";

export type StellarNetworkStatus = "operational" | "degraded" | "unknown";

export interface StellarStatusResult {
  status: StellarNetworkStatus;
  description: string | null;
  checkedAt: Date | null;
  isLoading: boolean;
}

async function fetchStellarStatus(): Promise<{ status: StellarNetworkStatus; description: string | null }> {
  const res = await fetch(STATUS_URL, { cache: "no-store" });
  if (!res.ok) {
    return { status: "unknown", description: null };
  }
  const data = (await res.json()) as {
    status?: { description?: string; indicator?: string };
  };
  const description = data?.status?.description ?? null;
  const isOperational = description === OPERATIONAL;
  return {
    status: isOperational ? "operational" : description ? "degraded" : "unknown",
    description,
  };
}

export function useStellarStatus(): StellarStatusResult {
  const [status, setStatus] = useState<StellarNetworkStatus>("unknown");
  const [description, setDescription] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchStellarStatus();
      setStatus(result.status);
      setDescription(result.description);
      setCheckedAt(new Date());
    } catch {
      setStatus("unknown");
      setDescription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  return { status, description, checkedAt, isLoading };
}