"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Clock, ArrowRight, ShieldCheck, AlertCircle, FileText, PlusCircle } from "lucide-react";
import { useStellar } from "@/context/StellarContext";
import { getUserEscrows } from "@/lib/stellar/queries";
import type { ContractState } from "@/lib/stellar/types";
import RoommateEscrowCard from "@/components/escrow/RoommateEscrowCard";

export default function EscrowsPage() {
  const router = useRouter();
  const { isConnected, publicKey, isRestoring } = useStellar();
  const [escrows, setEscrows] = useState<ContractState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleTab, setRoleTab] = useState<"landlord" | "roommate">("landlord");

  useEffect(() => {
    if (!isRestoring && !isConnected) {
      router.push("/connect");
      return;
    }

    async function fetchEscrows() {
      try {
        if (!publicKey) return;
        const data = await getUserEscrows(publicKey);
        setEscrows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    if (publicKey) {
      void fetchEscrows();
    }
  }, [isConnected, publicKey, isRestoring, router]);

  // Separate escrows based on role
  const landlordEscrows = useMemo(() => {
    if (!publicKey) return [];
    return escrows.filter((escrow) => escrow.landlord === publicKey);
  }, [escrows, publicKey]);

  const roommateEscrows = useMemo(() => {
    if (!publicKey) return [];
    return escrows.filter((escrow) =>
      escrow.roommates.some((r) => r.address === publicKey)
    );
  }, [escrows, publicKey]);

  const activeEscrowsList = roleTab === "landlord" ? landlordEscrows : roommateEscrows;

  if (isRestoring || (!isConnected && !publicKey)) return null;

  return (
    <main aria-label="User Escrows" className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-5xl space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-dark-400 text-[10px] font-black uppercase tracking-widest">
              <FileText className="h-3.5 w-3.5 text-brand-500" />
              Property Registry
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
              Your <span className="text-brand-400">Escrows</span>
            </h1>
            <p className="text-dark-500 text-sm md:text-base max-w-xl font-medium">
              Manage and view all rent agreements associated with your connected wallet.
            </p>
          </div>

          <Link
            href="/escrow/create"
            className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Create Escrow
          </Link>
        </header>

        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Role Tab Selection */}
        <div className="flex border-b border-white/10 gap-6 text-sm">
          <button
            onClick={() => setRoleTab("landlord")}
            className={`pb-4 font-black uppercase tracking-widest transition-all text-xs ${
              roleTab === "landlord"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-dark-500 hover:text-white"
            }`}
          >
            As Landlord
          </button>
          <button
            onClick={() => setRoleTab("roommate")}
            className={`pb-4 font-black uppercase tracking-widest transition-all text-xs ${
              roleTab === "roommate"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-dark-500 hover:text-white"
            }`}
          >
            As Roommate
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 h-56 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : activeEscrowsList.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-white/5">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
              <Wallet className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">No escrows found</h2>
            <p className="text-dark-400 text-sm max-w-md mx-auto">
              You don&apos;t have any active or funded escrow agreements as a {roleTab === "landlord" ? "landlord" : "roommate"} connected to this wallet yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeEscrowsList.map((escrow) => {
              if (roleTab === "roommate") {
                const myRoommateState = escrow.roommates.find(
                  (r) => r.address === publicKey
                )!;
                return (
                  <RoommateEscrowCard
                    key={escrow.id}
                    escrow={escrow}
                    roommate={myRoommateState}
                  />
                );
              }

              // Landlord view card
              const percentage = Math.min(
                100,
                Math.round((escrow.totalFunded / Number(escrow.totalRent)) * 100)
              );
              return (
                <div key={escrow.id} className="glass-card p-6 flex flex-col justify-between gap-6 hover:-translate-y-1 transition-all duration-300 group border border-white/5 bg-white/[0.02]">
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

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-500 font-bold uppercase tracking-wider">Overall Progress</span>
                        <span className="text-brand-400 font-bold">{percentage}% Funded</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-500 to-accent-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">Total Rent</div>
                        <div className="text-sm font-bold text-white">{escrow.totalRent} XLM</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">Funded So Far</div>
                        <div className="text-sm font-bold text-white">{escrow.totalFunded} XLM</div>
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
            })}
          </div>
        )}
      </div>
    </main>
  );
}
