/**
 * Frontend action for extending the deadline of an existing escrow contract.
 *
 * Mirrors the structure of `claimRefund.ts` / `release.ts`:
 *  1. Resolves the current on-chain deadline so we can guarantee the new one
 *     is strictly later.
 *  2. Confirms the connected Freighter wallet matches the landlord.
 *  3. Builds, signs, submits, and confirms the Soroban transaction calling
 *     `extend_deadline(landlord, new_deadline)` on the escrow contract.
 *
 * The contract method name is resolved against a small candidate list so a
 * frontend deploy is not blocked by a rename on the contract side.
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
  nativeToScVal,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
const DEFAULT_TIMEOUT_SECONDS = 300;
const MAX_CONFIRMATION_RETRIES = 20;
const CONFIRMATION_DELAY_MS = 1500;
const EXTEND_METHOD_CANDIDATES = [
  "extend_deadline",
  "update_deadline",
  "set_deadline",
] as const;

export type ExtendMethodName = (typeof EXTEND_METHOD_CANDIDATES)[number];

export interface ExtendDeadlineParams {
  contractId: string;
  landlordAddress: string;
  /** New deadline in Unix seconds. Must be strictly after the current one. */
  newDeadlineEpoch: number;
  /**
   * Optional trusted current deadline already fetched from the contract.
   * When omitted, the action reads `get_deadline()` from the contract.
   */
  currentDeadlineEpoch?: number;
}

export interface ExtendDeadlineResult {
  txHash: string;
  previousDeadlineEpoch: number;
  newDeadlineEpoch: number;
  confirmedAt: Date;
  method: ExtendMethodName;
}

export class DeadlineNotLaterError extends Error {
  readonly currentDeadlineEpoch: number;
  readonly requestedDeadlineEpoch: number;

  constructor(currentDeadlineEpoch: number, requestedDeadlineEpoch: number) {
    super(
      `New deadline (${new Date(
        requestedDeadlineEpoch * 1000
      ).toISOString()}) must be after the current deadline (${new Date(
        currentDeadlineEpoch * 1000
      ).toISOString()}).`
    );
    this.name = "DeadlineNotLaterError";
    this.currentDeadlineEpoch = currentDeadlineEpoch;
    this.requestedDeadlineEpoch = requestedDeadlineEpoch;
  }
}

export class FreighterNotAvailableError extends Error {
  constructor() {
    super("Freighter wallet extension not found. Please install it.");
    this.name = "FreighterNotAvailableError";
  }
}

export class ExtendMethodResolutionError extends Error {
  constructor() {
    super(
      "Unable to resolve a supported deadline extension method on the escrow contract."
    );
    this.name = "ExtendMethodResolutionError";
  }
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

export interface ExtendDeadlineDependencies {
  server?: rpc.Server;
  freighter?: FreighterClient;
  networkPassphrase?: string;
  rpcUrl?: string;
  sleep?: (ms: number) => Promise<void>;
  extendMethodCandidates?: readonly ExtendMethodName[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadFreighterClient(): Promise<FreighterClient> {
  if (
    typeof window === "undefined" ||
    !(window as Window & { freighter?: unknown }).freighter
  ) {
    throw new FreighterNotAvailableError();
  }

  const freighterModule = await import("@stellar/freighter-api");
  const freighter =
    "default" in freighterModule ? freighterModule.default : freighterModule;

  return {
    getAddress: freighter.getAddress,
    signTransaction: freighter.signTransaction,
  };
}

function getServer(deps: ExtendDeadlineDependencies): rpc.Server {
  return deps.server ?? new rpc.Server(deps.rpcUrl ?? RPC_URL);
}

function getNetworkPassphrase(deps: ExtendDeadlineDependencies): string {
  return deps.networkPassphrase ?? NETWORK_PASSPHRASE;
}

async function getSourceAccount(
  server: rpc.Server,
  address: string
): Promise<Account> {
  return server
    .getAccount(address)
    .catch(() => new Account(address, "0"));
}

function getSimulationReturnValue(
  simulation: rpc.Api.SimulateTransactionResponse
): unknown {
  const simulationShape = simulation as {
    result?: { retval?: unknown };
    results?: Array<{ retval?: unknown }>;
  };
  const resultRetval = simulationShape.result?.retval;
  const resultsRetval = simulationShape.results?.[0]?.retval;

  return resultRetval ?? resultsRetval;
}

function parseEpoch(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) return Number.parseInt(value, 10);

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["u64", "value"]) {
      const nested = obj[key];
      if (typeof nested === "bigint") return Number(nested);
      if (typeof nested === "number" && Number.isFinite(nested)) return nested;
      if (typeof nested === "string" && nested.length > 0) {
        return Number.parseInt(nested, 10);
      }
    }
  }

  throw new Error("Unable to parse deadline from contract response.");
}

async function simulateReadOnly(
  server: rpc.Server,
  contractId: string,
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[] = [],
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<unknown> {
  const sourceAccount = await getSourceAccount(server, sourceAddress);
  const contract = new Contract(contractId);
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(DEFAULT_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed for ${method}: ${simulation.error}`);
  }

  return getSimulationReturnValue(simulation);
}

export async function getContractDeadline(
  contractId: string,
  landlordAddress: string,
  deps: ExtendDeadlineDependencies = {}
): Promise<number> {
  const retval = await simulateReadOnly(
    getServer(deps),
    contractId,
    landlordAddress,
    "get_deadline",
    [],
    getNetworkPassphrase(deps)
  );

  return parseEpoch(scValToNative(retval as never));
}

function isMethodMissing(message: string): boolean {
  return (
    message.includes("function does not exist") ||
    message.includes("unknown function") ||
    message.includes("method not found") ||
    message.includes("MissingValue")
  );
}

async function resolveExtendMethod(
  contractId: string,
  landlordAddress: string,
  newDeadlineEpoch: number,
  deps: ExtendDeadlineDependencies
): Promise<ExtendMethodName> {
  const candidates = deps.extendMethodCandidates ?? EXTEND_METHOD_CANDIDATES;
  const server = getServer(deps);
  const networkPassphrase = getNetworkPassphrase(deps);
  const landlordArg = Address.fromString(landlordAddress).toScVal();
  const deadlineArg = nativeToScVal(newDeadlineEpoch, { type: "u64" });

  for (const method of candidates) {
    try {
      await simulateReadOnly(
        server,
        contractId,
        landlordAddress,
        method,
        [landlordArg, deadlineArg],
        networkPassphrase
      );
      return method;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMethodMissing(message)) continue;
      // Non-existence errors (auth, validation) still mean the method exists.
      return method;
    }
  }

  throw new ExtendMethodResolutionError();
}

function normalizeSignedTransactionXdr(result: FreighterSignResponse): string {
  const signedXdr = result.signedTxXdr ?? result.txXdr;

  if (typeof signedXdr !== "string" || signedXdr.length === 0) {
    throw new Error(
      result.error
        ? `Failed to sign transaction with Freighter: ${String(result.error)}`
        : "Freighter did not return a signed transaction XDR."
    );
  }

  return signedXdr;
}

export async function extendDeadline(
  params: ExtendDeadlineParams,
  deps: ExtendDeadlineDependencies = {}
): Promise<ExtendDeadlineResult> {
  const { contractId, landlordAddress, newDeadlineEpoch } = params;

  if (!Number.isFinite(newDeadlineEpoch) || newDeadlineEpoch <= 0) {
    throw new Error("New deadline must be a positive Unix timestamp.");
  }

  const server = getServer(deps);
  const networkPassphrase = getNetworkPassphrase(deps);
  const freighter = deps.freighter ?? (await loadFreighterClient());

  const currentDeadlineEpoch =
    params.currentDeadlineEpoch ??
    (await getContractDeadline(contractId, landlordAddress, {
      ...deps,
      server,
      networkPassphrase,
    }));

  if (newDeadlineEpoch <= currentDeadlineEpoch) {
    throw new DeadlineNotLaterError(currentDeadlineEpoch, newDeadlineEpoch);
  }

  const connectedAddressResult = await freighter.getAddress();
  if (connectedAddressResult.error) {
    throw new Error(
      `Failed to read connected wallet from Freighter: ${String(
        connectedAddressResult.error
      )}`
    );
  }

  const connectedAddress = connectedAddressResult.address;
  if (connectedAddress !== landlordAddress) {
    throw new Error(
      `Connected wallet (${connectedAddress.slice(0, 6)}...) does not match expected landlord (${landlordAddress.slice(0, 6)}...).`
    );
  }

  const method = await resolveExtendMethod(
    contractId,
    landlordAddress,
    newDeadlineEpoch,
    { ...deps, server, networkPassphrase }
  );

  const sourceAccount = await server.getAccount(landlordAddress);
  const contract = new Contract(contractId);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        method,
        Address.fromString(landlordAddress).toScVal(),
        nativeToScVal(newDeadlineEpoch, { type: "u64" })
      )
    )
    .setTimeout(DEFAULT_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }

  const preparedTransaction = rpc.assembleTransaction(transaction, simulation).build();
  const signedResponse = await freighter.signTransaction(
    preparedTransaction.toXDR(),
    {
      address: landlordAddress,
      networkPassphrase,
    }
  );
  const signedTxXdr = normalizeSignedTransactionXdr(signedResponse);

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

  const wait = deps.sleep ?? sleep;
  let transactionResult = await server.getTransaction(sendResult.hash);
  let retries = 0;

  while (
    transactionResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
    retries < MAX_CONFIRMATION_RETRIES
  ) {
    await wait(CONFIRMATION_DELAY_MS);
    transactionResult = await server.getTransaction(sendResult.hash);
    retries += 1;
  }

  if (transactionResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(
      `Transaction did not succeed. Status: ${transactionResult.status}`
    );
  }

  return {
    txHash: sendResult.hash,
    previousDeadlineEpoch: currentDeadlineEpoch,
    newDeadlineEpoch,
    confirmedAt: new Date(transactionResult.createdAt * 1000),
    method,
  };
}
