/**
 * Issue #224 (#720) — transaction failure-rate metrics.
 *
 * A tiny in-process counter for escrow transaction outcomes (contribute /
 * release). `recordTransaction` is called from the action layer; the
 * `/api/metrics` route reads `getMetrics()`.
 *
 * Scope/limitation: counts live in module memory, so they reset on server
 * restart and are per-process (not shared across serverless instances). That is
 * acceptable for the current visibility goal — see docs/adr/001 for the same
 * "good enough for this stage" tradeoff applied to storage. A durable backend
 * (Redis/DB) can replace the store without changing the public API.
 */

export type TransactionType = "contribute" | "release";
export type TransactionOutcome = "success" | "failure";

export interface MetricsSnapshot {
  total_transactions: number;
  failed_transactions: number;
  /** Failure percentage, rounded to two decimals (0 when there are no txns). */
  failure_rate_percent: number;
}

interface Counters {
  total: number;
  failed: number;
}

// Per-type counters plus an aggregate. Kept module-local (singleton per process).
const counters: Record<TransactionType, Counters> = {
  contribute: { total: 0, failed: 0 },
  release: { total: 0, failed: 0 },
};

/** Record the outcome of a transaction attempt. */
export function recordTransaction(
  type: TransactionType,
  outcome: TransactionOutcome,
): void {
  const c = counters[type];
  c.total += 1;
  if (outcome === "failure") c.failed += 1;
}

function rate(total: number, failed: number): number {
  if (total === 0) return 0;
  return Math.round((failed / total) * 10000) / 100;
}

/** Aggregate metrics across all transaction types. */
export function getMetrics(): MetricsSnapshot {
  const total = counters.contribute.total + counters.release.total;
  const failed = counters.contribute.failed + counters.release.failed;
  return {
    total_transactions: total,
    failed_transactions: failed,
    failure_rate_percent: rate(total, failed),
  };
}

/** Per-type breakdown, useful for richer dashboards. */
export function getMetricsByType(): Record<TransactionType, MetricsSnapshot> {
  const build = (c: Counters): MetricsSnapshot => ({
    total_transactions: c.total,
    failed_transactions: c.failed,
    failure_rate_percent: rate(c.total, c.failed),
  });
  return {
    contribute: build(counters.contribute),
    release: build(counters.release),
  };
}

/** Test-only: reset all counters. */
export function __resetMetrics(): void {
  counters.contribute = { total: 0, failed: 0 };
  counters.release = { total: 0, failed: 0 };
}
