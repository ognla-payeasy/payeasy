"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Archive,
  ArchiveRestore,
  FileText,
  PlusCircle,
} from "lucide-react";
import { useStellar } from "@/context/StellarContext";
import { getUserEscrows } from "@/lib/stellar/queries";
import { useArchivedEscrows } from "@/hooks/useArchivedEscrows";
import type { ContractState } from "@/lib/stellar/types";
import RoommateEscrowCard from "@/components/escrow/RoommateEscrowCard";
import SwipeableEscrowCard from "@/components/escrow/SwipeableEscrowCard";
import ShareEscrowModal from "@/components/escrow/ShareEscrowModal";

const ARCHIVABLE_STATUSES: ContractState["status"][] = ["released", "expired"];

export default function EscrowsPage() {
  const router = useRouter();
  const { isConnected, publicKey, isRestoring } = useStellar();
  const [escrows, setEscrows] = useState<ContractState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [shareContractId, setShareContractId] = useState<string | null>(null);

  const { archiveEscrow, unarchiveEscrow, isArchived } = useArchivedEscrows();
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

  const roleEscrows = roleTab === "landlord" ? landlordEscrows : roommateEscrows;

  const visibleEscrows = roleEscrows.filter((e) =>
    showArchived ? isArchived(e.id) : !isArchived(e.id)
  );

  const archivedCount = roleEscrows.filter((e) => isArchived(e.id)).length;

  if (isRestoring || (!isConnected && !publicKey)) return null;

  return (
    <main aria-label="User Escrows" className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none" />

      {shareContractId && (
        <ShareEscrowModal
          contractId={shareContractId}
          isOpen
          onClose={() => setShareContractId(null)}
        />
      )}

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

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            {archivedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-widest text-dark-300 hover:bg-white/10 transition-colors"
              >
                <Archive className="w-4 h-4" />
                {showArchived ? "Show active" : `Archived (${archivedCount})`}
              </button>
            )}
            <Link
              href="/escrow/create"
              className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Escrow
            </Link>
          </div>
        </header>

        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex border-b border-white/10 gap-6 text-sm">
          <button
            type="button"
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
            type="button"
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
        ) : visibleEscrows.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-white/5">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
              {showArchived ? (
                <Archive className="w-8 h-8 text-brand-400" />
              ) : (
                <Wallet className="w-8 h-8 text-brand-400" />
              )}
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              {showArchived ? "No archived escrows" : "No escrows found"}
            </h2>
            <p className="text-dark-400 text-sm max-w-md mx-auto">
              {showArchived
                ? "Archived escrows will appear here."
                : `You don't have any escrow agreements as a ${roleTab === "landlord" ? "landlord" : "roommate"} connected to this wallet yet.`}
            </p>
            {!showArchived && (
              <Link href="/escrow/create" className="btn-primary mt-4">
                Create Your First Escrow
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleEscrows.map((escrow) => {
              const canArchive =
                ARCHIVABLE_STATUSES.includes(escrow.status) && !isArchived(escrow.id);
              const canUnarchive = isArchived(escrow.id);

              if (roleTab === "roommate") {
                const myRoommateState = escrow.roommates.find(
                  (r) => r.address === publicKey
                )!;
                return (
                  <SwipeableEscrowCard
                    key={escrow.id}
                    onShare={() => setShareContractId(escrow.id)}
                    canArchive={false}
                  >
                    <RoommateEscrowCard escrow={escrow} roommate={myRoommateState} />
                  </SwipeableEscrowCard>
                );
              }

              const percentage = Math.min(
                100,
                Math.round((escrow.totalFunded / Number(escrow.totalRent)) * 100)
              );

              const card = (
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
                      <div className="flex items-center gap-2">
                        {escrow.status === "funded" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Funded
                          </span>
                        ) : escrow.status === "released" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Released
                          </span>
                        ) : escrow.status === "expired" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/10 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider border border-gray-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Active
                          </span>
                        )}
                        {canUnarchive && (
                          <button
                            type="button"
                            onClick={() => unarchiveEscrow(escrow.id)}
                            title="Unarchive escrow"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-white/10 transition-colors"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-500 font-bold uppercase tracking-wider">
                          Overall Progress
                        </span>
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
                        <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">
                          Total Rent
                        </div>
                        <div className="text-sm font-bold text-white">{escrow.totalRent} XLM</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-dark-500 font-black uppercase tracking-wider mb-1">
                          Funded So Far
                        </div>
                        <div className="text-sm font-bold text-white">{escrow.totalFunded} XLM</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/escrow/${escrow.id}`}
                    className="flex items-center justify-center w-full gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-black uppercase tracking-widest text-xs border border-white/5"
                  >
                    View Escrow{" "}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              );

              return (
                <SwipeableEscrowCard
                  key={escrow.id}
                  onShare={() => setShareContractId(escrow.id)}
                  onArchive={
                    canArchive ? () => archiveEscrow(escrow.id) : undefined
                  }
                  canArchive={canArchive}
                >
                  {card}
                </SwipeableEscrowCard>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
