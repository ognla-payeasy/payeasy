"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "payeasy:archived-escrows";

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // quota exceeded or private browsing — fail silently
  }
}

export function useArchivedEscrows() {
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  useEffect(() => {
    setArchivedIds(readFromStorage());
  }, []);

  const archiveEscrow = useCallback((id: string) => {
    setArchivedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeToStorage(next);
      return next;
    });
  }, []);

  const unarchiveEscrow = useCallback((id: string) => {
    setArchivedIds((prev) => {
      const next = prev.filter((x) => x !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  const isArchived = useCallback(
    (id: string) => archivedIds.includes(id),
    [archivedIds]
  );

  return { archivedIds, archiveEscrow, unarchiveEscrow, isArchived };
}
