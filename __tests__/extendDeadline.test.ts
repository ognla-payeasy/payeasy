import { describe, expect, it } from "vitest";

import {
  DeadlineNotLaterError,
  extendDeadline,
} from "../lib/stellar/actions/extendDeadline";

describe("extendDeadline (validation)", () => {
  it("rejects a non-finite or zero new deadline before touching the wallet", async () => {
    await expect(
      extendDeadline({
        contractId: "CONTRACT",
        landlordAddress: "GLANDLORD",
        newDeadlineEpoch: 0,
        currentDeadlineEpoch: 1_700_000_000,
      })
    ).rejects.toThrow(/positive Unix timestamp/i);

    await expect(
      extendDeadline({
        contractId: "CONTRACT",
        landlordAddress: "GLANDLORD",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newDeadlineEpoch: Number.NaN as any,
        currentDeadlineEpoch: 1_700_000_000,
      })
    ).rejects.toThrow(/positive Unix timestamp/i);
  });

  it("throws DeadlineNotLaterError when new deadline is not after the current one", async () => {
    const currentDeadlineEpoch = 1_700_000_000;
    const stubFreighter = {
      getAddress: async () => ({ address: "GLANDLORD" }),
      signTransaction: async () => ({ signedTxXdr: "x" }),
    };

    await expect(
      extendDeadline(
        {
          contractId: "CONTRACT",
          landlordAddress: "GLANDLORD",
          newDeadlineEpoch: currentDeadlineEpoch, // not strictly later
          currentDeadlineEpoch,
        },
        { freighter: stubFreighter }
      )
    ).rejects.toBeInstanceOf(DeadlineNotLaterError);

    await expect(
      extendDeadline(
        {
          contractId: "CONTRACT",
          landlordAddress: "GLANDLORD",
          newDeadlineEpoch: currentDeadlineEpoch - 1,
          currentDeadlineEpoch,
        },
        { freighter: stubFreighter }
      )
    ).rejects.toBeInstanceOf(DeadlineNotLaterError);
  });

  it("rejects when the connected wallet does not match the landlord", async () => {
    const currentDeadlineEpoch = 1_700_000_000;
    const stubFreighter = {
      getAddress: async () => ({ address: "GSOMEONEELSE" }),
      signTransaction: async () => ({ signedTxXdr: "x" }),
    };

    await expect(
      extendDeadline(
        {
          contractId: "CONTRACT",
          landlordAddress: "GLANDLORD",
          newDeadlineEpoch: currentDeadlineEpoch + 86_400,
          currentDeadlineEpoch,
        },
        { freighter: stubFreighter }
      )
    ).rejects.toThrow(/does not match expected landlord/i);
  });
});
