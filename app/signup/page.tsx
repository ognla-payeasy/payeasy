"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayEasyLogo } from "@/components/ui/payeasy-logo";
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
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(92,124,250,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(32,201,151,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-16 py-5"
      >
        <Link href="/">
          <PayEasyLogo size={30} />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </motion.div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mb-8 p-5 rounded-2xl glass-card"
            style={{ boxShadow: "0 0 40px rgba(32,201,151,0.15)" }}
          >
            <UserPlus className="w-10 h-10 text-accent-400" />
          </motion.div>

          <h1 className="text-4xl font-bold text-center text-white mb-2 font-display">
            Create <span className="gradient-text">Account</span>
          </h1>
          <p className="text-dark-400 text-center mb-8">
            Start splitting rent with Stellar escrow
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-widest text-dark-500 font-semibold font-display"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-dark-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-widest text-dark-500 font-semibold font-display"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-dark-950/60 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-widest text-dark-500 font-semibold font-display"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-dark-950/60 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-dark-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center gap-1.5 text-xs ${
                    passwordStrong ? "text-accent-400" : "text-amber-400"
                  }`}
                >
                  {passwordStrong ? (
                    <Check size={12} />
                  ) : (
                    <AlertCircle size={12} />
                  )}
                  {passwordStrong
                    ? "Strong enough"
                    : `${8 - password.length} more character${8 - password.length !== 1 ? "s" : ""} needed`}
                </motion.div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 glass-card p-3.5 border-red-500/20 bg-red-500/5"
                style={{ borderColor: "rgba(239,68,68,0.2)" }}
              >
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl" />
              <div className="relative flex items-center justify-center gap-3 bg-dark-950 hover:bg-dark-900 rounded-[15px] px-8 py-4 transition-colors">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5 text-brand-400" />
                )}
                <span className="text-white font-semibold text-lg font-display">
                  {isLoading ? "Creating account…" : "Create Account"}
                </span>
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-dark-600 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-dark-400 text-sm text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
