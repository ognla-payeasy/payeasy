"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus("error");
          setMessage(data.error || "Verification failed. Please request a new link.");
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified. You can now create escrows.");
      } catch (error) {
        setStatus("error");
        setMessage("Unable to verify email. Please try again later.");
      }
    };

    verify();
  }, [token]);

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Verification</h1>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => router.push("/escrow/create")}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            Go to Create Escrow
          </button>
        </div>
      </div>
    </main>
  );
}
