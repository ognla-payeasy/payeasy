"use client";

import { useEffect, useRef, useState } from "react";
import { X, Share2, Check, Copy, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareEscrowModalProps {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareEscrowModal({
  contractId,
  isOpen,
  onClose,
}: ShareEscrowModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/escrow/${contractId}`
      : `/escrow/${contractId}`;

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    setQrReady(false);
    import("qrcode")
      .then((QRCode) => {
        if (!canvasRef.current) return;
        return QRCode.toCanvas(canvasRef.current, shareUrl, {
          width: 192,
          margin: 1,
          color: {
            dark: "#ffffff",
            light: "#00000000",
          },
        });
      })
      .then(() => setQrReady(true))
      .catch(() => setQrReady(false));
  }, [isOpen, shareUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "PayEasy Escrow",
        text: "Join my escrow and pay your rent share.",
        url: shareUrl,
      });
    } catch {
      // user cancelled or share not supported
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass-card w-full max-w-sm p-8 space-y-6 relative"
          >
            <button
              onClick={onClose}
              aria-label="Close share modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-dark-400 text-[10px] font-black uppercase tracking-widest">
                <Share2 className="h-3.5 w-3.5 text-brand-400" />
                Share with Roommates
              </div>
              <h2 className="text-xl font-black text-white">Payment Link</h2>
              <p className="text-dark-400 text-sm leading-relaxed">
                {canShare
                  ? "Scan the QR code or use Share to send this escrow link to your roommates."
                  : "Scan the QR code or copy the link to share this escrow with your roommates."}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative">
                {!qrReady && (
                  <div className="absolute inset-4 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={`rounded-lg transition-opacity duration-300 ${qrReady ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Link2 className="h-4 w-4 text-dark-500 shrink-0" />
              <span className="text-dark-300 text-xs font-mono truncate flex-1">
                {shareUrl}
              </span>
              {!canShare && (
                <button
                  onClick={() => void handleCopy()}
                  aria-label="Copy link"
                  className="shrink-0 p-1.5 rounded-lg text-dark-400 hover:text-brand-400 hover:bg-white/5 transition-all"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check className="h-4 w-4 text-accent-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>

            {canShare ? (
              <button
                onClick={() => void handleNativeShare()}
                className="btn-primary w-full !py-3 !rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            ) : (
              <button
                onClick={() => void handleCopy()}
                className="btn-primary w-full !py-3 !rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
