"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLandlordEscrows } from "@/lib/stellar/queries";
import type { EscrowContract } from "@/lib/stellar/types";
import EscrowDashboardSkeleton from "@/components/escrow/EscrowDashboardSkeleton";
import FundingProgress from "@/components/escrow/FundingProgress";
import { DeadlineCountdown } from "@/components/escrow/DeadlineCountdown";
import { useStellar } from "@/context/StellarContext";
import PaymentHistoryTab, { type ReleasedEscrow } from "@/components/dashboard/PaymentHistoryTab";
import { PlusCircle, Wallet, FileText, ArrowRight, ShieldCheck, Clock, Upload, TrendingUp } from "lucide-react";
import EscrowLabel from "@/components/escrow/EscrowLabel";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";

const MOCK_RELEASED_ESCROWS = (landlordKey: string): ReleasedEscrow[] => [
  {
    id: "ESCROW_PAST_RENT1",
    totalRent: "1200",
    status: "released" as const,
    releaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    txHash: "0000000000000000000000000000000000000000000000000000000000000001"
  },
  {
    id: "ESCROW_PAST_RENT2",
    totalRent: "1400",
    status: "released" as const,
    releaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    txHash: "0000000000000000000000000000000000000000000000000000000000000002"
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, publicKey, isRestoring } = useStellar();
  
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [releasedEscrows, setReleasedEscrows] = useState<ReleasedEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"escrows" | "history">("escrows");

  useEffect(() => {
    if (!isRestoring && !isConnected) {
      router.push("/connect");
    }
  }, [isConnected, isRestoring, router]);

  useEffect(() => {
    async function fetchData() {
      if (!publicKey) return;
      setLoading(true);
      try {
        const escrowsData = await getLandlordEscrows(publicKey);
        setEscrows(escrowsData);

        // Load released history from localStorage
        const stored = localStorage.getItem("released_escrows");
        if (stored) {
          setReleasedEscrows(JSON.parse(stored));
        } else {
          const seeded = MOCK_RELEASED_ESCROWS(publicKey);
          localStorage.setItem("released_escrows", JSON.stringify(seeded));
          setReleasedEscrows(seeded);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (publicKey) {
      void fetchData();
    }
  }, [publicKey]);

  // Compute stats locally to incorporate released escrows properly
  const stats = useMemo(() => {
    const activeEscrows = escrows.filter(
      (e) => e.status === "active" || e.status === "funded"
    ).length;
    const totalReleased = releasedEscrows.reduce(
      (sum, e) => sum + Number(e.totalRent), 
      0
    );
    const activeTotal = escrows.reduce(
      (sum, e) => sum + Number(e.totalRent), 
      0
    );
    const totalEscrowed = activeTotal + totalReleased;

    return { totalEscrowed, activeEscrows, totalReleased };
  }, [escrows, releasedEscrows]);

  if (isRestoring || (!isConnected && !publicKey)) return null;
  if (loading) return <EscrowDashboardSkeleton />;

  return (
    <main aria-label="Landlord Dashboard" className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-5xl space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-dark-400 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
              Landlord Terminal
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
              Landlord <span className="text-brand-400">Dashboard</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/tax-summary"
              className="btn-secondary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <TrendingUp className="h-4 w-4" />
              Tax Summary
            </Link>
            <Link
              href="/escrow/create-bulk"
              className="btn-secondary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </Link>
            <Link
              href="/escrow/create"
              className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <PlusCircle className="h-4 w-4" />
              Create Escrow
            </Link>
          </div>
        </header>

        {/* Sticky Stats Header */}
        <PortfolioSummary escrows={escrows} releasedEscrows={releasedEscrows} />

        {/* Tabs Selection */}
        <div className="flex border-b border-white/10 gap-6 text-sm">
          <button
            onClick={() => setActiveTab("escrows")}
            className={`pb-4 font-black uppercase tracking-widest transition-all text-xs ${
              activeTab === "escrows"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-dark-500 hover:text-white"
            }`}
          >
            Active Agreements
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 font-black uppercase tracking-widest transition-all text-xs ${
              activeTab === "history"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-dark-500 hover:text-white"
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === "escrows" ? (
          escrows.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-white/5">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">No Active Agreements</h3>
              <p className="text-dark-400 text-sm max-w-sm mx-auto">
                You do not have any active escrows. Click &quot;Create Escrow&quot; to set up your first rent agreement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {escrows.map((escrow) => {
                const percentage = Math.min(
                  100,
                  Math.round((escrow.totalFunded / Number(escrow.totalRent)) * 100)
                );
                return (
                  <div key={escrow.id} className="glass-card p-6 flex flex-col justify-between gap-6 hover:border-white/10 transition-all group">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <EscrowLabel contractId={escrow.id} />
                          <p className="text-xs font-mono text-dark-500">{escrow.id.slice(0, 6)}...{escrow.id.slice(-4)}</p>
                        </div>
                        {escrow.status === "funded" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/15 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3" />
                            Funded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/15 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>

                      <FundingProgress
                        totalFunded={escrow.totalFunded}
                        totalRequired={Number(escrow.totalRent)}
                      />
                    </div>

                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                      <div className="space-y-0.5 text-xs">
                        <span className="text-dark-500 font-bold uppercase tracking-wider text-[9px]">Deadline</span>
                        <DeadlineCountdown deadlineEpoch={escrow.deadlineEpoch} />
                      </div>
                      <Link
                        href={`/escrow/${escrow.id}`}
                        className="btn-secondary !py-2 !px-4 !rounded-xl !text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border-white/10 group-hover:border-brand-400/50 group-hover:bg-brand-500/10 group-hover:text-white transition-colors"
                      >
                        Manage
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <PaymentHistoryTab landlordAddress={publicKey || ""} historyItems={releasedEscrows} />
        )}
      </div>
    </main>
  );
}
