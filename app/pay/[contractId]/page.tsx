"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet, Info } from "lucide-react";
import ContributeForm from "@/components/escrow/ContributeForm";
import useFreighter from "@/hooks/useFreighter.ts";
import {
  getContractState,
} from "@/lib/stellar/queries";
import type { ContractState } from "@/lib/stellar/types";

export default function PayContractPage() {
  const router = useRouter();
  const params = useParams();
  const { contractId } = params as { contractId: string };
  const { isConnected, connect, publicKey } = useFreighter();
  const [contractState, setContractState] = useState<ContractState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchState() {
      setLoading(true);
      setError(null);
      try {
        const state = await getContractState(contractId);
        setContractState(state);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load contract details: ${message}`);
      } finally {
        setLoading(false);
      }
    }
    if (contractId) fetchState();
  }, [contractId]);

  function handleSuccess() {
    router.push(`/escrow/${contractId}`);
  }

  if (loading) return <div className="p-8 text-center text-dark-400">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!contractState) return <div className="p-8 text-center text-dark-400">Contract not found</div>;

  if (!isConnected || !publicKey) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="glass-card p-6 sm:p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-400/20">
            <Wallet className="h-8 w-8 text-brand-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Connect Your Wallet</h2>
            <p className="text-sm text-dark-400">
              Please connect your Freighter wallet to verify your roommate status and make a payment.
            </p>
          </div>
          <button
            onClick={connect}
            className="w-full btn-primary !py-4 !text-base shadow-xl shadow-brand-500/30"
          >
            Connect Freighter Wallet
          </button>
        </div>
      </div>
    );
  }

  const isLandlord = contractState.landlord === publicKey;
  const currentRoommate = contractState.roommates.find(
    (r) => r.address === publicKey
  );

  if (isLandlord) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="glass-card p-6 sm:p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-400/20">
            <Info className="h-8 w-8 text-yellow-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Landlord View</h2>
            <p className="text-sm text-dark-400">
              You are connected as the landlord ({publicKey.slice(0, 6)}...{publicKey.slice(-6)}).
              Only roommates can contribute payments.
            </p>
          </div>
          <button
            onClick={() => router.push(`/escrow/${contractId}`)}
            className="w-full btn-secondary !py-3 !text-sm"
          >
            Go to Escrow Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoommate) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="glass-card p-6 sm:p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-400/20">
            <Info className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Not a Participant</h2>
            <p className="text-sm text-dark-400">
              Your connected wallet ({publicKey.slice(0, 6)}...{publicKey.slice(-6)}) is not registered as a roommate on this contract.
            </p>
          </div>
          <button
            onClick={() => router.push("/escrows")}
            className="w-full btn-secondary !py-3 !text-sm"
          >
            Back to My Escrows
          </button>
        </div>
      </div>
    );
  }

  const expectedShare = currentRoommate.expectedShare;
  const remainingBalance = (
    Number(currentRoommate.expectedShare) - Number(currentRoommate.paidAmount)
  ).toFixed(2).replace(/\.00$/, "");

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <ContributeForm
        escrowId={contractId}
        expectedShare={expectedShare}
        remainingBalance={remainingBalance}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

