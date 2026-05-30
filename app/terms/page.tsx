import Link from "next/link";
import { ChevronLeft, FileText, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <main aria-label="Terms of Service" className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-6 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-brand-300 transition-all group mb-12 uppercase tracking-widest text-[10px] font-black"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <header className="mb-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-8">
            <FileText size={32} />
          </div>
          <div className="text-dark-500 text-sm italic mb-2">
            Last updated: April 26, 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
            Terms of <span className="text-brand-400">Service</span>
          </h1>
        </header>

        {/* Prominent Testnet Disclaimer */}
        <div className="mb-12 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Testnet Disclaimer</h2>
            <p className="text-red-200/80 font-medium">
              This is a testnet application. Do not use real funds. PayEasy is currently operating on the Stellar Testnet for testing and demonstration purposes only. Any assets used or created on this platform have no real-world value.
            </p>
          </div>
        </div>

        <div className="glass-card p-8 md:p-12 space-y-10 text-dark-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Service Description</h2>
            <p>
              PayEasy is a blockchain-based escrow application designed to facilitate rent sharing and splitting among roommates. It utilizes Stellar smart contracts to provide trustless agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. User Responsibilities</h2>
            <p>
              Users are strictly responsible for maintaining the security of their wallets and private keys. 
              You agree to use this testnet application responsibly and not to engage in any malicious activities, exploits, or network spam.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Limitation of Liability</h2>
            <p>
              The PayEasy platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We do not guarantee the stability of the testnet environment.
              Under no circumstances shall PayEasy or its developers be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
