"use client";

import { useMemo, useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import TransactionCard, { type Transaction } from "./TransactionCard";
import TransactionDetailModal from "./TransactionDetailModal";
import DateRangeFilter from "./DateRangeFilter";
import TypeFilter, { type TypeFilterValue } from "./TypeFilter";
import { exportTransactionsToCsv } from "@/lib/exportCsv";

interface TransactionListProps {
  transactions: Transaction[];
// New state for sort order
  hasMore: boolean;
  isLoadingMore: boolean;
const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  onLoadMore: () => void;
  newBadgeHashes?: string[];
    const filtered = transactions.filter((tx) => {

function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function TransactionList({
  transactions,
  hasMore,
  isLoadingMore,
  onLoadMore,
  newBadgeHashes = [],
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const filteredTransactions = useMemo(() => {
    return filtered.sort((a, b) => {
      if (sortOrder === "desc") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
    });
    return transactions.filter((tx) => {
      const matchesSearch =
        searchQuery === "" ||
        tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || tx.type === typeFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const txDate = new Date(tx.timestamp);

        if (dateFrom) {
          const fromDate = toLocalDate(dateFrom);
          matchesDate = matchesDate && txDate >= fromDate;
        }

        if (dateTo) {
          const toDate = toLocalDate(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && txDate <= toDate;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, typeFilter, dateFrom, dateTo]);

  const isDateFilterActive = dateFrom !== "" || dateTo !== "";

  function handleClearDates() {
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-10 bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96 group">
            <label htmlFor="tx-search" className="sr-only">Search transactions</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500 group-focus-within:text-brand-400 transition-colors" />
            <input
              id="tx-search"
              type="text"
              placeholder="Search by amount, hash, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-5 text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 placeholder:text-dark-600 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none md:w-44">
                <TypeFilter value={typeFilter} onChange={setTypeFilter} />
              </div>

              <button
                type="button"
                className="flex-1 md:flex-none btn-secondary !py-2.5 !px-4 !text-xs !bg-dark-900/40 !border-white/10 hover:!border-white/20"
              >
                Latest First
              </button>
            </div>

            <button
              type="button"
              onClick={() => exportTransactionsToCsv(filteredTransactions)}
              className="w-full md:w-auto flex-none btn-primary !py-2.5 !px-4 !text-xs shadow-lg shadow-brand-500/20 justify-center"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4">
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={handleClearDates}
            filteredCount={filteredTransactions.length}
            totalCount={transactions.length}
          />
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              isNew={newBadgeHashes.includes(tx.txHash)}
              onClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center glass-card border-dashed">
          <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-dark-600" />
          </div>
          <h3 className="text-dark-200 font-bold">No transactions found</h3>
          <p className="text-dark-500 text-sm mt-1">
            {isDateFilterActive || typeFilter !== "all"
              ? "No transactions match the selected filters"
              : "Try adjusting your search criteria"}
          </p>
          {(isDateFilterActive || typeFilter !== "all") && (
            <div className="mt-4 flex gap-3 justify-center">
              {isDateFilterActive && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="text-brand-400 text-sm font-bold hover:text-brand-300 transition-colors"
                >
                  Clear date filter
                </button>
              )}
              {typeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className="text-brand-400 text-sm font-bold hover:text-brand-300 transition-colors"
                >
                  Clear type filter
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
        <p className="text-[11px] text-dark-500 uppercase tracking-widest font-black">
          Showing <span className="text-brand-400 px-1">{filteredTransactions.length}</span> of <span className="text-dark-200 px-1">{transactions.length}</span> loaded
        </p>

        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="btn-secondary !py-3 !px-7 !rounded-xl !text-xs disabled:opacity-60"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </button>
        ) : (
          <p className="text-xs text-dark-400 font-semibold uppercase tracking-widest">
            All transactions loaded
          </p>
        )}
      </div>
      <TransactionDetailModal
        transaction={selectedTx}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
