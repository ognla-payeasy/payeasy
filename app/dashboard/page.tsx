"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLandlordEscrows, getLandlordStats } from "@/lib/stellar/queries";
import EscrowDashboardSkeleton from "@/components/escrow/EscrowDashboardSkeleton";
import FundingProgress from "@/components/escrow/FundingProgress";
import DeadlineCountdown from "@/components/escrow/DeadlineCountdown";

export default function DashboardPage() {
  const router = useRouter();
  const [escrows, setEscrows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true); // Replace with actual auth logic

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // TODO: Replace with actual auth check
      const isConnected = true; // Replace with actual check
      setConnected(isConnected);
      if (!isConnected) {
        router.push("/connect");
        return;
      }
      try {
        const [escrowsData, statsData] = await Promise.all([
          getLandlordEscrows(),
          getLandlordStats(),
        ]);
        setEscrows(escrowsData);
        setStats(statsData);
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  if (!connected) return null;
  if (loading) return <EscrowDashboardSkeleton />;

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-900/40 rounded-xl p-6">
          <div className="text-xs text-dark-500">Total Escrowed</div>
          <div className="text-2xl font-bold">{stats?.totalEscrowed ?? "-"}</div>
        </div>
        <div className="bg-dark-900/40 rounded-xl p-6">
          <div className="text-xs text-dark-500">Active Escrows</div>
          <div className="text-2xl font-bold">{stats?.activeEscrows ?? "-"}</div>
        </div>
        <div className="bg-dark-900/40 rounded-xl p-6">
          <div className="text-xs text-dark-500">Total Released</div>
          <div className="text-2xl font-bold">{stats?.totalReleased ?? "-"}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {escrows.map((escrow) => (
          <div key={escrow.id} className="bg-dark-900/40 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="font-bold text-lg">{escrow.name}</div>
              <button className="btn-primary !py-1.5 !px-4 !text-xs">Release</button>
            </div>
            <FundingProgress funded={escrow.funded} total={escrow.total} />
            <div className="flex justify-between text-xs text-dark-500">
              <div>Roommates: <span className="font-bold text-dark-200">{escrow.roommateCount}</span></div>
              <div>Days to deadline: <DeadlineCountdown deadline={escrow.deadline} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
