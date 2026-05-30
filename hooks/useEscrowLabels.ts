"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "escrow_labels";

function loadLabels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function persistLabels(labels: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  } catch {}
}

export function useEscrowLabels() {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    setLabels(loadLabels());
  }, []);

  const setLabel = useCallback((contractId: string, label: string) => {
    setLabels((prev) => {
      const next = { ...prev, [contractId]: label.trim() };
      persistLabels(next);
      return next;
    });
  }, []);

  const removeLabel = useCallback((contractId: string) => {
    setLabels((prev) => {
      const next = { ...prev };
      delete next[contractId];
      persistLabels(next);
      return next;
    });
  }, []);

  const getLabel = useCallback(
    (contractId: string): string | undefined => labels[contractId],
    [labels]
  );

  return { labels, setLabel, removeLabel, getLabel };
}
