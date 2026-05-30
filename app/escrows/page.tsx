"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, PlusCircle } from "lucide-react";
import EscrowLabel from "@/components/escrow/EscrowLabel";

const REGISTRY_KEY = "escrow_registry";

function loadRegistry(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function EscrowsPage() {
  const [contractIds, setContractIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setContractIds(loadRegistry());
    setMounted(true);
  }, []);

  return (
    <main
      id="main-content"
      aria-label="Escrow Registry"
      className="min-h-screen pt-28 pb-20 relative overflow-hidden bg-[#0a0a0f]"
    >
      <div className="mesh-gradient opacity-40 mix-blend-screen pointer-events-none fixed inset-0" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-5xl">
        <header className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-700 ease-out">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] font-black uppercase tracking-[0.2em]">
              <FileText className="h-4 w-4" />
              Property Registry
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] bg-gradient-to-br from-white via-white to-dark-700 bg-clip-text text-transparent">
                Your <span className="text-brand-400">Escrows</span>
              </h1>
              <p className="text-dark-500 text-lg font-medium max-w-xl">
                Manage and label your active rent escrow agreements.
                Click any name to rename it.
              </p>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
            <Link
              href="/escrow/create"
              className="btn-primary !py-3.5 !px-8 !rounded-2xl font-black uppercase tracking-widest flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              New Escrow
            </Link>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-150">
          {!mounted ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="glass-card p-6 flex items-center justify-between gap-6 animate-pulse"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-white/5 rounded" />
                    <div className="h-3 w-64 bg-white/5 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          ) : contractIds.length === 0 ? (
            <div className="flex flex-col items-center text-center space-y-6 py-20">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <FileText className="h-12 w-12 text-dark-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">No Escrows Yet</h2>
                <p className="text-dark-400 text-base max-w-sm">
                  Escrows you create will appear here with their labels and status.
                </p>
              </div>
              <Link
                href="/escrow/create"
                className="btn-primary !py-3 !px-8 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create Escrow
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contractIds.map((contractId) => (
                <div
                  key={contractId}
                  className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all"
                >
                  <div className="space-y-1.5">
                    <EscrowLabel contractId={contractId} />
                    <p className="text-dark-600 text-xs font-mono pl-0.5">
                      {contractId}
                    </p>
                  </div>
                  <Link
                    href={`/escrow/${contractId}`}
                    className="btn-secondary !py-2 !px-5 !rounded-xl !text-xs font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
