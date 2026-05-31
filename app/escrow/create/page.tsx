import CreateEscrowForm from "@/components/escrow/CreateEscrowForm";
import { useEmailAuth } from "@/context/EmailAuthContext";
import Link from "next/link";

export default function CreateEscrowPage() {
  const { user, isLoading } = useEmailAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <main aria-label="Create Escrow Agreement" className="relative min-h-screen px-6 py-20">
        <div className="relative z-10 max-w-3xl mx-auto rounded-3xl glass p-8 text-center">
          <h1 className="text-3xl font-bold text-dark-100">Sign in to create an escrow</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            You need to be signed in to create escrow agreements.
          </p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-white hover:bg-brand-400">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  if (!user.emailVerified) {
    return (
      <main aria-label="Create Escrow Agreement" className="relative min-h-screen px-6 py-20">
        <div className="relative z-10 max-w-3xl mx-auto rounded-3xl glass p-8 text-center">
          <h1 className="text-3xl font-bold text-dark-100">Verify your email to create an escrow</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Your email address must be verified before you can create a new escrow agreement.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/verify-email" className="inline-flex rounded-xl bg-brand-500 px-5 py-3 text-white hover:bg-brand-400">
              Verify Email
            </Link>
            <Link href="/" className="inline-flex rounded-xl border border-gray-200 bg-transparent px-5 py-3 text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main aria-label="Create Escrow Agreement" className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-16 h-60 w-60 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute bottom-16 right-16 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Landlord Portal</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-dark-100">
            New Rent Escrow Agreement
          </h1>
          <p className="text-dark-500 max-w-2xl mx-auto">
            Configure amount, deadline, and roommate shares, then initialize and configure your escrow agreement on Stellar.
          </p>
        </div>

        <CreateEscrowForm />
      </div>
    </main>
  );
}
