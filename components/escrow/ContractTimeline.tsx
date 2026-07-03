"use client";

import { useEffect, useState, useMemo } from "react";
import { createHorizonClient, fetchTransactionHistory } from "@/lib/stellar/history";
import { fetchContractEvents, createSdkEventServer } from "@/lib/stellar/events";
import { rpcServer } from "@/lib/stellar/config";
import type { ContractState } from "@/lib/stellar/types";
import { 
  Plus, 
  UserPlus, 
  Coins, 
  CheckCircle2, 
  ShieldCheck, 
  XCircle,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react";
import { getExplorerLink } from "@/lib/stellar/explorer";

interface ContractTimelineProps {
  contractId: string;
  contractState: ContractState;
}

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: string | null;
  status: "completed" | "current" | "upcoming";
  txHash: string | null;
}

export default function ContractTimeline({ contractId, contractState }: ContractTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate fallback items from contractState
  const fallbackItems = useMemo((): TimelineItem[] => {
    const { status, totalFunded, totalRent, roommates, lastUpdate, deadline } = contractState;
    const rentVal = Number(totalRent);
    const fundedVal = totalFunded;

    // 1. Created
    const createdDate = lastUpdate ? new Date(lastUpdate).toISOString() : new Date().toISOString();
    
    // 2. Roommates Added
    const hasRoommates = roommates && roommates.length > 0;
    const roommatesText = hasRoommates ? `${roommates.length} roommates registered` : "Awaiting roommate registry";

    // 3. First Contribution
    const hasContributions = fundedVal > 0;
    
    // 4. Fully Funded
    const isFullyFunded = status === "funded" || status === "released" || fundedVal >= rentVal;

    // 5. Released / Expired
    const isReleased = status === "released";
    const isExpired = status === "expired";

    return [
      {
        id: "created",
        title: "Escrow Created",
        description: "Rent escrow agreement initialized on the Stellar ledger.",
        timestamp: createdDate,
        status: "completed",
        txHash: null,
      },
      {
        id: "roommates_added",
        title: "Roommates Registered",
        description: roommatesText,
        timestamp: hasRoommates ? createdDate : null,
        status: hasRoommates ? "completed" : "current",
        txHash: null,
      },
      {
        id: "first_contribution",
        title: "First Contribution",
        description: hasContributions ? "Initial deposit contributed towards rent goal." : "Awaiting first roommate contribution.",
        timestamp: hasContributions ? createdDate : null,
        status: hasContributions ? "completed" : (!hasRoommates ? "upcoming" : "current"),
        txHash: null,
      },
      {
        id: "fully_funded",
        title: "Fully Funded",
        description: isFullyFunded ? "100% of the rent goal has been collected." : `Rent split progress: ${fundedVal} / ${rentVal} XLM.`,
        timestamp: isFullyFunded ? createdDate : null,
        status: isFullyFunded ? "completed" : (!hasContributions ? "upcoming" : "current"),
        txHash: null,
      },
      {
        id: "released_expired",
        title: isExpired ? "Agreement Expired" : "Agreement Released",
        description: isReleased 
          ? "Rent funds successfully released to landlord." 
          : isExpired 
            ? "Deadline passed without full funding. Refunds available." 
            : `Awaiting agreement release (Deadline: ${deadline}).`,
        timestamp: (isReleased || isExpired) ? createdDate : null,
        status: (isReleased || isExpired) ? "completed" : (!isFullyFunded ? "upcoming" : "current"),
        txHash: null,
      }
    ];
  }, [contractState]);

  useEffect(() => {
    let active = true;

    async function fetchOnChainHistory() {
      if (!contractId || contractId.startsWith("ESCROW_")) {
        // Keep mock/fallback timeline for mock IDs
        setTimelineItems(fallbackItems);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const client = createHorizonClient();
        const txHistory = await fetchTransactionHistory({
          client,
          accountId: contractId,
          limit: 50,
          order: "asc",
        });

        // Soroban RPC only retains recent history, so anchor the event
        // query to a window behind the latest ledger.
        const latestLedger = await rpcServer.getLatestLedger();
        const startLedger = Math.max(1, latestLedger.sequence - 17000);
        const sorobanEvents = await fetchContractEvents({
          server: createSdkEventServer(rpcServer, startLedger),
          contractId,
        });

        if (!active) return;

        // Map events with actual timestamps and hashes
        const items = [...fallbackItems];

        // 1. Created timestamp
        const firstTx = txHistory.transactions[0];
        if (firstTx) {
          items[0].timestamp = firstTx.timestamp;
          items[0].txHash = firstTx.hash;
        }

        // 2. Roommates Added
        // Use either initialize or subsequent transactions
        if (firstTx) {
          items[1].timestamp = firstTx.timestamp;
          items[1].txHash = firstTx.hash;
        }

        // 3. First Contribution
        const contributionEvents = sorobanEvents.events.filter(e => e.type === "Contribution");
        if (contributionEvents.length > 0) {
          items[2].timestamp = contributionEvents[0].timestamp;
          items[2].txHash = contributionEvents[0].txHash;
          items[2].status = "completed";
        }

        // 4. Fully Funded
        if (contractState.status === "funded" || contractState.status === "released") {
          // Find the contribution event that completed it, or default to the last one
          const lastContribution = contributionEvents[contributionEvents.length - 1];
          if (lastContribution) {
            items[3].timestamp = lastContribution.timestamp;
            items[3].txHash = lastContribution.timestamp;
            items[3].status = "completed";
          }
        }

        // 5. Released
        const releasedEvent = sorobanEvents.events.find(e => e.type === "AgreementReleased");
        if (releasedEvent) {
          items[4].title = "Agreement Released";
          items[4].timestamp = releasedEvent.timestamp;
          items[4].txHash = releasedEvent.txHash;
          items[4].status = "completed";
          items[4].description = "Rent funds successfully released to landlord.";
        }

        setTimelineItems(items);
      } catch (e) {
        console.error("Horizon/Soroban timeline query failed, falling back to state:", e);
        if (active) {
          setTimelineItems(fallbackItems);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchOnChainHistory();

    return () => {
      active = false;
    };
  }, [contractId, contractState, fallbackItems]);

  const getStepIcon = (id: string, status: "completed" | "current" | "upcoming") => {
    const baseClass = "h-5 w-5";
    
    if (status === "completed") {
      if (id === "released_expired" && contractState.status === "expired") {
        return <XCircle className={`${baseClass} text-red-400`} />;
      }
      if (id === "released_expired") {
        return <ShieldCheck className={`${baseClass} text-accent-400`} />;
      }
      return <CheckCircle2 className={`${baseClass} text-brand-400`} />;
    }
    
    if (status === "current") {
      return <Clock className={`${baseClass} text-brand-300 animate-pulse`} />;
    }

    switch (id) {
      case "created":
        return <Plus className={`${baseClass} text-dark-500`} />;
      case "roommates_added":
        return <UserPlus className={`${baseClass} text-dark-500`} />;
      case "first_contribution":
        return <Coins className={`${baseClass} text-dark-500`} />;
      case "fully_funded":
        return <Coins className={`${baseClass} text-dark-500`} />;
      default:
        return <Clock className={`${baseClass} text-dark-500`} />;
    }
  };

  return (
    <div className="glass-card p-8 border border-white/5 space-y-6">
      <header className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">
            Contract Status Timeline
          </h3>
          <p className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">
            On-chain Lifecycle History
          </p>
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 text-brand-400 animate-spin" />
        )}
      </header>

      <div className="relative pl-6 border-l border-white/10 space-y-8 py-2">
        {timelineItems.map((item, idx) => {
          const isCompleted = item.status === "completed";
          const isCurrent = item.status === "current";
          
          return (
            <div key={item.id} className="relative group">
              {/* Bullet Node */}
              <div className={`absolute -left-[37px] top-0.5 p-1 rounded-full border transition-all duration-300 ${
                isCompleted 
                  ? "bg-brand-500/10 border-brand-500/30 text-brand-400" 
                  : isCurrent 
                    ? "bg-brand-400/20 border-brand-400/50 text-brand-300 scale-110 shadow-[0_0_10px_rgba(92,124,250,0.3)]" 
                    : "bg-dark-900 border-white/5 text-dark-500"
              }`}>
                {getStepIcon(item.id, item.status)}
              </div>

              {/* Content */}
              <div className="space-y-1 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={`text-sm font-black uppercase tracking-wider ${
                    isCompleted ? "text-white" : isCurrent ? "text-brand-300" : "text-dark-500"
                  }`}>
                    {item.title}
                  </h4>
                  {item.timestamp && (
                    <span className="text-[10px] text-dark-500 font-mono">
                      {new Date(item.timestamp).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                      })}
                    </span>
                  )}
                  {item.txHash && (
                    <a
                      href={getExplorerLink("transaction", item.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md text-dark-600 hover:text-brand-400 hover:bg-white/5 transition-all outline-none"
                      title="View transaction on Explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className={`text-xs ${
                  isCompleted ? "text-dark-300" : isCurrent ? "text-dark-400" : "text-dark-600"
                }`}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
