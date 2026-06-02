import test from "node:test";
import assert from "node:assert/strict";

import {
  getApproachingEscrows,
  formatTimeUntil,
  DEADLINE_WINDOW_SECONDS,
} from "./deadline-utils.ts";
import type { EscrowContract } from "@/lib/stellar/types";

const NOW = 1_700_000_000; // fixed reference time (seconds)
const HOUR = 3600;

function escrow(
  overrides: Partial<EscrowContract> & Pick<EscrowContract, "id">,
): EscrowContract {
  return {
    landlord: "GLANDLORD",
    totalRent: "1000",
    deadline: new Date((overrides.deadlineEpoch ?? NOW) * 1000).toISOString(),
    totalFunded: 0,
    deadlineEpoch: NOW + 48 * HOUR,
    status: "active",
    ...overrides,
  };
}

test("includes an active escrow whose deadline is 48h away (acceptance criterion)", () => {
  const escrows = [escrow({ id: "E48", deadlineEpoch: NOW + 48 * HOUR })];
  const result = getApproachingEscrows(escrows, NOW);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "E48");
});

test("excludes deadlines beyond the 72h window", () => {
  const escrows = [escrow({ id: "E96", deadlineEpoch: NOW + 96 * HOUR })];
  assert.equal(getApproachingEscrows(escrows, NOW).length, 0);
});

test("includes a deadline exactly at the 72h boundary", () => {
  const escrows = [
    escrow({ id: "E72", deadlineEpoch: NOW + DEADLINE_WINDOW_SECONDS }),
  ];
  assert.equal(getApproachingEscrows(escrows, NOW).length, 1);
});

test("excludes deadlines already in the past", () => {
  const escrows = [escrow({ id: "EPast", deadlineEpoch: NOW - HOUR })];
  assert.equal(getApproachingEscrows(escrows, NOW).length, 0);
});

test("excludes released/expired escrows even if within the window", () => {
  const escrows = [
    escrow({ id: "ERel", deadlineEpoch: NOW + 24 * HOUR, status: "released" }),
    escrow({ id: "EExp", deadlineEpoch: NOW + 24 * HOUR, status: "expired" }),
  ];
  assert.equal(getApproachingEscrows(escrows, NOW).length, 0);
});

test("includes funded escrows (still active for reminder purposes)", () => {
  const escrows = [
    escrow({ id: "EFund", deadlineEpoch: NOW + 12 * HOUR, status: "funded" }),
  ];
  assert.equal(getApproachingEscrows(escrows, NOW).length, 1);
});

test("returns multiple approaching escrows, dropping out-of-window ones", () => {
  const escrows = [
    escrow({ id: "A", deadlineEpoch: NOW + 10 * HOUR }),
    escrow({ id: "B", deadlineEpoch: NOW + 70 * HOUR }),
    escrow({ id: "C", deadlineEpoch: NOW + 200 * HOUR }),
  ];
  assert.deepEqual(
    getApproachingEscrows(escrows, NOW).map((e) => e.id),
    ["A", "B"],
  );
});

test("formatTimeUntil renders days, hours, and minutes", () => {
  assert.equal(formatTimeUntil(NOW + 48 * HOUR, NOW), "in 2 days");
  assert.equal(formatTimeUntil(NOW + 5 * HOUR, NOW), "in 5 hours");
  assert.equal(formatTimeUntil(NOW + 30 * 60, NOW), "in 30 minutes");
  assert.equal(formatTimeUntil(NOW + 1 * HOUR, NOW), "in 1 hour");
});
