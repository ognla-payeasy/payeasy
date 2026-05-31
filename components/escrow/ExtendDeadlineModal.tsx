"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  DeadlineNotLaterError,
  extendDeadline,
} from "@/lib/stellar/actions/extendDeadline";

interface ExtendDeadlineModalProps {
  contractId: string;
  landlordAddress: string;
  /** Current on-chain deadline in Unix seconds. */
  currentDeadlineEpoch: number;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Fired when the contract confirms the new deadline. Receives the new
   * deadline epoch in Unix seconds so the caller can show an in-app banner
   * (see acceptance criteria: notify all roommates).
   */
  onExtended: (newDeadlineEpoch: number) => void;
}

const MIN_BUFFER_SECONDS = 60 * 60; // require at least 1 hour beyond current

function epochToInputValue(epoch: number): string {
  // Returns a "YYYY-MM-DDTHH:mm" value suitable for <input type="datetime-local">.
  // We render in the user's local timezone to match the picker semantics.
  const date = new Date(epoch * 1000);
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function inputValueToEpoch(value: string): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
}

/**
 * Landlord-only modal for requesting a deadline extension on an active escrow.
 *
 * Acceptance criteria:
 *   - Date picker; new deadline must be strictly after the current one
 *   - On success, the new deadline reflects immediately on the dashboard
 *     (parent refreshes contract state via `onExtended`)
 *   - Errors from the wallet / contract are surfaced inline rather than
 *     thrown to the caller
 */
export default function ExtendDeadlineModal({
  contractId,
  landlordAddress,
  currentDeadlineEpoch,
  isOpen,
  onClose,
  onExtended,
}: ExtendDeadlineModalProps) {
  const defaultProposedEpoch = currentDeadlineEpoch + MIN_BUFFER_SECONDS * 24; // +1 day
  const [deadlineInput, setDeadlineInput] = useState(() =>
    epochToInputValue(defaultProposedEpoch)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the modal reopens so stale values don't linger.
  useEffect(() => {
    if (isOpen) {
      setDeadlineInput(epochToInputValue(defaultProposedEpoch));
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultProposedEpoch]);

  const minPickerValue = useMemo(
    () => epochToInputValue(currentDeadlineEpoch + MIN_BUFFER_SECONDS),
    [currentDeadlineEpoch]
  );

  const currentDeadlineLabel = useMemo(
    () => new Date(currentDeadlineEpoch * 1000).toLocaleString(),
    [currentDeadlineEpoch]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const newEpoch = inputValueToEpoch(deadlineInput);
    if (newEpoch === null) {
      setError("Please choose a valid date and time.");
      return;
    }

    if (newEpoch <= currentDeadlineEpoch) {
      setError("New deadline must be after the current deadline.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await extendDeadline({
        contractId,
        landlordAddress,
        newDeadlineEpoch: newEpoch,
        currentDeadlineEpoch,
      });
      onExtended(result.newDeadlineEpoch);
      onClose();
    } catch (err) {
      if (err instanceof DeadlineNotLaterError) {
        setError("New deadline must be after the current deadline.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to extend deadline.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget && !isSubmitting) {
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
          aria-label="Request deadline extension"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-card w-full max-w-md p-8 space-y-6 relative"
          >
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close extend deadline modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-dark-400 text-[10px] font-black uppercase tracking-widest">
                <Calendar className="h-3.5 w-3.5 text-brand-400" />
                Landlord Action
              </div>
              <h2 className="text-xl font-black text-white">
                Extend Funding Deadline
              </h2>
              <p className="text-dark-400 text-sm leading-relaxed">
                Give roommates more time to contribute. The new deadline must be
                after{" "}
                <span className="text-dark-200 font-bold">
                  {currentDeadlineLabel}
                </span>
                . All roommates will be notified in-app once confirmed on-chain.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-dark-500">
                  New Deadline
                </span>
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  min={minPickerValue}
                  required
                  disabled={isSubmitting}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white placeholder-dark-500 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50"
                  aria-describedby="extend-deadline-helper"
                />
                <span
                  id="extend-deadline-helper"
                  className="block text-[11px] font-medium text-dark-500"
                >
                  Use your local timezone. We require at least one hour past the
                  current deadline.
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-medium text-red-200"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-secondary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extending…
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Request Extension
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
