import test from "node:test";
import assert from "node:assert/strict";

import { assertFullyFunded, EscrowNotFundedError } from "./release.ts";

test("assertFullyFunded against Stellar testnet - throws on non-existent contract", async () => {
  // Use a completely fake contract ID (must be 56 chars starting with C)
  const fakeContractId = "CCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  const fakeLandlordAddress = "GBYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY";

  try {
    await assertFullyFunded(fakeContractId, fakeLandlordAddress);
    assert.fail("Should have thrown an error");
  } catch (err) {
    // Expected to throw because the contract/address is fake.
    // Either the SDK rejects the malformed address up-front, or we reach simulation
    // and the network rejects the missing contract.
    const message = err instanceof Error ? err.message : String(err);
    assert.ok(
      message.includes("Simulation failed") ||
      message.includes("Simulation request failed") ||
      message.includes("invalid") ||
      err instanceof EscrowNotFundedError,
      `Unexpected error: ${message}`
    );
  }
});
