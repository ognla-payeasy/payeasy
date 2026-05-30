import type { Transaction } from "@/components/history/TransactionCard";

/**
 * Converts an array of transactions to a CSV string and triggers a browser download.
 *
 * @param transactions The list of transactions to export.
 */
export function exportTransactionsToCsv(transactions: Transaction[]) {
  // Define columns: Date, Type, Amount, Fee, Hash, Status
  const headers = ["Date", "Type", "Amount", "Fee", "Hash", "Status"];

  // Map transactions to CSV rows
  const rows = transactions.map((tx) => {
    // Format date nicely
    const date = new Date(tx.timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Escape quotes and fields containing commas
    const escapeCsv = (field: string) => `"${field.replace(/"/g, '""')}"`;

    return [
      escapeCsv(date),
      escapeCsv(tx.type.toUpperCase()),
      escapeCsv(tx.amount),
      escapeCsv((tx as { fee?: string }).fee || "N/A"), // Fallback if fee is not in type
      escapeCsv(tx.txHash),
      escapeCsv(tx.status.toUpperCase()),
    ].join(",");
  });

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create a Blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = `payeasy-history-${today}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
