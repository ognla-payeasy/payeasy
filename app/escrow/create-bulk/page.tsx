import BulkEscrowForm from "@/components/escrow/BulkEscrowForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Escrow Creation — PayEasy",
  description: "Upload a CSV to initialize multiple Stellar rent escrow agreements in a single batch sequentially.",
};

export default function BulkEscrowPage() {
  return (
    <main aria-label="Bulk Create Escrows" className="relative min-h-screen px-6 py-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-16 h-60 w-60 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute bottom-16 right-16 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <BulkEscrowForm />
      </div>
    </main>
  );
}
