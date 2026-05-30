"use client";

import { useMemo } from "react";
import { Download, ExternalLink, Calendar, ShieldCheck, Tag, Copy, FileSpreadsheet } from "lucide-react";
import { getExplorerLink } from "@/lib/stellar/explorer";
import { useEscrowLabels } from "@/hooks/useEscrowLabels";
import { useToast } from "@/hooks/useToast";

export interface ReleasedEscrow {
  id: string;
  totalRent: string;
  status: "released";
  releaseDate: string;
  txHash: string;
}

interface PaymentHistoryTabProps {
  landlordAddress: string;
  historyItems: ReleasedEscrow[];
}

export default function PaymentHistoryTab({ landlordAddress, historyItems }: PaymentHistoryTabProps) {
  const { getLabel } = useEscrowLabels();
  const toast = useToast();

  const sortedItems = useMemo(() => {
    return [...historyItems].sort((a, b) => 
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  }, [historyItems]);

  function handleCopy(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  function exportToCSV() {
    if (sortedItems.length === 0) {
      toast.error("No payment history to export.");
      return;
    }

    const headers = ["Property Label", "Contract ID", "Total Amount (XLM)", "Status", "Release Date", "Transaction Hash"];
    const rows = sortedItems.map(item => {
      const label = getLabel(item.id) || `Escrow ${item.id.slice(0, 6)}`;
      return [
        `"${label.replace(/"/g, '""')}"`,
        `"${item.id}"`,
        `"${item.totalRent}"`,
        `"${item.status}"`,
        `"${new Date(item.releaseDate).toLocaleString()}"`,
        `"${item.txHash}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payeasy_payment_history_${landlordAddress.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export complete.");
  }

  if (sortedItems.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-white/5">
        <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
          <FileSpreadsheet className="w-8 h-8 text-brand-400" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-wider">No Released Payments</h3>
        <p className="text-dark-400 text-sm max-w-md mx-auto">
          Once you release funds from active escrow agreements, the complete history of those transactions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Payments History Report</h3>
          <p className="text-[10px] text-dark-500 font-bold uppercase tracking-widest">{sortedItems.length} Released Escrows</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-secondary !py-2.5 !px-5 !rounded-xl !text-xs font-black uppercase tracking-widest flex items-center gap-2 border-white/10 hover:border-brand-400/50 hover:bg-brand-500/10"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 pl-6 text-[10px] text-dark-500 font-black uppercase tracking-widest">Property Label</th>
                <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Total Amount</th>
                <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Release Date</th>
                <th className="p-4 pr-6 text-[10px] text-dark-500 font-black uppercase tracking-widest">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedItems.map((item, idx) => {
                const label = getLabel(item.id) || `Escrow ${item.id.slice(0, 6)}`;
                const formattedDate = new Date(item.releaseDate).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                });

                return (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20 text-brand-400">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{label}</p>
                          <p className="text-[10px] text-dark-500 font-mono tracking-tight">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-dark-200">
                      {item.totalRent} <span className="text-[10px] text-dark-600 ml-0.5">XLM</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-accent-500/20 bg-accent-500/15 text-accent-300 text-[9px] font-black uppercase tracking-wider">
                        <ShieldCheck className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-dark-400 font-semibold">
                        <Calendar className="h-4 w-4 text-dark-500" />
                        {formattedDate}
                      </div>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-dark-400 group-hover:text-dark-200 transition-colors">
                          {item.txHash.slice(0, 8)}...{item.txHash.slice(-8)}
                        </span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(item.txHash, "Tx Hash")}
                            className="p-1 rounded-md text-dark-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                            title="Copy Tx Hash"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={getExplorerLink("transaction", item.txHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-dark-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                            title="View on Stellar Expert"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
