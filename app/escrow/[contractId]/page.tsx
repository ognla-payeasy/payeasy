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
  let contractState = null;
  try {
    if (params.contractId.startsWith("ESCROW_")) {
      contractState = {
        id: params.contractId,
        landlord: "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
        totalRent: "1500",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric"
        }),
        deadlineEpoch: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
        status: "active" as const,
        totalFunded: 750,
        lastUpdate: new Date().toISOString(),
        roommates: [
          {
            address: "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
            expectedShare: "750",
            paidAmount: "750",
            isPaid: true
          },
          {
            address: "GBY4H334UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
            expectedShare: "750",
            paidAmount: "0",
            isPaid: false
          }
        ]
      };
    } else {
      contractState = await getContractState(params.contractId);
    }
    if (!contractState) {
      return <EscrowNotFound />;
    }
  } catch (err) {
    // Contract query failed (e.g., contract not found on-chain or network error)
    return <EscrowNotFound />;
  }

  return <EscrowDashboardClient contractId={params.contractId} initialContractState={contractState} />;
}
