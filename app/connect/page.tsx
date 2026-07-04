"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Shield,
  Zap,
  Globe,
  ArrowLeft,
  Check,
  ExternalLink,
  AlertCircle,
  Loader2,
  LogOut,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { getExplorerLink } from "@/lib/stellar/explorer";
import { useStellar } from "@/context/StellarContext";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OnboardingCard } from "@/components/ui/onboarding-card";
import { isOnboarded, markOnboarded } from "@/components/ui/onboarding-card.helpers";
import FundTestnetButton from "@/components/wallet/FundTestnetButton";
import { getFreighterNetwork, isFreighterVersionSupported } from "@/lib/stellar/wallet";
import { getCurrentNetwork } from "@/lib/stellar/config";
import CopyButton from "@/components/ui/copy-button";

const FEATURES = [
  {
    icon: Shield,
    title: "Your money, protected",
    description: "Funds are held safely in escrow — never in anyone's personal account.",
  },
  {
    icon: Zap,
    title: "Settles in seconds",
    description: "Payments clear in about five seconds, with fees you'll never notice.",
  },
  {
    icon: Globe,
    title: "Pay from anywhere",
    description: "Split rent with roommates across the hall or across the world.",
  },
];

type Step = "intro" | "connecting" | "connected";

export default function ConnectWalletPage() {
  const {
    publicKey,
    isConnected,
    isFreighterInstalled,
    isConnecting,
    connect,
    disconnect,
    error,
  } = useStellar();

  const [step, setStep] = useState<Step>("intro");
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingNetwork, setCheckingNetwork] = useState(false);
  const [freighterNetwork, setFreighterNetwork] = useState<"TESTNET" | "MAINNET" | null>(null);
  const [isVersionOutdated, setIsVersionOutdated] = useState(false);

  const { balance, isLoading: isBalanceLoading } = useWalletBalance(
    publicKey ?? null,
    isConnected
  );

  useEffect(() => {
    if (isConnected && publicKey) {
      setStep("connected");
      if (!isOnboarded()) setShowOnboarding(true);
    } else if (isConnecting) {
      setStep("connecting");
    } else {
      setStep("intro");
    }
  }, [isConnected, isConnecting, publicKey]);

  const handleDismissOnboarding = () => {
    markOnboarded();
    setShowOnboarding(false);
  };

  const handleConnect = async () => {
    setStep("connecting");
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setStep("intro");
  };

  const confirmDisconnect = () => setShowDisconnectConfirm(true);

  useEffect(() => {
    if (isConnected && publicKey) {
      setCheckingNetwork(true);
      getFreighterNetwork()
        .then(setFreighterNetwork)
        .catch(() => setFreighterNetwork(null))
        .finally(() => setCheckingNetwork(false));
    } else {
      setFreighterNetwork(null);
    }
  }, [isConnected, publicKey]);

  useEffect(() => {
    if (!isFreighterInstalled) return;
    isFreighterVersionSupported().then((supported) => {
      setIsVersionOutdated(supported === false);
    });
  }, [isFreighterInstalled]);

  return (
    <main
      id="main-content"
      aria-label="Set up payments"
      className="brand-canvas relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 45% at 25% 15%, rgba(47,91,255,0.08) 0%, transparent 60%), radial-gradient(45% 40% at 85% 85%, rgba(255,107,74,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" aria-label="PayEasy home">
          <PayEasyLogo size={28} />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ── INTRO ── */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500 text-white shadow-[0_20px_50px_-15px_rgba(47,91,255,0.6)]">
                <Wallet className="h-8 w-8" />
              </span>

              <h1 className="mt-7 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
                Set up your payments
              </h1>
              <p className="mt-4 max-w-md text-center text-lg leading-relaxed text-muted">
                Connect a Stellar wallet to start splitting rent with protected
                payments. Secure, instant, and always in your control.
              </p>

              {isVersionOutdated && (
                <div className="mt-6 w-full rounded-2xl border border-coral-200 bg-coral-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-coral-700">
                        Please update Freighter to version 10 or newer.
                      </p>
                      <a
                        href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Update on Chrome Web Store <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {!isFreighterInstalled ? (
                <div className="mt-8 w-full">
                  <div className="card-soft flex items-start gap-4 p-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Freighter wallet required</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        Install the free Freighter browser extension to connect
                        your Stellar wallet to PayEasy.
                      </p>
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Get Freighter <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 w-full space-y-4">
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="btn-pill btn-pill-primary w-full !py-4 text-base disabled:opacity-50"
                  >
                    <Wallet className="h-5 w-5" />
                    Connect with Freighter
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-mint-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-mint-500" />
                    Freighter detected
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 w-full rounded-2xl border border-coral-200 bg-coral-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
                    <p className="flex-1 text-sm text-coral-700">{error.message}</p>
                  </div>
                  <button
                    onClick={() => setErrorExpanded((v) => !v)}
                    className="ml-8 mt-2 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${errorExpanded ? "rotate-180" : ""}`}
                    />
                    What does this mean?
                  </button>
                  {errorExpanded && (
                    <p className="ml-8 mt-2 border-l-2 border-coral-200 pl-3 text-xs leading-relaxed text-muted">
                      {error.help}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-10 grid w-full grid-cols-1 gap-3">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{feature.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── CONNECTING ── */}
          {step === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <span className="grid h-20 w-20 place-items-center rounded-3xl border border-line bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
              </span>
              <h2 className="mt-7 text-3xl font-extrabold tracking-tight">Connecting…</h2>
              <p className="mt-3 max-w-sm text-center leading-relaxed text-muted">
                Approve the connection request in your Freighter wallet. A popup
                should appear in a moment.
              </p>
            </motion.div>
          )}

          {/* ── CONNECTED ── */}
          {step === "connected" && publicKey && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-mint-500 text-white shadow-[0_20px_50px_-15px_rgba(18,184,134,0.6)]">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
              <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                You&apos;re all set
              </h2>
              <p className="mt-2 text-center text-muted">
                Your wallet is connected and ready to split rent.
              </p>

              {/* Network badge */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {(() => {
                  const isAppTestnet = getCurrentNetwork() === "testnet";
                  return (
                    <span
                      className={`chip ${isAppTestnet ? "chip-paid" : "chip-wait"}`}
                    >
                      <span
                        className={`h-2 w-2 animate-pulse rounded-full ${isAppTestnet ? "bg-mint-500" : "bg-amber-500"}`}
                      />
                      {isAppTestnet ? "Testnet" : "Mainnet"}
                    </span>
                  );
                })()}
                {checkingNetwork && <Loader2 className="h-4 w-4 animate-spin text-faint" />}
              </div>

              {freighterNetwork !== null &&
                (() => {
                  const isAppTestnet = getCurrentNetwork() === "testnet";
                  const isFreighterTestnet = freighterNetwork === "TESTNET";
                  const mismatch = isAppTestnet !== isFreighterTestnet;
                  return mismatch ? (
                    <div className="mt-4 w-full rounded-2xl border border-coral-200 bg-coral-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
                        <div>
                          <p className="text-sm font-semibold text-coral-700">Network mismatch</p>
                          <p className="text-xs text-coral-600">
                            Switch Freighter to {isAppTestnet ? "Testnet" : "Mainnet"}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-mint-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-500" />
                      Network synchronized
                    </div>
                  );
                })()}

              {/* Address card */}
              <div className="card-soft mt-6 w-full space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-faint">
                    Your address
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-mint-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-mint-500" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-canvas px-4 py-3 font-mono text-sm text-ink">
                    {publicKey}
                  </code>
                  <CopyButton
                    value={publicKey}
                    label="Copy wallet address"
                    size={18}
                    className="shrink-0 rounded-xl border border-line bg-white !p-3 text-muted transition-colors hover:bg-canvas"
                  />
                  <a
                    href={getExplorerLink("account", publicKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl border border-line bg-white p-3 text-muted transition-colors hover:bg-canvas"
                    title="View on Stellar Expert"
                    aria-label="View on Stellar Expert"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
                <div className="flex items-center justify-between border-t border-line-soft pt-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-faint">
                    Balance
                  </span>
                  {isBalanceLoading ? (
                    <span className="h-4 w-24 animate-pulse rounded bg-line" />
                  ) : (
                    <span className="font-mono text-sm font-semibold text-ink">
                      {balance != null ? `${balance} XLM` : "—"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 w-full">
                <FundTestnetButton publicKey={publicKey} />
              </div>

              {showOnboarding && (
                <div className="mt-4 w-full">
                  <OnboardingCard onDismiss={handleDismissOnboarding} />
                </div>
              )}

              <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href="/escrow/create" className="btn-pill btn-pill-primary !py-3.5">
                  Start a rent split
                  <ChevronRight size={16} />
                </Link>
                <Link href="/escrows" className="btn-pill btn-pill-ghost !py-3.5">
                  View my splits
                </Link>
              </div>

              <button
                onClick={confirmDisconnect}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-coral-600"
              >
                <LogOut size={14} />
                Disconnect wallet
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="fixed bottom-6 text-center text-xs text-faint">
        Powered by Stellar. Your keys never leave your browser.
      </p>

      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={handleDisconnect}
        title="Disconnect wallet?"
        description="You'll need to reconnect to start new rent splits or manage your existing ones."
        confirmText="Disconnect"
        variant="danger"
      />
    </main>
  );
}
