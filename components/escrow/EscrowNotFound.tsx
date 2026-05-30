import Link from "next/link";
import { SearchX, History, PlusCircle, ArrowLeft } from "lucide-react";

export default function EscrowNotFound() {
  return (
    <main className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.05),transparent_50%)] pointer-events-none" />
      <div className="mesh-gradient opacity-20 mix-blend-screen pointer-events-none fixed inset-0 saturate-150" />

      <div className="relative z-10 w-full max-w-lg px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="glass-card p-10 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/20 via-brand-500/50 to-red-500/20" />
          
          <div className="mx-auto w-20 h-20 bg-dark-900/80 rounded-3xl border border-white/5 shadow-2xl flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500">
            <SearchX className="h-10 w-10 text-brand-400" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white tracking-tight">Escrow not found</h1>
            <p className="text-dark-400 text-sm leading-relaxed">
              We couldn&apos;t locate an escrow agreement with that ID. Check the contract ID and try again, or explore your existing agreements.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/history"
              className="flex-1 btn-secondary !py-3.5 !rounded-xl !border-white/5 hover:!border-white/20 transition-all font-bold group"
            >
              <History className="h-4 w-4 mr-2 text-dark-400 group-hover:text-brand-400 transition-colors" />
              Go to History
            </Link>
            <Link 
              href="/create"
              className="flex-1 btn-primary !py-3.5 !rounded-xl shadow-lg shadow-brand-500/20 font-bold group"
            >
              <PlusCircle className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90 duration-300" />
              Create New Escrow
            </Link>
          </div>

          <div className="pt-6 border-t border-white/5 text-left">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-[11px] font-black uppercase tracking-widest text-dark-500 hover:text-brand-400 transition-colors"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Return to Registry
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-accent-500/5 blur-[120px] rounded-full pointer-events-none" />
    </main>
  );
}
