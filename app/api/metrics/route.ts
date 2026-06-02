import { NextResponse } from "next/server";
import { getMetrics, getMetricsByType } from "@/lib/metrics";

/**
 * Issue #224 (#720) — GET /api/metrics
 *
 * Returns aggregate escrow transaction failure statistics, plus a per-type
 * breakdown for richer dashboards.
 */
export async function GET() {
  const aggregate = getMetrics();
  return NextResponse.json(
    {
      ...aggregate,
      by_type: getMetricsByType(),
    },
    {
      // Always reflect current counters; never serve a cached snapshot.
      headers: { "Cache-Control": "no-store" },
    },
  );
}
