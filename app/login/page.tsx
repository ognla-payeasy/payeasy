"use client";

import { useState, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle, Fingerprint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
import { useEmailAuth } from "@/context/EmailAuthContext";
import { registerWebAuthn, authenticateWebAuthn } from "@/lib/auth/webauthn";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useEmailAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [showBiometricsPrompt, setShowBiometricsPrompt] = useState(false);

  useEffect(() => {
    setIsWebAuthnSupported(browserSupportsWebAuthn());
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      if (isWebAuthnSupported) {
        setShowBiometricsPrompt(true);
      } else {
        router.push("/connect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBiometricLogin() {
    if (!email) {
      setError("Please enter your email to log in with biometrics.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authenticateWebAuthn(email);
      window.location.href = "/connect";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Biometric login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterBiometrics() {
    setIsLoading(true);
    setError(null);
    try {
      await registerWebAuthn();
      window.location.href = "/connect";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setTimeout(() => {
        window.location.href = "/connect";
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  }

  if (showBiometricsPrompt) {
    return (
      <main className="brand-canvas relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-soft flex flex-col items-center p-8"
          >
            <span className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-brand-500 text-white">
              <Fingerprint className="h-8 w-8" />
            </span>
            <h1 className="text-center text-2xl font-extrabold tracking-tight">
              Enable Face ID / Fingerprint
            </h1>
            <p className="mt-2 text-center text-muted">
              Sign in faster next time using biometrics?
            </p>

            {error && <p className="mt-4 text-sm text-coral-600">{error}</p>}

            <button
              onClick={handleRegisterBiometrics}
              disabled={isLoading}
              className="btn-pill btn-pill-primary mt-6 w-full !py-3.5"
            >
              {isLoading ? "Setting up…" : "Enable biometrics"}
            </button>
            <button
              onClick={() => router.push("/connect")}
              disabled={isLoading}
              className="btn-pill btn-pill-ghost mt-3 w-full !py-3.5"
            >
              Not now
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
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

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-muted">Sign in to your PayEasy account</p>
          </div>

          <form onSubmit={handleSubmit} className="card-soft space-y-4 p-6 sm:p-7">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-ink">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-canvas py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-faint transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-ink">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-canvas py-3.5 pl-11 pr-11 text-sm text-ink placeholder:text-faint transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-faint transition-colors hover:text-muted"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-coral-200 bg-coral-50 p-3.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-coral-600" />
                <p className="text-sm text-coral-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-pill btn-pill-primary w-full !py-3.5 text-base disabled:opacity-50"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>

            {isWebAuthnSupported && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isLoading}
                className="btn-pill btn-pill-ghost w-full !py-3.5"
              >
                <Fingerprint className="h-5 w-5" />
                Sign in with Face ID / Fingerprint
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
