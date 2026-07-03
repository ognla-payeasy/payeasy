/**
 * Issue #238 (#734) — pure helpers for the deadline reminder banner.
 *
 * Kept in a JSX-free .ts module so the selection logic is unit-testable via
 * `node --test` (which strips .ts but not .tsx). The banner component imports
 * these.
 */
import type { EscrowContract } from "@/lib/stellar/types";

/** Deadlines within this window (seconds) trigger a reminder banner. */
export const DEADLINE_WINDOW_SECONDS = 72 * 60 * 60; // 72 hours

/** An escrow is "active" for reminder purposes when not yet released/expired. */
export function isActiveEscrow(escrow: EscrowContract): boolean {
  return escrow.status === "active" || escrow.status === "funded";
}

/**
 * Returns the escrows whose deadline is approaching: active, in the future, and
 * within the 72h window.
 */
export function getApproachingEscrows(
  escrows: EscrowContract[],
  nowSeconds: number = Math.floor(Date.now() / 1000),
): EscrowContract[] {
  return escrows.filter((escrow) => {
    if (!isActiveEscrow(escrow)) return false;
    const secondsUntil = escrow.deadlineEpoch - nowSeconds;
    return secondsUntil > 0 && secondsUntil <= DEADLINE_WINDOW_SECONDS;
  });
}

/** Human-readable "in 2 days" / "in 5 hours" until the deadline. */
export function formatTimeUntil(
  deadlineEpoch: number,
  nowSeconds: number,
): string {
  const seconds = Math.max(0, deadlineEpoch - nowSeconds);
  const hours = Math.floor(seconds / 3600);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours >= 1) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const minutes = Math.floor(seconds / 60);
  return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}
