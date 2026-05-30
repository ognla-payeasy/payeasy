"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  EscrowFormDraft,
  RoommateInputValue,
} from "@/components/escrow/createEscrowForm.helpers";

export interface EscrowTemplate {
  id: string;
  name: string;
  totalRent: string;
  tokenAddress: string;
  deadlineOffsetDays: number;
  roommates: Array<{ address: string; shareAmount: string }>;
  createdAt: number;
}

const STORAGE_KEY = "escrow_templates";

function loadFromStorage(): EscrowTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EscrowTemplate[];
  } catch {
    return [];
  }
}

function saveToStorage(templates: EscrowTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

export function useEscrowTemplates() {
  const [templates, setTemplates] = useState<EscrowTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadFromStorage());
  }, []);

  const saveTemplate = useCallback(
    (name: string, draft: EscrowFormDraft): EscrowTemplate => {
      const today = new Date();
      const deadlineDate = draft.deadlineDate
        ? new Date(draft.deadlineDate)
        : today;
      const offsetDays = Math.max(
        1,
        Math.round(
          (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      const template: EscrowTemplate = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim() || "Unnamed Template",
        totalRent: draft.totalRent,
        tokenAddress: draft.tokenAddress,
        deadlineOffsetDays: offsetDays,
        roommates: draft.roommates.map((r) => ({
          address: r.address,
          shareAmount: r.shareAmount,
        })),
        createdAt: Date.now(),
      };

      setTemplates((prev) => {
        const next = [template, ...prev];
        saveToStorage(next);
        return next;
      });

      return template;
    },
    []
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const applyTemplate = useCallback(
    (template: EscrowTemplate): Partial<EscrowFormDraft> => {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + template.deadlineOffsetDays);
      const deadlineDate = deadline.toISOString().split("T")[0] ?? "";

      const roommates: RoommateInputValue[] = template.roommates.map(
        (r, i) => ({
          id: `${Date.now()}-${i}`,
          address: r.address,
          shareAmount: r.shareAmount,
        })
      );

      return {
        totalRent: template.totalRent,
        tokenAddress: template.tokenAddress,
        deadlineDate,
        roommates,
      };
    },
    []
  );

  return { templates, saveTemplate, deleteTemplate, applyTemplate };
}
