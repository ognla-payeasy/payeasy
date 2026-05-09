"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ContributeForm from "@/components/escrow/ContributeForm";
import { getContractBasicInfo } from "@/lib/stellar/queries";

export default function PayContractPage() {
  const router = useRouter();
  const params = useParams();
  const { contractId } = params as { contractId: string };
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      setLoading(true);
      setError(null);
      try {
        const info = await getContractBasicInfo(contractId);
        setContractInfo(info);
      } catch (e: any) {
        setError("Failed to load contract info");
      } finally {
        setLoading(false);
      }
    }
    if (contractId) fetchInfo();
  }, [contractId]);

  function handleSuccess() {
    router.push(`/escrow/${contractId}`);
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!contractInfo) return <div className="p-8 text-center">Contract not found</div>;

  return (
    <div className="max-w-md mx-auto py-12">
      <ContributeForm contractId={contractId} contractInfo={contractInfo} onSuccess={handleSuccess} />
    </div>
  );
}
