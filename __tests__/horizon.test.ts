import { describe, it, beforeEach, assert, expect } from "vitest";

import { fetchAccountBalances, fetchXlmBalance } from "../lib/stellar/horizon.ts";

describe("fetchAccountBalances", () => {
  it("returns parsed XLM and token balances", async () => {
    const mockServer = {
      loadAccount: async (accountId: string) => {
        return {
          balances: [
            {
              balance: "100.0000000",
              asset_type: "native",
            },
            {
              balance: "50.0000000",
              asset_type: "credit_alphanum4",
              asset_code: "USDC",
              asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
            },
          ],
        };
      },
    };

    const result = await fetchAccountBalances("GABC123", "testnet", mockServer as any);

    assert.strictEqual(result.accountId, "GABC123");
    assert.strictEqual(result.balances.length, 2);

    assert.deepStrictEqual(result.balances[0], {
      assetType: "native",
      assetCode: "XLM",
      assetIssuer: null,
      balance: "100.0000000",
    });

    assert.deepStrictEqual(result.balances[1], {
      assetType: "credit_alphanum4",
      assetCode: "USDC",
      assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      balance: "50.0000000",
    });
  });

  it("throws on account not found (404)", async () => {
    const error = new Error("Not Found");
    Object.assign(error, { response: { status: 404 } });
    
    const mockServer = {
      loadAccount: async () => { throw error; }
    };

    await expect(
      fetchAccountBalances("GNOTFOUND", "testnet", mockServer as any)
    ).rejects.toThrow(/Account not found: GNOTFOUND/);
  });

  it("throws on network failure", async () => {
    const mockServer = {
      loadAccount: async () => { throw new Error("Network error"); }
    };

    await expect(
      fetchAccountBalances("GABC123", "testnet", mockServer as any)
    ).rejects.toThrow(/Failed to fetch balances: Network error/);
  });
});

describe("fetchXlmBalance", () => {
  it("returns the native XLM balance", async () => {
    const mockServer = {
      loadAccount: async () => ({
        balances: [{ balance: "250.5000000", asset_type: "native" }],
      })
    };

    const balance = await fetchXlmBalance("GABC123", "testnet", mockServer as any);
    assert.strictEqual(balance, "250.5000000");
  });

  it("returns '0' if no native balance found", async () => {
    const mockServer = {
      loadAccount: async () => ({ balances: [] })
    };

    const balance = await fetchXlmBalance("GABC123", "testnet", mockServer as any);
    assert.strictEqual(balance, "0");
  });
});
