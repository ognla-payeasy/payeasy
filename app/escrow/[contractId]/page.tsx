import type { Metadata } from "next";
import EscrowDashboardClient from "./EscrowDashboardClient";

export async function generateMetadata({ params }: { params: { contractId: string } }): Promise<Metadata> {
  const shortId = params.contractId.length <= 10
    ? params.contractId
    : `${params.contractId.slice(0, 4)}...${params.contractId.slice(-4)}`;
  return {
    title: `Escrow ${shortId} — PayEasy`,
    description: `Manage Stellar escrow contract ${params.contractId} on PayEasy. Trustlessly collect and track rent payments powered by the Stellar blockchain.`,
  };
}

import { getContractState } from "@/lib/stellar/queries";
import EscrowNotFound from "@/components/escrow/EscrowNotFound";

export default async function EscrowDashboardPage({ params }: { params: { contractId: string } }) {
  try {
    const contractState = await getContractState(params.contractId);
    if (!contractState) {
      return <EscrowNotFound />;
    }
  } catch (err) {
    // Contract query failed (e.g., contract not found on-chain or network error)
    return <EscrowNotFound />;
  }

  return <EscrowDashboardClient contractId={params.contractId} />;
}
