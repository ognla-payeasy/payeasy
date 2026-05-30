export interface PaymentHistoryEntry {
  contractId: string;
  roommateAddress: string;
  amount: string;
  txHash: string;
  recordedAt: string;
}

function getHistoryKey(contractId: string, roommateAddress: string): string {
  return `payeasy:payment-history:${contractId}:${roommateAddress}`;
}

function readStoredEntries(contractId: string, roommateAddress: string): PaymentHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(getHistoryKey(contractId, roommateAddress));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PaymentHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEntries(contractId: string, roommateAddress: string, entries: PaymentHistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getHistoryKey(contractId, roommateAddress), JSON.stringify(entries));
}

export function listPaymentHistory(contractId: string, roommateAddress: string): PaymentHistoryEntry[] {
  return readStoredEntries(contractId, roommateAddress).sort(
    (left, right) => Date.parse(right.recordedAt) - Date.parse(left.recordedAt)
  );
}

export function recordPaymentHistoryEntry(entry: PaymentHistoryEntry): void {
  const entries = readStoredEntries(entry.contractId, entry.roommateAddress);
  const nextEntries = [entry, ...entries.filter((existing) => existing.txHash !== entry.txHash)];
  writeStoredEntries(entry.contractId, entry.roommateAddress, nextEntries);
}