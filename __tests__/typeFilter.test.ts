import {  describe, it , assert } from "vitest";


// ── Types mirrored from TransactionCard ────────────────────────────────────

type TransactionType = "contribute" | "release" | "refund";
type TypeFilterValue = "all" | TransactionType;

interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
  txHash: string;
}

// ── Pure filtering function (matches TransactionList logic) ────────────────

function filterByType(
  transactions: Transaction[],
  typeFilter: TypeFilterValue,
): Transaction[] {
  if (typeFilter === "all") return transactions;
  return transactions.filter((tx) => tx.type === typeFilter);
}

// ── Mock data: mixed transaction types ─────────────────────────────────────

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    type: "contribute",
    amount: "450.00 XLM",
    status: "success",
    timestamp: "2026-03-28T14:30:00.000Z",
    txHash: "hash1",
  },
  {
    id: "tx-2",
    type: "release",
    amount: "1,250.00 XLM",
    status: "success",
    timestamp: "2026-03-25T09:12:45.000Z",
    txHash: "hash2",
  },
  {
    id: "tx-3",
    type: "contribute",
    amount: "300.00 XLM",
    status: "success",
    timestamp: "2026-03-22T18:45:12.000Z",
    txHash: "hash3",
  },
  {
    id: "tx-4",
    type: "refund",
    amount: "150.00 XLM",
    status: "success",
    timestamp: "2026-03-15T11:20:00.000Z",
    txHash: "hash4",
  },
  {
    id: "tx-5",
    type: "release",
    amount: "800.00 XLM",
    status: "failed",
    timestamp: "2026-03-10T22:10:05.000Z",
    txHash: "hash5",
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe("TypeFilter — filtering logic", () => {
  it("returns all transactions when filter is 'all'", () => {
    const result = filterByType(MOCK_TRANSACTIONS, "all");
    assert.equal(result.length, 5, "All 5 transactions should be returned");
  });

  it("returns only 'contribute' transactions when filter is 'contribute'", () => {
    const result = filterByType(MOCK_TRANSACTIONS, "contribute");
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((t) => t.id),
      ["tx-1", "tx-3"],
    );
    assert.ok(result.every((t) => t.type === "contribute"));
  });

  it("returns only 'release' transactions when filter is 'release'", () => {
    const result = filterByType(MOCK_TRANSACTIONS, "release");
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((t) => t.id),
      ["tx-2", "tx-5"],
    );
    assert.ok(result.every((t) => t.type === "release"));
  });

  it("returns only 'refund' transactions when filter is 'refund'", () => {
    const result = filterByType(MOCK_TRANSACTIONS, "refund");
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "tx-4");
    assert.equal(result[0].type, "refund");
  });

  it("returns empty array when no transactions match the selected type", () => {
    // Use a list with no refunds
    const noRefunds = MOCK_TRANSACTIONS.filter((t) => t.type !== "refund");
    const result = filterByType(noRefunds, "refund");
    assert.equal(result.length, 0);
  });
});
