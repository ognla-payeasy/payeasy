import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main aria-label="Privacy Policy" className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-brand-300 transition-all group mb-12 uppercase tracking-widest text-[10px] font-black"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <header className="mb-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-8">
            <Shield size={32} />
          </div>
          <div className="text-dark-500 text-sm italic mb-2">
            Last updated: April 26, 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Privacy <span className="text-brand-400">Policy</span>
          </h1>
          <p className="text-dark-500 text-xl font-medium max-w-2xl leading-relaxed">
            Your privacy is paramount. This document outlines how we handle your data in the PayEasy ecosystem.
          </p>
        </header>

        <div className="glass-card p-8 md:p-12 space-y-10 text-dark-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Data Collected</h2>
            <p>
              PayEasy is a decentralized platform. We do not store your private keys or personal financial data. 
              We collect your public wallet address and transaction history on the testnet to enable escrow functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. How It&apos;s Used</h2>
            <p>
              Your data is used strictly to facilitate testnet transactions, test the smart contracts, and improve the user experience.
              On-chain data is public by design of the Stellar network. We do not use your data for marketing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Third Parties</h2>
            <p>
              We may share necessary transaction payloads with the Stellar testnet. 
              We do not sell, rent, or trade your personal information with third-party advertisers or data brokers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Contact</h2>
            <p>
              For any privacy-related questions or concerns, please reach out to us at privacy@payeasy.dev.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
