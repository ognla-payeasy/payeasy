"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  const containerRef = useFocusTrap(isOpen, onClose);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-dark-900/90 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-dark-500 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "mb-6 rounded-2xl p-4",
                    variant === "danger"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-brand-500/10 text-brand-400"
                  )}
                >
                  <AlertTriangle size={32} />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white font-display">
                  {title}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-white/5 px-6 py-4 text-sm font-semibold text-dark-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all active:scale-95",
                    variant === "danger"
                      ? "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      : "bg-brand-500 hover:bg-brand-600 shadow-[0_0_20px_rgba(92,124,250,0.3)]"
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
