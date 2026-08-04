/**
 * Frontend action for calling the `add_roommate` Soroban contract method.
 * Registers a roommate and their expected rent share on an already-deployed
 * and initialized rent-escrow contract instance. Only the landlord may call
 * this (enforced on-chain via `landlord.require_auth()`).
 */

import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  rpc,
} from "@stellar/stellar-sdk";
import { signTx } from "@/lib/stellar/wallet";
import { assertValidStellarAddress, assertValidContractId } from "@/lib/stellar/validation";

const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "";
if (!rpcUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SOROBAN_RPC_URL");
}

export interface AddRoommateParams {
  /** Deployed rent escrow contract instance to add the roommate to */
  contractId: string;
  /** Landlord's public key — must match the escrow's stored landlord */
  landlord: string;
  /** The roommate being registered */
  roommateAddress: string;
  /** Expected share in token units (i128) */
  shareAmount: bigint;
}

export interface AddRoommateResult {
  success: boolean;
  txHash: string;
  ledger: number;
}

/**
 * Builds, simulates, signs, and submits an `add_roommate` invocation.
 */
export async function addRoommate(
  params: AddRoommateParams
): Promise<AddRoommateResult> {
  const { contractId, landlord, roommateAddress, shareAmount } = params;
  assertValidContractId(contractId);
  assertValidStellarAddress(landlord);
  assertValidStellarAddress(roommateAddress);

  if (shareAmount <= BigInt(0)) {
    throw new Error("shareAmount must be greater than 0");
  }

  const server = new rpc.Server(rpcUrl);
  const sourceAccount = await server.getAccount(landlord);

  const contract = new Contract(contractId);
  const operation = contract.call(
    "add_roommate",
    nativeToScVal(Address.fromString(landlord), { type: "address" }),
    nativeToScVal(Address.fromString(roommateAddress), { type: "address" }),
    nativeToScVal(shareAmount, { type: "i128" })
  );

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simulated = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTx = rpc.assembleTransaction(transaction, simulated).build();

  const signedXdr = await signTx(assembledTx.toXDR(), "TESTNET");
  if (!signedXdr) {
    throw new Error("Transaction signing was rejected or failed");
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResult.status}`);
  }

  const txHash = sendResult.hash;
  let getResult = await server.getTransaction(txHash);

  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    getResult = await server.getTransaction(txHash);
  }

  if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error("Transaction failed on-chain");
  }

  return {
    success: true,
    txHash,
    ledger: getResult.latestLedger,
  };
}
