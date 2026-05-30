import type { EscrowContract, LandlordStats, ContractState, ContractBasicInfo, RoommateState } from "./types";
import { assertValidStellarAddress, assertValidContractId } from "./validation";

/**
 * @description Retrieves all escrow contracts where the given address is the landlord,
 * by scanning transaction history for invoked contracts and filtering by landlord field.
 * @param address - The Stellar public key of the landlord to query.
 * @returns A promise that resolves to an array of escrow contracts owned by the landlord.
 * @throws {ContractQueryError} If a contract state query fails for any contract.
 */
export async function getLandlordEscrows(address: string): Promise<EscrowContract[]> {
  assertValidStellarAddress(address);
  const { createHorizonClient, fetchTransactionHistory } = await import("./history");
  const client = createHorizonClient();

  const contractIds = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const result = await fetchTransactionHistory({
      client,
      accountId: address,
      cursor,
      limit: 50,
      includeOperations: true,
    });

    for (const tx of result.transactions) {
      for (const op of tx.operations) {
        if (op.type === "invoke_host_function" && op.contractId) {
          contractIds.add(op.contractId);
        }
      }
    }

    if (!result.nextCursor || result.transactions.length === 0) break;
    cursor = result.nextCursor;
  }

  const escrows: EscrowContract[] = [];

  await Promise.all(
    Array.from(contractIds).map(async (contractId) => {
      try {
        const state = await getContractState(contractId);
        if (state.landlord === address) {
          escrows.push({
            id: state.id,
            landlord: state.landlord,
            totalRent: state.totalRent,
            deadline: state.deadline,
            deadlineEpoch: state.deadlineEpoch,
            status: state.status,
            totalFunded: state.totalFunded,
          });
        }
      } catch {
        // not an escrow contract or contract unavailable, skip
      }
    })
  );

  return escrows;
}

/**
 * @description Computes aggregate statistics for a landlord by fetching all their escrows
 * and summarising total escrowed, active escrow count, and total released amounts.
 * @param address - The Stellar public key of the landlord.
 * @returns A promise resolving to an object with totalEscrowed, activeEscrows, and totalReleased.
 * @throws {ContractQueryError} If the underlying getLandlordEscrows call fails.
 */
export async function getLandlordStats(address: string): Promise<LandlordStats> {
  const escrows = await getLandlordEscrows(address);

  const totalEscrowed = escrows.reduce((sum, e) => sum + Number(e.totalRent), 0);
  const activeEscrows = escrows.filter(
    (e) => e.status === "active" || e.status === "funded"
  ).length;
  const totalReleased = escrows
    .filter((e) => e.status === "released")
    .reduce((sum, e) => sum + Number(e.totalRent), 0);

  return { totalEscrowed, activeEscrows, totalReleased };
}
import type { xdr } from "@stellar/stellar-sdk";
import { withRetry } from "./retry.ts";


// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SimulateTransactionResponse {
  error?: string;
  results?: Array<{ retval?: unknown; auth?: string[] }>;
}

export interface SorobanQueryClient {
  simulateTransaction(xdr: string): Promise<SimulateTransactionResponse>;
}

export interface BuildInvocationParams {
  contractId: string;
  method: string;
  args?: unknown[];
}

export interface ContractQueryBuilder {
  buildInvocationXdr(params: BuildInvocationParams): string;
}

export interface QueryContext {
  client: SorobanQueryClient;
  builder: ContractQueryBuilder;
  contractId: string;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class ContractQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractQueryError";
  }
}

// ─── Read-only getters ────────────────────────────────────────────────────────

/**
 * @description Returns the landlord `Address` stored in the escrow contract.
 * Maps to `get_landlord()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to the landlord's Stellar address as a string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getLandlord(ctx: QueryContext): Promise<string> {
  return callReadOnly(ctx, "get_landlord", [], parseAddressRetval);
}

/**
 * @description Returns the token contract `Address` used by the escrow for payments.
 * Maps to `get_token_address()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to the token contract address as a string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getTokenAddress(ctx: QueryContext): Promise<string> {
  return callReadOnly(ctx, "get_token_address", [], parseAddressRetval);
}

/**
 * @description Returns the total rent amount (`i128`) as a decimal string.
 * Returns `"0"` when the escrow has not been initialized.
 * Maps to `get_amount()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to the total rent amount as a decimal string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getTotal(ctx: QueryContext): Promise<string> {
  return callReadOnly(ctx, "get_amount", [], parseI128Retval);
}

/**
 * @description Returns the deadline ledger timestamp (`u64`) as a decimal string.
 * Maps to `get_deadline()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to the deadline epoch timestamp as a decimal string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getDeadline(ctx: QueryContext): Promise<string> {
  return callReadOnly(ctx, "get_deadline", [], parseU64Retval);
}

/**
 * @description Returns the amount paid so far by `address` (`i128`) as a decimal string.
 * Returns `"0"` when the address is not a registered roommate.
 * Maps to `get_balance(from)` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @param address - The Stellar public key of the roommate whose contribution to look up.
 * @returns A promise resolving to the paid amount as a decimal string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getBalance(
  ctx: QueryContext,
  address: string
): Promise<string> {
  return callReadOnly(
    ctx,
    "get_balance",
    [{ address }],
    parseI128Retval
  );
}

/**
 * @description Returns the sum of all roommate contributions (`i128`) as a decimal string.
 * Maps to `get_total_funded()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to the total funded amount as a decimal string.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function getTotalFunded(ctx: QueryContext): Promise<string> {
  return callReadOnly(ctx, "get_total_funded", [], parseI128Retval);
}

/**
 * @description Returns `true` when total contributions meet or exceed the rent goal.
 * Maps to `is_fully_funded()` on the Rust contract.
 * @param ctx - The query context containing the Soroban client, builder, and contract ID.
 * @returns A promise resolving to `true` if fully funded, `false` otherwise.
 * @throws {ContractQueryError} If the simulation fails or the return value cannot be parsed.
 */
export async function isFullyFunded(ctx: QueryContext): Promise<boolean> {
  return callReadOnly(ctx, "is_fully_funded", [], parseBoolRetval);
}

// ─── Generic read-only caller ─────────────────────────────────────────────────

async function callReadOnly<T>(
  ctx: QueryContext,
  method: string,
  args: unknown[],
  parse: (retval: unknown) => T
): Promise<T> {
  const xdr = ctx.builder.buildInvocationXdr({
    contractId: ctx.contractId,
    method,
    args,
  });

  let response: SimulateTransactionResponse;
  try {
    response = await ctx.client.simulateTransaction(xdr);
  } catch (err) {
    throw new ContractQueryError(
      `Simulation request failed for ${method}: ${String(err)}`
    );
  }

  if (response.error) {
    throw new ContractQueryError(
      `Contract query error in ${method}: ${response.error}`
    );
  }

  const retval = response.results?.[0]?.retval;

  try {
    return parse(retval);
  } catch (err) {
    if (err instanceof ContractQueryError) throw err;
    throw new ContractQueryError(
      `Failed to parse return value for ${method}: ${String(err)}`
    );
  }
}

// ─── ScVal parsers ────────────────────────────────────────────────────────────

function parseAddressRetval(retval: unknown): string {
  if (typeof retval === "string" && retval.length > 0) return retval;

  if (retval !== null && typeof retval === "object") {
    const obj = retval as Record<string, unknown>;

    if (typeof obj.address === "string") return obj.address;

    if (obj.address !== null && typeof obj.address === "object") {
      const addr = obj.address as Record<string, unknown>;
      if (typeof addr.accountId === "string") return addr.accountId;
      if (typeof addr.contractId === "string") return addr.contractId;
    }

    if (typeof obj.accountId === "string") return obj.accountId;
    if (typeof obj.contractId === "string") return obj.contractId;
  }

  throw new ContractQueryError(
    `Cannot parse Address from retval: ${JSON.stringify(retval)}`
  );
}

function parseI128Retval(retval: unknown): string {
  if (typeof retval === "string") return retval;
  if (typeof retval === "number") return String(retval);
  if (typeof retval === "bigint") return String(retval);

  if (retval !== null && typeof retval === "object") {
    const obj = retval as Record<string, unknown>;

    // { i128: "100" } or { i128: 100n }
    const flat = obj.i128;
    if (
      typeof flat === "string" ||
      typeof flat === "number" ||
      typeof flat === "bigint"
    ) {
      return String(flat);
    }

    // { i128: { hi: "0", lo: "100" } } — reconstruct from hi/lo u64 halves.
    // hi occupies the upper 64 bits: value = hi * 2^64 + lo.
    if (flat !== null && typeof flat === "object") {
      const parts = flat as Record<string, unknown>;
      const hi = Number(parts.hi ?? 0);
      const lo = Number(parts.lo ?? 0);
      // 2^64 = 18446744073709551616
      const TWO_POW_64 = 18446744073709551616;
      return String(hi * TWO_POW_64 + lo);
    }

    if (
      typeof obj.value === "string" ||
      typeof obj.value === "number" ||
      typeof obj.value === "bigint"
    ) {
      return String(obj.value);
    }
  }

  throw new ContractQueryError(
    `Cannot parse i128 from retval: ${JSON.stringify(retval)}`
  );
}

function parseU64Retval(retval: unknown): string {
  if (typeof retval === "string") return retval;
  if (typeof retval === "number") return String(retval);
  if (typeof retval === "bigint") return String(retval);

  if (retval !== null && typeof retval === "object") {
    const obj = retval as Record<string, unknown>;

    const flat = obj.u64;
    if (
      typeof flat === "string" ||
      typeof flat === "number" ||
      typeof flat === "bigint"
    ) {
      return String(flat);
    }

    if (
      typeof obj.value === "string" ||
      typeof obj.value === "number" ||
      typeof obj.value === "bigint"
    ) {
      return String(obj.value);
    }
  }

  throw new ContractQueryError(
    `Cannot parse u64 from retval: ${JSON.stringify(retval)}`
  );
}

function parseBoolRetval(retval: unknown): boolean {
  if (typeof retval === "boolean") return retval;

  if (retval !== null && typeof retval === "object") {
    const obj = retval as Record<string, unknown>;
    if (typeof obj.bool === "boolean") return obj.bool;
    if (typeof obj.value === "boolean") return obj.value;
  }

  throw new ContractQueryError(
    `Cannot parse bool from retval: ${JSON.stringify(retval)}`
  );
}

// ─── Full contract state ──────────────────────────────────────────────────────


// ─── Basic contract info (for /pay/[contractId]) ─────────────────────────────


/**
 * @description Returns the essential fields needed to render the contribute/pay page,
 * or `null` when the contract does not exist or its data cannot be read.
 * @param contractId - The Soroban contract ID to query.
 * @returns A promise resolving to a `ContractBasicInfo` object, or `null` on failure.
 * @throws Never — errors are caught internally and converted to a `null` return value.
 */
export async function getContractBasicInfo(
  contractId: string
): Promise<ContractBasicInfo | null> {
  assertValidContractId(contractId);
  try {
    const { rpcServer, networkPassphrase } = await import("./config.ts");
    const {
      TransactionBuilder,
      Account,
      Contract,
      scValToNative,
      rpc: rpcHelpers,
    } = await import("@stellar/stellar-sdk");

    const buildInvocationXdr = ({
      contractId: cId,
      method,
      args = [],
    }: BuildInvocationParams): string => {
      const contract = new Contract(cId);
      const source = new Account(cId, "0");
      const tx = new TransactionBuilder(source, {
        fee: "100",
        networkPassphrase,
      })
        .addOperation(contract.call(method, ...(args as xdr.ScVal[])))
        .setTimeout(60)
        .build();
      return tx.toXDR();
    };

    const ctx: QueryContext = {
      client: {
        async simulateTransaction(
          xdrStr: string
        ): Promise<SimulateTransactionResponse> {
          try {
            const tx = TransactionBuilder.fromXDR(xdrStr, networkPassphrase);
            const result = await withRetry(() =>
              rpcServer.simulateTransaction(tx)
            );
            if (rpcHelpers.Api.isSimulationError(result)) {
              return { error: result.error };
            }
            let retval: unknown = undefined;
            if (
              rpcHelpers.Api.isSimulationSuccess(result) &&
              result.result?.retval
            ) {
              try {
                retval = scValToNative(result.result.retval);
              } catch {
                retval = result.result.retval.toString();
              }
            }
            return { results: retval !== undefined ? [{ retval }] : [] };
          } catch (err) {
            throw new ContractQueryError(
              `Soroban RPC simulation failed: ${String(err)}`
            );
          }
        },
      },
      builder: { buildInvocationXdr },
      contractId,
    };

    const [landlord, totalRent, deadline, token] = await Promise.all([
      getLandlord(ctx),
      getTotal(ctx),
      getDeadline(ctx),
      getTokenAddress(ctx),
    ]);

    return { landlord, totalRent, deadline, token };
  } catch {
    return null;
  }
}

/**
 * @description Fetches the full on-chain state of an escrow contract, including landlord,
 * rent amounts, deadline, funding status, and roommate list.
 * @param contractId - The Soroban contract ID to query.
 * @returns A promise resolving to a fully-populated `ContractState` object.
 * @throws {ContractQueryError} If any individual field query fails or the RPC call errors.
 */
export async function getContractState(contractId: string): Promise<ContractState> {
  assertValidContractId(contractId);
  const { rpcServer, networkPassphrase } = await import("./config.ts");
  const { TransactionBuilder, Account, Contract, scValToNative, rpc: rpcHelpers } = await import("@stellar/stellar-sdk");

  const buildInvocationXdr = ({ contractId, method, args = [] }: BuildInvocationParams): string => {
    const contract = new Contract(contractId);
    const source = new Account(contractId, "0");

    const tx = new TransactionBuilder(source, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...(args as xdr.ScVal[])))
      .setTimeout(60)
      .build();

    return tx.toXDR();
  };

  const ctx: QueryContext = {
    client: {
      async simulateTransaction(xdrStr: string): Promise<SimulateTransactionResponse> {
        try {
          const tx = TransactionBuilder.fromXDR(xdrStr, networkPassphrase);
          const result = await withRetry(() => rpcServer.simulateTransaction(tx));

          if (rpcHelpers.Api.isSimulationError(result)) {
            return { error: result.error };
          }

          let retval: unknown = undefined;
          if (rpcHelpers.Api.isSimulationSuccess(result) && result.result?.retval) {
            try {
              retval = scValToNative(result.result.retval);
            } catch {
              retval = result.result.retval.toString();
            }
          }

          return {
            results: retval !== undefined ? [{ retval }] : [],
          };
        } catch (err) {
          throw new ContractQueryError(`Soroban RPC simulation failed: ${String(err)}`);
        }
      },
    },
    builder: { buildInvocationXdr },
    contractId,
  };

  try {
    const [id, landlord, totalRent, deadlineStr, totalFunded, isFunded] = await Promise.all([
      Promise.resolve(contractId),
      (async () => {
        try { return await getLandlord(ctx); }
        catch (err) { throw new ContractQueryError(`Failed to query landlord address: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await getTotal(ctx); }
        catch (err) { throw new ContractQueryError(`Failed to query total rent: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await getDeadline(ctx); }
        catch (err) { throw new ContractQueryError(`Failed to query deadline: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try {
          const fundedStr = await getTotalFunded(ctx);
          return Number(fundedStr);
        }
        catch (err) { throw new ContractQueryError(`Failed to query total funded: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await isFullyFunded(ctx); }
        catch (err) { throw new ContractQueryError(`Failed to query funding status: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
    ]);

    const deadlineEpoch = parseInt(deadlineStr, 10);
    const status = isFunded ? "funded" as const : "active" as const;

    return {
      id,
      landlord,
      totalRent,
      deadline: new Date(deadlineEpoch * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      }),
      deadlineEpoch,
      status,
      totalFunded,
      lastUpdate: new Date().toISOString(),
      roommates: [],
    };
  } catch (err) {
    if (err instanceof ContractQueryError) throw err;
    throw new ContractQueryError(`Failed to fetch contract state: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * @description Fetches the native XLM balance for a Stellar account as a JavaScript number.
 * @param publicKey - The Stellar public key (G…) of the account to query.
 * @returns A promise resolving to the XLM balance as a number.
 * @throws {Error} If the account is not found on the network or the balance fetch fails.
 */
export async function getAccountBalance(publicKey: string): Promise<number> {
  assertValidStellarAddress(publicKey);
  const { fetchXlmBalance } = await import("./horizon.ts");
  const { getCurrentNetwork } = await import("./explorer.ts");

  try {
    const balanceStr = await fetchXlmBalance(publicKey, getCurrentNetwork());
    return Number(balanceStr);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new Error(`Account not found: ${publicKey}`);
    }
    throw err;
  }
}

/**
 * @description Fetches the native XLM balance for a Stellar account as a decimal string.
 * Prefer this over `getAccountBalance` when precision beyond a JS number is needed.
 * @param publicKey - The Stellar public key (G…) of the account to query.
 * @returns A promise resolving to the XLM balance as a string (e.g. "9999.9999999").
 * @throws {Error} If the account is not found on the network or the balance fetch fails.
 */
export async function getNativeBalance(publicKey: string): Promise<string> {
  assertValidStellarAddress(publicKey);
  const { fetchXlmBalance } = await import("./horizon.ts");
  const { getCurrentNetwork } = await import("./explorer.ts");

  try {
    return await fetchXlmBalance(publicKey, getCurrentNetwork());
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new Error(`Account not found: ${publicKey}`);
    }
    throw err;
  }
}

// ─── Horizon: fee stats ───────────────────────────────────────────────────────

export interface FeeStats {
  baseFeeStroops: string;
  baseFeeXlm: string;
}

const FEE_STATS_HORIZON_URLS = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
} as const;

export type FeeStatsNetwork = keyof typeof FEE_STATS_HORIZON_URLS;

type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/**
 * @description Fetches current fee statistics from the Horizon API for the specified network.
 * Returns the base fee in both stroops and XLM.
 * @param network - The Stellar network to query (`"testnet"` or `"mainnet"`). Defaults to `"testnet"`.
 * @param fetchImpl - Optional fetch implementation (defaults to global `fetch`). Useful for testing.
 * @param options - Optional request options including an `AbortSignal` for cancellation.
 * @returns A promise resolving to a `FeeStats` object with `baseFeeStroops` and `baseFeeXlm`.
 * @throws {Error} If the Horizon request fails or returns a non-numeric fee value.
 */
export async function getFeeStats(
  network: FeeStatsNetwork = "testnet",
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  options: { signal?: AbortSignal } = {}
): Promise<FeeStats> {
  const url = `${FEE_STATS_HORIZON_URLS[network]}/fee_stats`;

  const response = await withRetry(() => fetchImpl(url, { signal: options.signal }));

  if (!response.ok) {
    throw new Error(`Horizon fee_stats request failed: ${response.status}`);
  }

  const data = (await response.json()) as { last_ledger_base_fee?: unknown };
  const raw = data.last_ledger_base_fee;
  const stroops =
    typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : "";

  if (!/^\d+$/.test(stroops)) {
    throw new Error(
      "Invalid fee_stats response: missing or non-numeric last_ledger_base_fee"
    );
  }

  return {
    baseFeeStroops: stroops,
    baseFeeXlm: stroopsToXlm(stroops),
  };
}

function stroopsToXlm(stroops: string): string {
  const STROOPS_PER_XLM = BigInt(10_000_000);
  const value = BigInt(stroops);
  const whole = value / STROOPS_PER_XLM;
  const fraction = value % STROOPS_PER_XLM;
  const fractionStr = fraction.toString().padStart(7, "0").replace(/0+$/, "");
  return fractionStr.length > 0 ? `${whole}.${fractionStr}` : whole.toString();
}

// ─── Release approvals ───────────────────────────────────────────────────────

export interface ReleaseApprovalSnapshot {
  signerAddress: string;
  approvedAt: Date;
}

/**
 * Returns a list of release approvals already collected for the escrow.
 *
 * The on-chain release method is a single atomic call rather than a long-lived
 * vote, so approvals do not live on the contract directly. They are persisted
 * client-side once a wallet signs the release XDR (see `MultiSigApproval`).
 *
 * Callers pass the addresses they have local evidence of approval for; this
 * helper attaches the canonical timestamp shape `ApprovalStatus` consumes
 * and filters out unknown signers so the UI never claims a stranger approved.
 *
 * Returning a stable, queryable shape from this module keeps the visualization
 * layer ignorant of where approval evidence is stored (localStorage today,
 * a backend table tomorrow).
 */
export function getReleaseApprovalsForSigners(
  signerAddresses: string[],
  approvedAddresses: Iterable<string>,
  now: Date = new Date()
): ReleaseApprovalSnapshot[] {
  const signerSet = new Set(signerAddresses);
  const seen = new Set<string>();
  const result: ReleaseApprovalSnapshot[] = [];

  for (const address of approvedAddresses) {
    if (!signerSet.has(address) || seen.has(address)) continue;
    seen.add(address);
    result.push({ signerAddress: address, approvedAt: now });
  }

  return result;
}

// ─── User Escrows (Mocked) ───────────────────────────────────────────────────

/**
 * @description Returns a mocked list of escrow contracts associated with a wallet public key.
 * Simulates a network delay and returns deterministic fixture data for UI development.
 * @param publicKey - The Stellar public key of the connected wallet.
 * @returns A promise resolving to an array of `ContractState` objects for the given wallet.
 * @throws Never — this is a mock implementation that always resolves successfully.
 */
export async function getUserEscrows(publicKey: string): Promise<ContractState[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mocked list of escrows for the connected wallet
  return [
    {
      id: "ESCROW_A1B2C3D4",
      landlord: "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
      totalRent: "1500",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      }),
      deadlineEpoch: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60,
      status: "active",
      totalFunded: 750,
      lastUpdate: new Date().toISOString(),
      roommates: [
        {
          address: publicKey,
          expectedShare: "750",
          paidAmount: "750",
          isPaid: true
        },
        {
          address: "GBY4H3...9K2L",
          expectedShare: "750",
          paidAmount: "0",
          isPaid: false
        }
      ]
    },
    {
      id: "ESCROW_X9Y8Z7W6",
      landlord: "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
      totalRent: "2000",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      }),
      deadlineEpoch: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
      status: "funded",
      totalFunded: 2000,
      lastUpdate: new Date().toISOString(),
      roommates: [
        {
          address: publicKey,
          expectedShare: "1000",
          paidAmount: "1000",
          isPaid: true
        },
        {
          address: "GBY4H3...9K2L",
          expectedShare: "1000",
          paidAmount: "1000",
          isPaid: true
        }
      ]
    }
  ];
}
