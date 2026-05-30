"use client";

import Link from "next/link";
import { Clock, ShieldCheck, ArrowRight, Wallet } from "lucide-react";
import type { ContractState, RoommateState } from "@/lib/stellar/types";

interface RoommateEscrowCardProps {
  escrow: ContractState;
  roommate: RoommateState;
}

export default function RoommateEscrowCard({ escrow, roommate }: RoommateEscrowCardProps) {
  const expected = Number(roommate.expectedShare);
  const paid = Number(roommate.paidAmount);
  const remaining = Math.max(0, expected - paid).toFixed(2).replace(/\.00$/, "");
  const personalPercentage = Math.min(
    100,
    expected > 0 ? Math.round((paid / expected) * 100) : 0
  );

  return (
    <div className="glass-card p-6 flex flex-col justify-between gap-6 hover:-translate-y-1 transition-all duration-300 group border border-white/5 bg-white/[0.02]">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-mono text-sm font-semibold text-brand-400 mb-1">
              {escrow.id}
            </h3>
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <Clock className="w-3.5 h-3.5" />
              Deadline: {escrow.deadline}
            </div>
          </div>
          <div>
            {escrow.status === "funded" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Funded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Personal Contribution Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-dark-500 font-bold uppercase tracking-wider">Your Progress</span>
            <span className="text-brand-400 font-bold">{personalPercentage}% Contributed</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
              style={{ width: `${personalPercentage}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-left">
          <div>
            <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">Expected Share</div>
            <div className="text-sm font-bold text-white">{roommate.expectedShare} <span className="text-[9px] text-dark-600">XLM</span></div>
          </div>
          <div>
            <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">Amount Paid</div>
            <div className="text-sm font-bold text-white">{roommate.paidAmount} <span className="text-[9px] text-dark-600">XLM</span></div>
          </div>
          <div>
            <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">Remaining</div>
            <div className="text-sm font-bold text-amber-400">{remaining} <span className="text-[9px] text-dark-600">XLM</span></div>
          </div>
        </div>
      </div>

      <Link
        href={`/escrow/${escrow.id}`}
        className="flex items-center justify-center w-full gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-black uppercase tracking-widest text-xs border border-white/5"
      >
        View Escrow <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
