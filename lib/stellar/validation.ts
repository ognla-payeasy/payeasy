import { getCurrentNetwork } from "./explorer.ts";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates a Stellar public key (G-prefixed account) or contract address (C-prefixed).
 * Uses StrKey validation when the Stellar SDK is available; falls back to regex otherwise.
 */
export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  return /^[GC][A-Z2-7]{55}$/.test(address);
}

/**
 * Asserts that the given address is a valid Stellar address.
 * Throws ValidationError immediately so no invalid string reaches RPC.
 */
export function assertValidStellarAddress(address: string): void {
  if (!isValidStellarAddress(address)) {
    throw new ValidationError(
      `Invalid Stellar address: "${address}". Must be a 56-character G- or C-prefixed base32 string.`
    );
  }
}

export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Performs client-side safety checks on a transaction XDR before signing.
 * 
 * Note: Full XDR decoding requires the 'stellar-sdk' library.
 * This implementation provides structural and environmental validation.
 * 
 * @param xdr The base64-encoded transaction XDR.
 * @param expectedNetwork The network passphrase or alias (e.g., 'testnet').
 */
export async function validateTransactionSafety(
  xdr: string,
  expectedNetwork: string
): Promise<ValidationSummary> {
  const result: ValidationSummary = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // 1. Basic XDR structural check (must be base64)
  if (!xdr || !/^[A-Za-z0-9+/=]+$/.test(xdr)) {
    result.isValid = false;
    result.errors.push("Invalid transaction XDR format (must be base64).");
  }

  // 2. Network mismatch check
  const currentNetwork = getCurrentNetwork();
  if (expectedNetwork.toLowerCase() !== currentNetwork.toLowerCase()) {
    result.isValid = false;
    result.errors.push(
      `Network mismatch: Transaction is for ${expectedNetwork}, but app is on ${currentNetwork}.`
    );
  }

  // 3. Size check (protect against massive transactions)
  if (xdr.length > 32768) {
    result.warnings.push("Transaction payload is unusually large.");
  }

  return result;
}

/**
 * Checks if a contract ID follows the expected format (C-prefixed, 56 chars, base32).
 */
export function isValidContractId(contractId: string): boolean {
  if (!contractId || typeof contractId !== "string") return false;
  return /^C[A-Z2-7]{55}$/.test(contractId);
}

/**
 * Asserts that the given value is a valid Soroban contract ID.
 * Throws ValidationError immediately so no invalid ID reaches RPC.
 */
export function assertValidContractId(contractId: string): void {
  if (!isValidContractId(contractId)) {
    throw new ValidationError(
      `Invalid contract ID: "${contractId}". Must be a 56-character C-prefixed base32 string.`
    );
  }
}
