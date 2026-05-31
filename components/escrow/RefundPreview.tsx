"use client";

import { Coins, Fuel, Info } from "lucide-react";

import { stroopsToXlm } from "@/lib/stellar/actions/claimRefund";

interface RefundPreviewProps {
  /**
   * Roommate's refundable contribution, in stroops (1 XLM = 10,000,000 stroops).
   * Pass the on-chain `paid_amount` so this preview matches what `claim_refund`
   * will actually transfer.
   */
  refundableStroops: string;
  /**
   * Optional copy override — e.g. when the eligible amount differs from the
   * roommate's full contribution (partial refund scenarios).
   */
  label?: string;
}

/**
 * Renders the refund amount a roommate will receive before they commit to the
 * Claim Refund action. Pure presentational component — never calls the
 * network or wallet itself.
 *
 * Surfaces three things acceptance criteria require:
 *   1. Exact refund amount in XLM with explicit unit
 *   2. Clarification that this is the roommate's full contribution
 *   3. Notice that Stellar network gas fees will be deducted on submit
 */
export default function RefundPreview({
  refundableStroops,
  label = "your full contribution",
}: RefundPreviewProps) {
  let amountXlm: string;
  try {
    amountXlm = stroopsToXlm(refundableStroops);
  } catch {
    // Defensive: stroopsToXlm uses BigInt(), which throws on non-numeric input.
    // Show a fallback rather than crashing the dashboard.
    amountXlm = "0";
  }

  // Strip trailing zeros for a cleaner display while keeping the precision
  // identical to what the action returns on success.
  const displayAmount = amountXlm.includes(".")
    ? amountXlm.replace(/0+$/, "").replace(/\.$/, "")
    : amountXlm;

  return (
    <section
      className="glass-card border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8"
      aria-label="Refund preview"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">
              Refund Preview
            </p>
            <p className="text-lg font-black text-white sm:text-xl">
              You will receive back{" "}
              <span className="text-amber-200">{displayAmount} XLM</span>
              <span className="text-sm font-medium text-dark-300">
                {" "}
                ({label})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-dark-300">
          <Fuel
            className="mt-0.5 h-4 w-4 shrink-0 text-dark-500"
            aria-hidden="true"
          />
          <p>
            Stellar network fees (paid in XLM) will be deducted from your wallet
            when you submit the claim. The on-chain refund amount above is
            transferred in full.
          </p>
        </div>

        <p className="flex items-start gap-2 text-xs font-medium text-dark-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Refunds are only available once the funding deadline has passed
          without the escrow reaching its goal.
        </p>
      </div>
    </section>
  );
}
