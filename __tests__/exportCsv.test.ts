import { describe, it, vi, beforeEach, assert } from "vitest";

import { exportTransactionsToCsv } from "../lib/exportCsv.ts";
import type { Transaction } from "@/components/history/TransactionCard";

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
    status: "pending",
    timestamp: "2026-03-25T09:12:45.000Z",
    txHash: "hash2",
  },
  {
    id: "tx-3",
    type: "refund",
    amount: "150.00 XLM",
    status: "failed",
    timestamp: "2026-03-15T11:20:00.000Z",
    txHash: "hash3",
  },
];

describe("exportTransactionsToCsv", () => {
  let blobContent: string | null = null;
  let clickedElement: any = null;
  let createElementMock: any = null;

  beforeEach(() => {
    blobContent = null;
    clickedElement = null;
    createElementMock = null;

    // Mock global objects needed for browser download simulation
    global.Blob = class BlobMock {
      content: any[];
      constructor(content: any[], options: any) {
        this.content = content;
        blobContent = content.join("");
      }
    } as any;

    global.URL = {
      createObjectURL: () => "blob:mocked-url",
      revokeObjectURL: () => {},
    } as any;

    const mockElement = {
      setAttribute: vi.fn(),
      style: {},
      click: vi.fn(() => {
        clickedElement = mockElement;
      }),
    };

    createElementMock = vi.fn(() => mockElement);
    global.document = {
      createElement: createElementMock,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as any;
  });

  it("generates correct CSV content and triggers download", () => {
    exportTransactionsToCsv(MOCK_TRANSACTIONS);

    // 1. Verify Blob content (the CSV string)
    assert.ok(blobContent !== null, "Blob should have been created with CSV content");
    
    const lines = blobContent!.split("\n");
    assert.equal(lines.length, 4, "Should have 1 header line + 3 data lines");
    
    // Verify headers
    assert.equal(lines[0], "Date,Type,Amount,Fee,Hash,Status");

    // Verify first row
    // Note: Date formatting depends on locale in real usage, but the structure remains.
    // We just check if the other fields are correctly escaped and placed.
    assert.ok(lines[1].includes('"CONTRIBUTE"'));
    assert.ok(lines[1].includes('"450.00 XLM"'));
    assert.ok(lines[1].includes('"N/A"')); // default fee
    assert.ok(lines[1].includes('"hash1"'));
    assert.ok(lines[1].includes('"SUCCESS"'));

    // Verify second row
    assert.ok(lines[2].includes('"RELEASE"'));
    assert.ok(lines[2].includes('"1,250.00 XLM"')); // handles comma in amount via escaping
    assert.ok(lines[2].includes('"PENDING"'));

    // Verify third row
    assert.ok(lines[3].includes('"REFUND"'));
    assert.ok(lines[3].includes('"FAILED"'));

    // 2. Verify download triggered
    assert.equal(
      createElementMock.mock.calls[0][0],
      "a",
      "Should create an anchor element"
    );
    
    const setAttributeCalls = clickedElement.setAttribute.mock.calls;
    assert.equal(setAttributeCalls[0][0], "href");
    assert.equal(setAttributeCalls[0][1], "blob:mocked-url");
    
    assert.equal(setAttributeCalls[1][0], "download");
    assert.ok(setAttributeCalls[1][1].startsWith("payeasy-history-"));
    assert.ok(setAttributeCalls[1][1].endsWith(".csv"));

    assert.equal(clickedElement.click.mock.calls.length, 1, "Should click the link to trigger download");
  });
});
