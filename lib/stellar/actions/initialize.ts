/**
 * Frontend action for calling the `initialize` Soroban contract method.
 *
 * This action:
 *  1. Validates inputs (landlord, totalRent, deadline, tokenAddress, roommates)
 *  2. Resolves the Freighter wallet and verifies the caller is the landlord
 *  3. Builds and simulates the Soroban `initialize` invocation
 *  4. Signs via Freighter, submits to the network, and polls for confirmation
 *  5. Returns the transaction hash on success
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

// ─── Constants ────────────────────────────────────────────────────────────────

export const NETWORK_PASSPHRASE = Networks.TESTNET;
const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "";
if (!rpcUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SOROBAN_RPC_URL");
}
const DEFAULT_TIMEOUT_SECONDS = 300;
const MAX_CONFIRMATION_RETRIES = 20;
const CONFIRMATION_DELAY_MS = 1500;

// ─── Types ────────────────────────────────────────────────────────────────────

/** address → share in token units (e.g. stroops) */
export type RoommateShares = Record<string, bigint>;

export interface InitializeEscrowParams {
  /** Deployed contract address (C...) */
  contractId: string;
  /** Landlord's Stellar public key (G...) */
  landlord: string;
  /** Total rent amount in token units */
  totalRent: bigint;
  /** Unix timestamp (seconds) after which deposits can be reclaimed */
  deadline: bigint;
  /** SAC / token contract address (C...) */
  tokenAddress: string;
  /** Map of roommate public keys to their expected share */
  roommates: RoommateShares;
}

export interface InitializeEscrowResult {
  txHash: string;
  confirmedAt: Date;
}

export interface FreighterAddressResponse {
  address: string;
  error?: unknown;
}

export interface FreighterSignResponse {
  signedTxXdr?: string;
  txXdr?: string;
  error?: unknown;
}

export interface FreighterClient {
  getAddress: () => Promise<FreighterAddressResponse>;
  signTransaction: (
    transactionXdr: string,
    options?: { networkPassphrase?: string; address?: string }
  ) => Promise<FreighterSignResponse>;
}

export interface InitializeDependencies {
  server?: rpc.Server;
  freighter?: FreighterClient;
  networkPassphrase?: string;
  rpcUrl?: string;
  sleep?: (ms: number) => Promise<void>;
}

// ─── Custom errors ────────────────────────────────────────────────────────────

export class FreighterNotAvailableError extends Error {
  constructor() {
    super("Freighter wallet extension not found. Please install it.");
    this.name = "FreighterNotAvailableError";
  }
}

export class WalletMismatchError extends Error {
  constructor(connected: string, expected: string) {
    super(
      `Connected wallet (${connected.slice(0, 6)}…) does not match ` +
        `expected landlord (${expected.slice(0, 6)}…). ` +
        `Switch accounts in Freighter.`
    );
    this.name = "WalletMismatchError";
  }
}

export class InvalidInitializeParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInitializeParamsError";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServer(deps: InitializeDependencies): rpc.Server {
  return deps.server ?? new rpc.Server(deps.rpcUrl ?? rpcUrl);
}

function getNetworkPassphrase(deps: InitializeDependencies): string {
  return deps.networkPassphrase ?? NETWORK_PASSPHRASE;
}

async function getSourceAccount(
  server: rpc.Server,
  address: string
): Promise<Account> {
  return server.getAccount(address).catch(() => new Account(address, "0"));
}

async function loadFreighterClient(): Promise<FreighterClient> {
  if (
    typeof window === "undefined" ||
    !(window as Window & { freighter?: unknown }).freighter
  ) {
    throw new FreighterNotAvailableError();
  }

  const mod = await import("@stellar/freighter-api");
  const api = "default" in mod ? (mod as unknown as { default: typeof mod }).default : mod;

  return {
    getAddress: api.getAddress,
    signTransaction: api.signTransaction,
  };
}

/**
 * Encodes a RoommateShares map into a Soroban ScVal map suitable for the
 * `initialize` contract call argument.
 */
export function roommateSharestoScVal(shares: RoommateShares): xdr.ScVal {
  const entries = Object.entries(shares).map(([addr, share]) =>
    new xdr.ScMapEntry({
      key: Address.fromString(addr).toScVal(),
      val: nativeToScVal(share, { type: "i128" }),
    })
  );
  return xdr.ScVal.scvMap(entries);
}

/**
 * Validates the InitializeEscrowParams and throws InvalidInitializeParamsError
 * on the first violation found.
 */
export function validateInitializeParams(
  params: InitializeEscrowParams
): void {
  if (!params.landlord) {
    throw new InvalidInitializeParamsError("landlord address is required");
  }
  if (!params.contractId) {
    throw new InvalidInitializeParamsError("contractId is required");
  }
  if (!params.tokenAddress) {
    throw new InvalidInitializeParamsError("tokenAddress is required");
  }
  if (params.totalRent <= BigInt(0)) {
    throw new InvalidInitializeParamsError("totalRent must be greater than 0");
  }
  if (params.deadline <= BigInt(0)) {
    throw new InvalidInitializeParamsError("deadline must be a positive timestamp");
  }
  if (Object.keys(params.roommates).length === 0) {
    throw new InvalidInitializeParamsError("at least one roommate is required");
  }
  const shareSum = Object.values(params.roommates).reduce(
    (acc, s) => acc + s,
    BigInt(0)
  );
  if (shareSum > params.totalRent) {
    throw new InvalidInitializeParamsError(
      `sum of roommate shares (${shareSum}) exceeds totalRent (${params.totalRent})`
    );
  }
}

function normalizeSignedXdr(result: FreighterSignResponse): string {
  const signed = result.signedTxXdr ?? result.txXdr;
  if (typeof signed !== "string" || signed.length === 0) {
    throw new Error(
      result.error
        ? `Failed to sign with Freighter: ${String(result.error)}`
        : "Freighter did not return a signed transaction XDR."
    );
  }
  return signed;
}

// ─── Core action ─────────────────────────────────────────────────────────────

/**
 * Calls the `initialize` method on the rent-escrow contract:
 *  1. Validate params
 *  2. Resolve Freighter and confirm connected wallet matches landlord
 *  3. Build the Soroban transaction with all five contract arguments
 *  4. Simulate to get resource fees + storage footprint
 *  5. Sign via Freighter
 *  6. Submit and poll for on-chain confirmation
 *  7. Return the tx hash and confirmation timestamp
 */
export async function initializeEscrow(
  params: InitializeEscrowParams,
  deps: InitializeDependencies = {}
): Promise<InitializeEscrowResult> {
  // ── 1. Validate ──────────────────────────────────────────────────────────
  validateInitializeParams(params);

  const { contractId, landlord, totalRent, deadline, tokenAddress, roommates } =
    params;
  const server = getServer(deps);
  const networkPassphrase = getNetworkPassphrase(deps);
  const freighter = deps.freighter ?? (await loadFreighterClient());

  // ── 2. Freighter wallet check ────────────────────────────────────────────
  const addressResult = await freighter.getAddress();
  if (addressResult.error) {
    throw new Error(
      `Failed to read connected wallet: ${String(addressResult.error)}`
    );
  }
  if (addressResult.address !== landlord) {
    throw new WalletMismatchError(addressResult.address, landlord);
  }

  // ── 3. Build transaction ─────────────────────────────────────────────────
  const sourceAccount = await getSourceAccount(server, landlord);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "initialize",
        Address.fromString(landlord).toScVal(),
        Address.fromString(tokenAddress).toScVal(),
        nativeToScVal(totalRent, { type: "i128" }),
        nativeToScVal(deadline, { type: "u64" }),
        roommateSharestoScVal(roommates)
      )
    )
    .setTimeout(DEFAULT_TIMEOUT_SECONDS)
    .build();

  // ── 4. Simulate ──────────────────────────────────────────────────────────
  let simResult: rpc.Api.SimulateTransactionResponse;
  try {
    simResult = await server.simulateTransaction(tx);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Simulation request failed: ${message}`);
  }

  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();

  // ── 5. Sign via Freighter ────────────────────────────────────────────────
  const signResponse = await freighter.signTransaction(preparedTx.toXDR(), {
    address: landlord,
    networkPassphrase,
  });
  const signedTxXdr = normalizeSignedXdr(signResponse);

  // ── 6. Submit ────────────────────────────────────────────────────────────
  const sendResult = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
  );

  if (sendResult.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${JSON.stringify(
        sendResult.errorResult ?? sendResult
      )}`
    );
  }

  // ── 7. Poll for confirmation ─────────────────────────────────────────────
  const wait = deps.sleep ?? sleep;
  let txResult = await server.getTransaction(sendResult.hash);
  let retries = 0;

  while (
    txResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    retries < MAX_CONFIRMATION_RETRIES
  ) {
    await wait(CONFIRMATION_DELAY_MS);
    txResult = await server.getTransaction(sendResult.hash);
    retries += 1;
  }

  if (txResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(
      `Transaction did not succeed. Status: ${txResult.status}`
    );
  }

  return {
    txHash: sendResult.hash,
    confirmedAt: new Date(txResult.createdAt * 1000),
  };
}
