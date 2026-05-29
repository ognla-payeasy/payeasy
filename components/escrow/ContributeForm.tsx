"use client";

import { useState } from "react";
import { Loader2, Wallet, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import useFreighter from "@/hooks/useFreighter.ts";
import TransactionReview from "@/components/wallet/TransactionReview.tsx";
import { validateContributionAmount } from "./contributeForm.helpers.ts";
import { buildContributeXdr, signAndSubmitContribute } from "@/lib/stellar/actions/contribute";
import type { ContractBasicInfo } from "@/lib/stellar/queries";

type ContributePhase = "idle" | "building" | "review" | "submitting";

interface ContributeFormProps {
  contractId: string;
  contractInfo: ContractBasicInfo;
  onSuccess?: (txHash: string) => void;
}

export default function ContributeForm({
  contractId,
  contractInfo,
  onSuccess,
}: ContributeFormProps) {
  const escrowId = contractId;
  const expectedShare = contractInfo.totalRent;
  const remainingBalance = contractInfo.totalRent;
  const { isConnected, connect, publicKey } = useFreighter();
  
  const [amount, setAmount] = useState(expectedShare);
  const [phase, setPhase] = useState<ContributePhase>("idle");
  const [preparedXdr, setPreparedXdr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const validation = validateContributionAmount(amount, remainingBalance);
  const isValid = validation.isValid;

  const handleContributeClick = async () => {
    if (!isConnected || !publicKey) {
      await connect();
      return;
    }
    if (!isValid) {
      setError(validation.error || "Invalid amount");
      return;
    }
    setError(null);
    setPhase("building");

    try {
      // amount is in XLM, we must convert to stroops for the contract
      const stroopsAmount = BigInt(Math.floor(parseFloat(amount) * 1e7));
      const xdr = await buildContributeXdr({
        from: publicKey,
        amount: stroopsAmount,
        contractId: escrowId,
      });
      setPreparedXdr(xdr);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare transaction.");
      setPhase("idle");
    }
  };

  const handleConfirm = async () => {
    if (!preparedXdr || !publicKey) return;
    setPhase("submitting");
    setError(null);
    try {
      const result = await signAndSubmitContribute(preparedXdr, publicKey);
      setTxHash(result.txHash);
      onSuccess?.(result.txHash);
      setPhase("idle");
      setPreparedXdr(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.");
      setPhase("review"); // go back to review so they can try again or cancel
    }
  };

  const handleCancel = () => {
    setPhase("idle");
    setPreparedXdr(null);
    setError(null);
  };

  return (
    <div className="glass-card p-6 sm:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-dark-100 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-400" />
            Contribute Share
          </h3>
          <p className="text-sm text-dark-500">Pay your part of the rent split.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-dark-500 uppercase tracking-widest font-black">Your Progress</p>
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <span className="text-lg font-black text-white">{expectedShare}</span>
            <span className="text-xs text-brand-400 font-bold">/ {expectedShare}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-xs uppercase tracking-widest font-black text-dark-500">
            Contribution Amount (XLM)
          </label>
          <div className="relative group">
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!isValid && parseFloat(amount) > 0}
              aria-describedby={[
                !isValid && parseFloat(amount) > 0 ? "amount-error" : undefined,
                "amount-helper"
              ].filter(Boolean).join(" ") || undefined}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 pr-12 text-lg font-bold text-dark-100 focus:border-brand-400 focus:outline-none transition-all group-hover:bg-white/[0.08]"
              placeholder="0.00"
            />
            <div id="amount-helper" className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 font-black text-sm">
              XLM
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 text-dark-500 text-xs uppercase tracking-widest font-black">
            <Info className="h-3 w-3" />
            Balance Remaining
          </div>
          <p className="text-2xl font-black text-dark-100 tracking-tight">
            {remainingBalance} <span className="text-xs text-dark-500 font-medium">XLM Total</span>
          </p>
        </div>
      </div>

  {!isValid && parseFloat(amount) > 0 && (
    <div id="amount-error" role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
      <ArrowRight className="h-3 w-3 rotate-180" />
      {validation.error}
    </div>
  )}

      <button
        type="button"
        onClick={handleContributeClick}
        disabled={!isValid || phase !== "idle"}
        className="w-full btn-primary !py-4 !text-base shadow-xl shadow-brand-500/30 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected ? (
          "Connect Wallet to Pay"
        ) : phase === "building" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparing Transaction...
          </>
        ) : (
          <>
            Contribute Now
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {(phase === "review" || phase === "submitting") && preparedXdr && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md relative flex flex-col gap-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                {error}
              </div>
            )}
            <TransactionReview
              xdr={preparedXdr}
              network="TESTNET"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isSubmitting={phase === "submitting"}
            />
          </div>
        </div>
      )}

      {txHash && (
        <div className="mt-6 p-4 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center gap-3 text-accent-100 text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>Payment successful! Transaction recorded on-chain.</p>
        </div>
      )}
    </div>
  );
}
