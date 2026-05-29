"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Clock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useStellarAuth } from "@/context/StellarContext";
import { getUserEscrows } from "@/lib/stellar/queries";
import type { ContractState } from "@/lib/stellar/types";

export default function EscrowsPage() {
  const router = useRouter();
  const { isConnected, publicKey } = useStellarAuth();
  const [escrows, setEscrows] = useState<ContractState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
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

    void fetchEscrows();
  }, [isConnected, publicKey, router]);

  if (!isConnected) return null;

  return (
    <main aria-label="User Escrows" className="container mx-auto max-w-5xl px-4 py-32 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your Escrows
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage and view all rent agreements associated with your wallet.
          </p>
        </div>
        <Link
          href="/escrow/create"
          className="btn-primary !py-2.5 !px-5 !text-sm !rounded-lg shrink-0"
        >
          Create Escrow
        </Link>
      </div>

      {error && (
        <div className="glass-card p-4 border border-red-500/20 bg-red-500/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : escrows.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
            <Wallet className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No escrows found</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You don&apos;t have any active or funded escrow agreements connected to this wallet yet.
          </p>
          <Link
            href="/escrow/create"
            className="btn-primary mt-4"
          >
            Create Your First Escrow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {escrows.map((escrow) => (
            <div key={escrow.id} className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300 group">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-brand-400 mb-1">
                    {escrow.id}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                      {Math.round((escrow.totalFunded / Number(escrow.totalRent)) * 100)}% Funded
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 to-accent-500" 
                      style={{ width: `${Math.min(100, Math.round((escrow.totalFunded / Number(escrow.totalRent)) * 100))}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Rent</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{escrow.totalRent} XLM</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Funded</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{escrow.totalFunded} XLM</div>
                  </div>
                </div>
              </div>

              <Link
                href={`/escrow/${escrow.id}`}
                className="flex items-center justify-center w-full gap-2 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl transition-colors font-medium text-sm"
              >
                View Escrow <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
