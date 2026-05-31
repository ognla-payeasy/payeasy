import { describe, expect, it } from "vitest";

import { getReleaseApprovalsForSigners } from "../lib/stellar/queries";

describe("getReleaseApprovalsForSigners", () => {
  it("returns an empty list when no approvals are passed", () => {
    const result = getReleaseApprovalsForSigners(
      ["GLANDLORD", "GROOMMATEA"],
      []
    );
    expect(result).toEqual([]);
  });

  it("includes only addresses that match the configured signer list", () => {
    const result = getReleaseApprovalsForSigners(
      ["GLANDLORD", "GROOMMATEA"],
      ["GLANDLORD", "GSTRANGER"]
    );

    expect(result.map((entry) => entry.signerAddress)).toEqual(["GLANDLORD"]);
  });

  it("deduplicates repeated approvals from the same signer", () => {
    const result = getReleaseApprovalsForSigners(
      ["GLANDLORD"],
      ["GLANDLORD", "GLANDLORD", "GLANDLORD"]
    );

    expect(result).toHaveLength(1);
  });

  it("stamps every approval with the same canonical timestamp", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    const result = getReleaseApprovalsForSigners(
      ["GLANDLORD", "GROOMMATEA"],
      ["GLANDLORD", "GROOMMATEA"],
      now
    );

    expect(result).toHaveLength(2);
    for (const entry of result) {
      expect(entry.approvedAt.toISOString()).toBe(now.toISOString());
    }
  });
});
