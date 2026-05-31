"use client";

import { AlertTriangle, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface EarlyReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractId: string;
  totalRent: string;
  totalFunded: number;
}

export default function EarlyReleaseModal({
  isOpen,
  onClose,
  onConfirm,
  contractId,
  totalRent,
  totalFunded,
}: EarlyReleaseModalProps) {
  const percentage = Math.min(
    100,
    Math.round((totalFunded / Number(totalRent)) * 100)
  );

  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm early release"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-card w-full max-w-md p-8 space-y-6 relative border border-white/10 bg-[#0c0c14]"
          >
            <button
              onClick={onClose}
              aria-label="Close early release modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-dark-400 text-[10px] font-black uppercase tracking-widest">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                Landlord Action Required
              </div>
              <h2 className="text-xl font-black text-white">
                Confirm Early Release
              </h2>
              <p className="text-dark-400 text-sm leading-relaxed">
                You are requesting an early release of escrow contract{" "}
                <span className="font-mono text-white">
                  {contractId.slice(0, 6)}...{contractId.slice(-4)}
                </span>{" "}
                before it is fully funded.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-500 font-bold uppercase tracking-wider text-xs">Escrow Funding</span>
                <span className="text-amber-400 font-black text-sm">{percentage}% Funded</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-brand-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                <div>
                  <div className="text-[10px] text-dark-500 font-black uppercase tracking-widest mb-1">Target Rent</div>
                  <div className="text-base font-black text-white">{totalRent} XLM</div>
                </div>
                <div>
                  <div className="text-[10px] text-dark-500 font-black uppercase tracking-widest mb-1">Releasing Amount</div>
                  <div className="text-base font-black text-amber-400">{totalFunded} XLM</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold text-amber-200">
              <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
              <p>
                By proceeding, you agree to accept the partial payment of{" "}
                <span className="text-white font-black">{totalFunded} XLM</span>. 
                This action will release the current contract balance to your wallet and mark the contract as finalized.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-600 hover:to-brand-700 shadow-lg shadow-amber-500/20"
              >
                Confirm Release
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
