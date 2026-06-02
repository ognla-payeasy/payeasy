"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStellar } from "@/context/StellarContext";
import DateRangeFilter from "@/components/history/DateRangeFilter";
import { getCurrentXlmPrice, convertXlmToUsd } from "@/lib/utils/price-api";
import { useEscrowLabels } from "@/hooks/useEscrowLabels";
import { Download, Printer, TrendingUp, Copy, ExternalLink, Calendar } from "lucide-react";
import { getExplorerLink } from "@/lib/stellar/explorer";
import { useToast } from "@/hooks/useToast";

interface ReleasedEscrow {
  id: string;
  totalRent: string;
  status: "released";
  releaseDate: string;
  txHash: string;
}

/**
 * Get the current tax year (Jan 1 - Dec 31)
 */
function getTaxYearDates() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1); // Jan 1
  const endOfYear = new Date(year, 11, 31); // Dec 31
  
  return {
    start: startOfYear.toISOString().split("T")[0],
    end: endOfYear.toISOString().split("T")[0],
  };
}

export default function TaxSummaryPage() {
  const router = useRouter();
  const { isConnected, publicKey, isRestoring } = useStellar();
  const { getLabel } = useEscrowLabels();
  const toast = useToast();

  const [releasedEscrows, setReleasedEscrows] = useState<ReleasedEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date range filter state
  const taxYearDates = getTaxYearDates();
  const [fromDate, setFromDate] = useState(taxYearDates.start);
  const [toDate, setToDate] = useState(taxYearDates.end);
  
  // Price data
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!isRestoring && !isConnected) {
      router.push("/connect");
    }
  }, [isConnected, isRestoring, router]);

  // Load released escrows from localStorage
  useEffect(() => {
    async function loadEscrows() {
      setLoading(true);
      try {
        const stored = localStorage.getItem("released_escrows");
        if (stored) {
          setReleasedEscrows(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading escrows:", error);
      } finally {
        setLoading(false);
      }
    }

    if (publicKey) {
      void loadEscrows();
    }
  }, [publicKey]);

  // Fetch current XLM price
  useEffect(() => {
    async function fetchPrice() {
      setPriceLoading(true);
      try {
        const price = await getCurrentXlmPrice();
        setCurrentPrice(price);
      } catch (error) {
        console.error("Error fetching price:", error);
      } finally {
        setPriceLoading(false);
      }
    }

    void fetchPrice();
    const interval = setInterval(() => void fetchPrice(), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Filter escrows by date range
  const filteredEscrows = useMemo(() => {
    return releasedEscrows.filter((escrow) => {
      const escrowDate = new Date(escrow.releaseDate).toISOString().split("T")[0];
      return escrowDate >= fromDate && escrowDate <= toDate;
    });
  }, [releasedEscrows, fromDate, toDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const xlmTotal = filteredEscrows.reduce((sum, e) => sum + Number(e.totalRent), 0);
    const usdTotal = xlmTotal * currentPrice;
    return { xlmTotal, usdTotal };
  }, [filteredEscrows, currentPrice]);

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (filteredEscrows.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Property Label", "Contract ID", "Amount (XLM)", "Estimated USD", "Release Date", "Transaction Hash"];
    const rows = filteredEscrows.map((item) => {
      const label = getLabel(item.id) || `Escrow ${item.id.slice(0, 6)}`;
      const usdAmount = Number(item.totalRent) * currentPrice;
      return [
        `"${label.replace(/"/g, '""')}"`,
        `"${item.id}"`,
        `"${Number(item.totalRent).toFixed(7)}"`,
        `"${usdAmount.toFixed(2)}"`,
        `"${new Date(item.releaseDate).toLocaleDateString("en-US")}"`,
        `"${item.txHash}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tax-summary-${fromDate}-to-${toDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export complete");
  };

  if (isRestoring || (!isConnected && !publicKey)) return null;

  return (
    <main
      aria-label="Tax Year Summary"
      className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a] print:bg-white print:text-black"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.1),transparent_50%)] pointer-events-none print:hidden" />

      <div className="container relative z-10 mx-auto px-6 max-w-5xl space-y-8">
        {/* Header */}
        <header className="space-y-6 print:mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:flex-col">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-dark-400 text-[10px] font-black uppercase tracking-widest print:hidden">
                <TrendingUp className="h-3.5 w-3.5 text-brand-500" />
                Tax Reporting
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none print:text-black print:text-3xl">
                Tax Year <span className="text-brand-400 print:text-black">Summary</span>
              </h1>
              <p className="text-dark-400 print:text-gray-600">
                Rental income report for tax purposes
              </p>
            </div>

            {/* Action Buttons - Hidden in print */}
            <div className="flex flex-wrap gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="btn-secondary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
              >
                <Printer className="h-4 w-4" />
                Print Report
              </button>
              <button
                onClick={handleExportCsv}
                className="btn-primary !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date Range Filter - Hidden in print */}
          <div className="print:hidden">
            <DateRangeFilter
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
              onClear={() => {
                setFromDate(taxYearDates.start);
                setToDate(taxYearDates.end);
              }}
              filteredCount={filteredEscrows.length}
              totalCount={releasedEscrows.length}
            />
          </div>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
          <div className="glass-card p-6 rounded-2xl border border-white/10 print:bg-gray-100 print:border-gray-300 print:text-black">
            <div className="text-sm font-black uppercase tracking-widest text-dark-400 print:text-gray-600 mb-2">
              Total Transactions
            </div>
            <div className="text-3xl font-black text-white print:text-black">
              {filteredEscrows.length}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 print:bg-gray-100 print:border-gray-300 print:text-black">
            <div className="text-sm font-black uppercase tracking-widest text-dark-400 print:text-gray-600 mb-2">
              Total XLM
            </div>
            <div className="text-3xl font-black text-brand-400 print:text-black">
              {totals.xlmTotal.toFixed(7)}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 print:bg-gray-100 print:border-gray-300 print:text-black">
            <div className="text-sm font-black uppercase tracking-widest text-dark-400 print:text-gray-600 mb-2">
              Estimated USD {!priceLoading && `@ $${currentPrice.toFixed(2)}/XLM`}
            </div>
            <div className="text-3xl font-black text-accent-400 print:text-black">
              ${totals.usdTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredEscrows.length > 0 ? (
          <div className="glass-card overflow-hidden border border-white/10 print:border-black">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-white/5 border-b border-white/10 print:bg-gray-200 print:border-black">
                  <tr>
                    <th className="p-4 pl-6 text-[10px] text-dark-500 font-black uppercase tracking-widest print:text-black">
                      Property
                    </th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest print:text-black">
                      XLM Amount
                    </th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest print:text-black">
                      USD Estimate
                    </th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest print:text-black">
                      Release Date
                    </th>
                    <th className="p-4 pr-6 text-[10px] text-dark-500 font-black uppercase tracking-widest print:text-black">
                      Transaction Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-black">
                  {filteredEscrows.map((item, idx) => {
                    const label =
                      getLabel(item.id) || `Escrow ${item.id.slice(0, 6)}`;
                    const xlmAmount = Number(item.totalRent);
                    const usdAmount = xlmAmount * currentPrice;
                    const formattedDate = new Date(
                      item.releaseDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <tr
                        key={idx}
                        className="group hover:bg-white/[0.02] print:bg-white print:border-black transition-colors"
                      >
                        <td className="p-4 pl-6 text-sm font-bold text-white print:text-black">
                          {label}
                        </td>
                        <td className="p-4 text-sm font-mono text-dark-200 print:text-black">
                          {xlmAmount.toFixed(7)} XLM
                        </td>
                        <td className="p-4 text-sm font-mono text-dark-200 print:text-black">
                          ${usdAmount.toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-dark-400 print:text-black">
                          {formattedDate}
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-dark-400 print:text-black">
                              {item.txHash.slice(0, 8)}...
                              {item.txHash.slice(-8)}
                            </span>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                              <button
                                onClick={() =>
                                  handleCopy(item.txHash, "Tx Hash")
                                }
                                className="p-1 rounded-md text-dark-600 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                                title="Copy Tx Hash"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={getExplorerLink(
                                  "transaction",
                                  item.txHash
                                )}
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

            {/* Summary Footer */}
            <div className="bg-white/5 border-t border-white/10 p-6 print:bg-gray-200 print:border-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="print:col-span-2">
                  <div className="text-xs font-black uppercase tracking-widest text-dark-500 print:text-black mb-1">
                    Report Period
                  </div>
                  <div className="text-sm font-semibold text-white print:text-black">
                    {new Date(fromDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    to{" "}
                    {new Date(toDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 border border-white/5 print:bg-gray-100 print:border-black">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-2 print:bg-gray-300">
              <Calendar className="w-8 h-8 text-brand-400 print:text-black" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider print:text-black">
              No Transactions Found
            </h3>
            <p className="text-dark-400 text-sm max-w-md mx-auto print:text-gray-700">
              No released payments found in the selected date range. Try
              adjusting your filter dates.
            </p>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-dark-500 print:text-gray-600 print:text-xs">
          <p>
            Generated by PayEasy • Prices sourced from CoinGecko • For informational
            purposes only
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
            color: black;
          }

          main {
            background: white;
          }

          .btn-primary,
          .btn-secondary,
          .print\\:hidden {
            display: none !important;
          }

          table {
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #000;
          }

          .glass-card {
            background: white;
            box-shadow: none;
          }
        }
      `}</style>
    </main>
  );
}
