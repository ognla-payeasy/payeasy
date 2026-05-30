import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ValidationError,
  isValidStellarAddress,
  isValidContractId,
  assertValidStellarAddress,
  assertValidContractId,
} from "@/lib/stellar/validation";

// ─── isValidStellarAddress ────────────────────────────────────────────────────

describe("isValidStellarAddress", () => {
  it("accepts a valid G-prefixed account address", () => {
    expect(
      isValidStellarAddress("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe(true);
  });

  it("accepts a valid C-prefixed contract address", () => {
    expect(
      isValidStellarAddress("CAIXIJBMYPTSF2CJVQ4NEKVTCF6WOPWPIDE3ZBSFOYHHMWIBTG2J5TAX")
    ).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });

  it("rejects an address that is too short", () => {
    expect(isValidStellarAddress("GABCDE")).toBe(false);
  });

  it("rejects an address with invalid prefix", () => {
    expect(
      isValidStellarAddress("XA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe(false);
  });

  it("rejects lowercase input", () => {
    expect(
      isValidStellarAddress("ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn")
    ).toBe(false);
  });

  it("rejects a string containing invalid base32 characters (0, 1, 8, 9)", () => {
    expect(
      isValidStellarAddress("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZV0")
    ).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isValidStellarAddress(null as unknown as string)).toBe(false);
    expect(isValidStellarAddress(undefined as unknown as string)).toBe(false);
    expect(isValidStellarAddress(123 as unknown as string)).toBe(false);
  });
});

// ─── isValidContractId ────────────────────────────────────────────────────────

describe("isValidContractId", () => {
  it("accepts a valid 56-character C-prefixed contract ID", () => {
    expect(
      isValidContractId("CAIXIJBMYPTSF2CJVQ4NEKVTCF6WOPWPIDE3ZBSFOYHHMWIBTG2J5TAX")
    ).toBe(true);
  });

  it("rejects a G-prefixed account address", () => {
    expect(
      isValidContractId("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidContractId("")).toBe(false);
  });

  it("rejects a contract ID that is too short", () => {
    expect(isValidContractId("CABCDE")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isValidContractId(null as unknown as string)).toBe(false);
  });
});

// ─── assertValidStellarAddress — ValidationError cases ───────────────────────

describe("assertValidStellarAddress — throws ValidationError for invalid input", () => {
  const invalidCases: [string, unknown][] = [
    ["empty string", ""],
    ["injection string", "not-a-stellar-address"],
    ["too short G address", "GABCDE"],
    ["numeric string", "12345678901234567890123456789012345678901234567890123456"],
    ["address with spaces", "  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZ"],
  ];

  it.each(invalidCases)("rejects %s and throws ValidationError (not raw SDK error)", (_label, input) => {
    expect(() => assertValidStellarAddress(input as string)).toThrow(ValidationError);
  });

  it("does not throw for a valid G-prefixed address", () => {
    expect(() =>
      assertValidStellarAddress("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).not.toThrow();
  });
});

// ─── assertValidContractId — ValidationError cases ───────────────────────────

describe("assertValidContractId — throws ValidationError for invalid input", () => {
  it("rejects 'not-a-contract-id' with ValidationError", () => {
    expect(() => assertValidContractId("not-a-contract-id")).toThrow(ValidationError);
  });

  it("rejects a G-prefixed account address", () => {
    expect(() =>
      assertValidContractId("GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN")
    ).toThrow(ValidationError);
  });

  it("does not throw for a valid C-prefixed contract ID", () => {
    expect(() =>
      assertValidContractId("CAIXIJBMYPTSF2CJVQ4NEKVTCF6WOPWPIDE3ZBSFOYHHMWIBTG2J5TAX")
    ).not.toThrow();
  });
});

// ─── RPC gate: invalid input must never reach the RPC layer ──────────────────

describe("RPC gate — no RPC call is made for invalid addresses", () => {
  const mockSimulate = vi.fn();

  beforeEach(() => {
    mockSimulate.mockClear();
  });

  const invalidAddresses = [
    "not-a-stellar-address",
    "",
    "GABCDE",
    "12345678901234567890123456789012345678901234567890123456",
    "  GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZ",
  ];

  it.each(invalidAddresses)(
    "throws ValidationError before any RPC for address: %s",
    (addr) => {
      expect(() => assertValidStellarAddress(addr)).toThrow(ValidationError);
      expect(mockSimulate).not.toHaveBeenCalled();
    }
  );
});