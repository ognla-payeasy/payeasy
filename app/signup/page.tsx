"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEmailAuth } from "@/context/EmailAuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useEmailAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrong = password.length >= 8;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordStrong) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      await signup(email, name, password);
      router.push("/connect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">Create your account</h1>
            <p className="mt-2 text-muted">Start splitting rent the easy way</p>
          </div>

          <form onSubmit={handleSubmit} className="card-soft space-y-4 p-6 sm:p-7">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-semibold text-ink">
                Full name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-line bg-canvas py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-faint transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
              {password.length > 0 && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    passwordStrong ? "text-mint-600" : "text-amber-600"
                  }`}
                >
                  {passwordStrong ? <Check size={12} /> : <AlertCircle size={12} />}
                  {passwordStrong
                    ? "Strong enough"
                    : `${8 - password.length} more character${8 - password.length !== 1 ? "s" : ""} needed`}
                </div>
              )}
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
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
