"use client";

import { useMemo } from "react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import type { EscrowContract } from "@/lib/stellar/types";
import type { ReleasedEscrow } from "@/components/dashboard/PaymentHistoryTab";
import { ShieldCheck, Coins, FileText, Calendar } from "lucide-react";

interface PortfolioSummaryProps {
  escrows: EscrowContract[];
  releasedEscrows: ReleasedEscrow[];
}

export default function PortfolioSummary({ escrows, releasedEscrows }: PortfolioSummaryProps) {
  // Aggregate stats
  const stats = useMemo(() => {
    const activeContracts = escrows.filter(
      (e) => e.status === "active" || e.status === "funded"
    );
    const activeEscrows = activeContracts.length;
    
    const totalXlmInEscrow = activeContracts.reduce(
      (sum, e) => sum + Number(e.totalFunded),
      0
    );

    const totalReleased = releasedEscrows.reduce(
      (sum, e) => sum + Number(e.totalRent),
      0
    );

    // Find soonest deadline from active contracts
    const activeDeadlines = activeContracts
      .map((e) => e.deadlineEpoch)
      .filter((epoch) => epoch > Math.floor(Date.now() / 1000));
    
    const soonestDeadlineEpoch = activeDeadlines.length > 0 ? Math.min(...activeDeadlines) : null;

    return {
      activeEscrows,
      totalXlmInEscrow,
      totalReleased,
      soonestDeadlineEpoch,
    };
  }, [escrows, releasedEscrows]);

  const formattedDeadline = useMemo(() => {
    if (!stats.soonestDeadlineEpoch) return "None";
    const date = new Date(stats.soonestDeadlineEpoch * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [stats.soonestDeadlineEpoch]);

  const xlmFormatter = (val: number) => 
    val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="sticky top-24 z-20 w-full glass-card p-6 border border-white/10 bg-dark-950/80 backdrop-blur-xl rounded-2xl shadow-2xl space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_8px_rgba(92,124,250,0.5)]" />
          <span className="text-[10px] text-dark-300 font-black uppercase tracking-widest">
            Portfolio Live Summary
          </span>
        </div>
        <span className="text-[10px] text-dark-500 font-black uppercase tracking-widest font-mono">
          AGGREGATED DATA
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:divide-x md:divide-white/5">
        {/* Active Escrows */}
        <div className="space-y-1 pl-2">
          <div className="flex items-center gap-1.5 text-[9px] text-dark-500 font-black uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5 text-brand-400" />
            Active Agreements
          </div>
          <p className="text-2xl md:text-3xl font-black text-white leading-none pt-1">
            <AnimatedNumber value={stats.activeEscrows} />
          </p>
        </div>

        {/* XLM in Escrow */}
        <div className="space-y-1 md:pl-6">
          <div className="flex items-center gap-1.5 text-[9px] text-dark-500 font-black uppercase tracking-widest">
            <Coins className="h-3.5 w-3.5 text-brand-400" />
            XLM Locked
          </div>
          <p className="text-2xl md:text-3xl font-black text-white leading-none pt-1">
            <AnimatedNumber value={stats.totalXlmInEscrow} formatter={xlmFormatter} />
            <span className="text-[10px] text-dark-500 font-bold ml-1">XLM</span>
          </p>
        </div>

        {/* Total Released */}
        <div className="space-y-1 md:pl-6">
          <div className="flex items-center gap-1.5 text-[9px] text-dark-500 font-black uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-400" />
            Total Released
          </div>
          <p className="text-2xl md:text-3xl font-black text-accent-400 leading-none pt-1">
            <AnimatedNumber value={stats.totalReleased} formatter={xlmFormatter} />
            <span className="text-[10px] text-dark-500 font-bold ml-1">XLM</span>
          </p>
        </div>

        {/* Soonest Deadline */}
        <div className="space-y-1 md:pl-6">
          <div className="flex items-center gap-1.5 text-[9px] text-dark-500 font-black uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5 text-brand-400" />
            Soonest Deadline
          </div>
          <p className="text-base md:text-lg font-black text-white leading-none pt-2 truncate font-mono">
            {formattedDeadline}
          </p>
        </div>
      </div>
    </div>
  );
}
